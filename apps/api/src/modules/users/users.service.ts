import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '../../../generated/prisma';
import * as bcrypt from 'bcryptjs';

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  role?: UserRole;
  timezone?: string;
  locale?: string;
  preferences?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = {
      ...dto,
      preferences: dto.preferences as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updatePreferences(id: string, preferences: Record<string, unknown>): Promise<User> {
    const user = await this.findOne(id);
    const currentPrefs = (user.preferences as Record<string, unknown>) || {};

    return this.prisma.user.update({
      where: { id },
      data: {
        preferences: { ...currentPrefs, ...preferences } as Prisma.InputJsonValue,
      },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log('User deactivated', { userId: id });
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (!user.password) {
      throw new BadRequestException('This account uses external authentication and cannot change password');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    this.logger.log('User password changed', { userId: id });
  }
}
