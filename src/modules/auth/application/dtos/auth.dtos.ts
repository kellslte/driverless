import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'rider@example.com' })
    @IsEmail({}, { message: 'Must be a valid email address.' })
    email!: string;

    @ApiProperty({ example: 'SecureP@ss123' })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}

export class RefreshTokenDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5...' })
    @IsString()
    @MinLength(10)
    refreshToken!: string;
}
