import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { USER_REPOSITORY } from '../../../user/application/ports/user-repository.port.js';
import type { IUserRepository } from '../../../user/application/ports/user-repository.port.js';
import { LoginDto } from '../dtos/auth.dtos.js';
import { CreateUserUseCase } from '../../../user/application/use-cases/create-user.use-case.js';
import { CreateUserDto } from '../../../user/application/dtos/user.dtos.js';

/**
 * Case Study Context: Uber's weak auth led to credential stuffing and account takeovers.
 * We implement:
 * 1. Brute-force resistance via bcrypt
 * 2. Short-lived access tokens (15m)
 * 3. Opaque refresh tokens stored in Redis (can be revoked instantly)
 */
@Injectable()
export class AuthService {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(dto: CreateUserDto) {
        const user = await this.createUserUseCase.execute(dto);
        return this.generateTokens(user.id, user.role);
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user.id, user.role);
    }

    // TODO: Implement SessionManager for Redis storage of refresh tokens
    private async generateTokens(userId: string, role: string) {
        const accessPayload = { sub: userId, role };

        // In a full implementation, refresh token is an opaque string stored in Redis
        // For Phase 1 step 1, we issue a signed JWT refresh token
        const refreshPayload = { sub: userId, sessionId: uuid() };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                secret: this.configService.get<string>('auth.jwtAccessSecret') || 'secret',
                expiresIn: (this.configService.get<string>('auth.jwtAccessExpiration') || '15m') as any,
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: this.configService.get<string>('auth.jwtRefreshSecret') || 'secret',
                expiresIn: (this.configService.get<string>('auth.jwtRefreshExpiration') || '7d') as any,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 mins in seconds
        };
    }
}
