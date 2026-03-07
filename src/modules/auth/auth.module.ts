import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserModule } from '../user/user.module.js';
import { AuthService } from './application/services/auth.service.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { AuthController } from './presentation/controllers/auth.controller.js';

@Module({
    imports: [
        UserModule, // Need access to USER_REPOSITORY
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('auth.jwtAccessSecret'),
                signOptions: {
                    expiresIn: (configService.get<string>('auth.jwtAccessExpiration') || '15m') as any,
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService], // For module interoperability
})
export class AuthModule { }
