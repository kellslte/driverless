import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user-repository.port.js';
import type { IUserRepository } from '../ports/user-repository.port.js';
import { User } from '../../domain/entities/user.entity.js';

@Injectable()
export class GetProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        return user;
    }
}
