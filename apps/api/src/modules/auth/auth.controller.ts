import { Controller, Post, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthUser } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('dev-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get development token (dev only)' })
  @ApiResponse({ status: 200, description: 'Returns dev user and token' })
  async getDevToken() {
    return this.authService.createDevUser();
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns current authenticated user' })
  async getCurrentUser(@CurrentUser() user: AuthUser) {
    return user;
  }
}
