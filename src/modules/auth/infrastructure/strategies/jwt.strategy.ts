import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../../user/application/ports/user-repository.port.js';
import type { IUserRepository } from '../../../user/application/ports/user-repository.port.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.jwtAccessSecret') || 'change-me',
        });
    }

    /**
     * Called automatically by Passport after JWT signature is verified.
     * returning the user assigns it to `req.user`.
     */
    async validate(payload: { sub: string; role: string }) {
        const user = await this.userRepository.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User not found or token invalid');
        }
        // Only put what's needed on the request object.
        return { id: payload.sub, role: payload.role };
    }
}
