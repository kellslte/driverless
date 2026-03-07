import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service.js';
import { LoginDto } from '../../application/dtos/auth.dtos.js';
import { CreateUserDto } from '../../../user/application/dtos/user.dtos.js';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user and get tokens' })
    @ApiResponse({ status: 201, description: 'Successfully registered' })
    @ApiResponse({ status: 409, description: 'Email/phone conflict' })
    async register(@Body() dto: CreateUserDto) {
        const tokens = await this.authService.register(dto);
        return { data: tokens };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto) {
        const tokens = await this.authService.login(dto);
        return { data: tokens };
    }
}
