import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, InputJsonValue, Prisma } from '../../../generated/prisma';

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  role?: UserRole;
  timezone?: string;
  locale?: string;
  preferences?: Record<string, unknown>;
  isActive?: boolean;
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
      preferences: dto.preferences as InputJsonValue | undefined,
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
        preferences: { ...currentPrefs, ...preferences } as InputJsonValue,
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
}
