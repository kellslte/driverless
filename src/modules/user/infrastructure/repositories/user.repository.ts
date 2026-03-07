import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../application/ports/user-repository.port.js';
import { UserEntity } from './user.schema.js';
import { User } from '../../domain/entities/user.entity.js';
import { UserMapper } from '../mappers/user.mapper.js';
// Event bus to be implemented later; in Phase 1 we log events
import { Logger } from '@nestjs/common';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
    private readonly logger = new Logger(TypeOrmUserRepository.name);

    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
        private readonly mapper: UserMapper,
    ) { }

    async save(user: User): Promise<void> {
        const entity = this.mapper.toPersistence(user);
        await this.repository.save(entity);

        // Dispatch domain events
        for (const event of user.domainEvents) {
            // In a full implementation, emit to RabbitMQ/EventBus here
            this.logger.log(`Domain Event Fired: ${event.eventName}`, event.payload);
        }
        user.clearDomainEvents();
    }

    async findById(id: string): Promise<User | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return this.mapper.toDomain(entity);
    }

    async findByEmail(email: string): Promise<User | null> {
        // ⚠️ We search using the blind HMAC index, NOT the encrypted ciphertext
        const emailHash = this.mapper.createBlindIndex(email);
        const entity = await this.repository.findOne({ where: { emailHash } });
        if (!entity) return null;
        return this.mapper.toDomain(entity);
    }

    async findByPhone(phone: string): Promise<User | null> {
        const phoneHash = this.mapper.createBlindIndex(phone);
        const entity = await this.repository.findOne({ where: { phoneHash } });
        if (!entity) return null;
        return this.mapper.toDomain(entity);
    }

    async delete(id: string): Promise<void> {
        // Actual deletions should be handled by Use Case logic calling user.softDelete()
        // and then repository.save(). This is just a physical delete fallback.
        await this.repository.delete(id);
    }

    async findAll(filters?: {
        role?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ users: User[]; total: number }> {
        const query = this.repository.createQueryBuilder('user');

        if (filters?.role) {
            query.andWhere('user.role = :role', { role: filters.role });
        }
        if (filters?.status) {
            query.andWhere('user.status = :status', { status: filters.status });
        }

        const { limit = 10, offset = 0 } = filters || {};
        query.skip(offset).take(limit).orderBy('user.created_at', 'DESC');

        const [entities, total] = await query.getManyAndCount();

        return {
            users: entities.map((e) => this.mapper.toDomain(e)),
            total,
        };
    }
}
