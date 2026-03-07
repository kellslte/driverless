import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user-repository.port.js';
import { CreateUserDto } from '../dtos/user.dtos.js';
import { User } from '../../domain/entities/user.entity.js';
import { UserRole } from '../../domain/enums/user-role.enum.js';
import type { IUserRepository } from '../ports/user-repository.port.js';
// We'll import password hashing from a shared service later,
// for now we'll simulate it as this is just the user module.
// In Phase 1D (Auth), we'll implement BcryptService.
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async execute(dto: CreateUserDto): Promise<User> {
        // 1. Check if email exists
        const existingEmail = await this.userRepository.findByEmail(dto.email);
        if (existingEmail) {
            throw new ConflictException('A user with this email already exists.');
        }

        // 2. Check if phone exists
        const existingPhone = await this.userRepository.findByPhone(dto.phone);
        if (existingPhone) {
            throw new ConflictException('A user with this phone number already exists.');
        }

        // 3. Hash password (salt rounds = 12)
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(dto.password, salt);

        // 4. Create entity (enforces invariants internally)
        const user = User.create({
            email: dto.email,
            phone: dto.phone,
            firstName: dto.firstName,
            lastName: dto.lastName,
            passwordHash,
            role: dto.role || UserRole.RIDER,
        });

        // 5. Persist
        await this.userRepository.save(user);

        // 6. Return created entity
        return user;
    }
}
