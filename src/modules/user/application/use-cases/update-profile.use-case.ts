import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user-repository.port.js';
import type { IUserRepository } from '../ports/user-repository.port.js';
import { UpdateProfileDto } from '../dtos/user.dtos.js';
import { User } from '../../domain/entities/user.entity.js';

@Injectable()
export class UpdateProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string, dto: UpdateProfileDto): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        // Domain entity enforces invariants on update
        user.updateProfile(dto);

        await this.userRepository.save(user);

        return user;
    }
}
