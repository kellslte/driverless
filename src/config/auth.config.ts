import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change-me',
    jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
