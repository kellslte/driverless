import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/repositories/user.schema.js';
import { TypeOrmUserRepository } from './infrastructure/repositories/user.repository.js';
import { USER_REPOSITORY } from './application/ports/user-repository.port.js';
import { UserMapper } from './infrastructure/mappers/user.mapper.js';
import { PiiEncryptionService } from './infrastructure/encryption/pii-encryption.service.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case.js';
import { UserController } from './presentation/controllers/user.controller.js';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [UserController],
    providers: [
        // Infrastructure
        PiiEncryptionService,
        UserMapper,
        {
            provide: USER_REPOSITORY,
            useClass: TypeOrmUserRepository,
        },
        // Application (Use Cases)
        CreateUserUseCase,
        GetProfileUseCase,
        UpdateProfileUseCase,
    ],
    exports: [USER_REPOSITORY], // Export port for other modules (like Auth) to inject
})
export class UserModule { }
