import { Injectable } from '@nestjs/common';
import { User, UserProps } from '../../domain/entities/user.entity.js';
import { UserEntity } from '../repositories/user.schema.js';
import { PiiEncryptionService } from '../encryption/pii-encryption.service.js';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserMapper {
    private readonly hmacSecret: string;

    constructor(
        private encryptionService: PiiEncryptionService,
        private configService: ConfigService,
    ) {
        this.hmacSecret = this.configService.get<string>('PII_ENCRYPTION_KEY') || 'default-secret';
    }

    /**
     * Domain User -> TypeORM UserEntity (Encrypts PII)
     */
    toPersistence(user: User): UserEntity {
        const entity = new UserEntity();
        entity.id = user.id;

        // Encrypt PII
        entity.encryptedEmail = this.encryptionService.encrypt(user.email);
        entity.encryptedPhone = this.encryptionService.encrypt(user.phone);
        entity.encryptedFirstName = this.encryptionService.encrypt(user.firstName);
        entity.encryptedLastName = this.encryptionService.encrypt(user.lastName);

        // Create blind indexes for fast exact-match lookups without decrypting
        entity.emailHash = this.createBlindIndex(user.email);
        entity.phoneHash = this.createBlindIndex(user.phone);

        // Standard fields
        entity.passwordHash = user.passwordHash;
        entity.role = user.role;
        entity.status = user.status;
        entity.emailVerified = user.emailVerified;
        entity.phoneVerified = user.phoneVerified;
        entity.profilePhotoUrl = user.profilePhotoUrl;
        entity.createdAt = user.createdAt;
        entity.updatedAt = user.updatedAt;
        entity.deletedAt = user.deletedAt;

        return entity;
    }

    /**
     * TypeORM UserEntity -> Domain User (Decrypts PII)
     */
    toDomain(entity: UserEntity): User {
        const props: UserProps = {
            id: entity.id,
            email: this.encryptionService.decrypt(entity.encryptedEmail),
            phone: this.encryptionService.decrypt(entity.encryptedPhone),
            firstName: this.encryptionService.decrypt(entity.encryptedFirstName),
            lastName: this.encryptionService.decrypt(entity.encryptedLastName),
            passwordHash: entity.passwordHash,
            role: entity.role,
            status: entity.status,
            emailVerified: entity.emailVerified,
            phoneVerified: entity.phoneVerified,
            profilePhotoUrl: entity.profilePhotoUrl,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };

        return User.fromPersistence(props);
    }

    /**
     * Creates an HMAC-SHA256 hash for deterministic searching of encrypted fields.
     */
    createBlindIndex(value: string): string {
        return crypto
            .createHmac('sha256', this.hmacSecret)
            .update(value.toLowerCase().trim())
            .digest('hex');
    }
}
