import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { MailService } from './mail.service';
import { User } from '../../../generated/prisma';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  /**
   * Register a new user with email and password
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name || dto.email.split('@')[0],
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    this.logger.log('User registered', { userId: user.id, email: user.email });

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new BadRequestException('This account uses external authentication');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    this.logger.log('User logged in', { userId: user.id, email: user.email });

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }

  /**
   * Validate user from Supabase token and sync to local DB
   */
  async validateSupabaseToken(token: string): Promise<AuthUser | null> {
    const supabaseUser = await this.supabase.verifyToken(token);

    if (!supabaseUser || !supabaseUser.email) {
      return null;
    }

    // Sync user to local database
    const user = await this.syncUser(
      supabaseUser.id,
      supabaseUser.email,
      supabaseUser.user_metadata,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Sync Supabase user to local database
   */
  async syncUser(
    id: string,
    email: string,
    metadata?: Record<string, unknown>,
  ): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const name = metadata?.name as string | undefined;
    const avatar = metadata?.avatar_url as string | undefined;

    return this.prisma.user.create({
      data: {
        id,
        email,
        name: name || email.split('@')[0],
        avatar,
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Validate JWT payload and return user
   */
  async validateJwtPayload(payload: JwtPayload): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: AuthUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwt.sign(payload);
  }

  /**
   * For development: create a test user and return token
   */
  async createDevUser(): Promise<AuthResponse> {
    const devUser = await this.prisma.user.upsert({
      where: { email: 'dev@example.com' },
      update: {},
      create: {
        email: 'dev@example.com',
        password: await bcrypt.hash('dev123', 10),
        name: 'Developer',
        role: 'ADMIN',
      },
    });

    const authUser: AuthUser = {
      id: devUser.id,
      email: devUser.email,
      name: devUser.name,
      role: devUser.role,
    };

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }

  /**
   * Generate and send verification code via email
   */
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    // Delete any existing unused codes for this email
    await this.prisma.verificationCode.deleteMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
    });

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code with 10-minute expiration
    await this.prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send the code via email
    await this.mail.sendVerificationCode(normalizedEmail, code);

    this.logger.log('Verification code sent', { email: normalizedEmail });

    return { message: 'Verification code sent' };
  }

  /**
   * Verify code and authenticate user (creates user if doesn't exist)
   */
  async verifyCode(email: string, code: string): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase();

    // Find the verification code
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark code as used
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
        },
      });
      this.logger.log('New user created via email verification', { userId: user.id });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    this.logger.log('User authenticated via email verification', { userId: user.id });

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }

  /**
   * Authenticate user via Google OAuth
   */
  async googleAuth(googleUser: {
    email: string;
    name?: string;
    picture?: string;
    googleId: string;
  }): Promise<AuthResponse> {
    const normalizedEmail = googleUser.email.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name || normalizedEmail.split('@')[0],
          avatar: googleUser.picture,
        },
      });
      this.logger.log('New user created via Google OAuth', { userId: user.id });
    } else {
      // Update avatar if not set
      if (!user.avatar && googleUser.picture) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar: googleUser.picture },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    this.logger.log('User authenticated via Google OAuth', { userId: user.id });

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }
}
