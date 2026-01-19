import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload, AuthUser } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    // Use demo secret if not configured
    const secretOrKey = config.get<string>('JWT_SECRET') || 'demo-secret-key-change-in-production';

    if (!config.get<string>('JWT_SECRET')) {
      const logger = new Logger(JwtStrategy.name);
      logger.warn('JWT_SECRET not configured - using demo secret (NOT FOR PRODUCTION)');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.authService.validateJwtPayload(payload);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
