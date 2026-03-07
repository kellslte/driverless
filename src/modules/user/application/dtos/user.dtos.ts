import {
    IsEmail,
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/enums/index.js';

export class CreateUserDto {
    @ApiProperty({ example: 'rider@example.com' })
    @IsEmail({}, { message: 'Must be a valid email address.' })
    email!: string;

    @ApiProperty({ example: '+2348012345678', description: 'E.164 format' })
    @IsString()
    @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Must be a valid E.164 phone number.' })
    phone!: string;

    @ApiProperty({ example: 'Ada' })
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({ example: 'Okafor' })
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters.' })
    @MaxLength(128)
    password!: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.RIDER })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Adaeze' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    @ApiPropertyOptional({ example: 'Okafor-Smith' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;

    @ApiPropertyOptional({ example: 'https://cdn.driverless.dev/photos/abc.jpg' })
    @IsOptional()
    @IsString()
    profilePhotoUrl?: string;
}
