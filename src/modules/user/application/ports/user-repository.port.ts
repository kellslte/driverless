import { User } from '../../domain/entities/index.js';

/**
 * Port interface for User persistence.
 *
 * Case Study Design: The use case depends on this interface, NOT on TypeORM.
 * This means unit tests use InMemoryUserRepository, and we can swap databases
 * without changing business logic — exactly the extraction path that would
 * have saved Uber from their monolith-to-microservices rewrite pain.
 */
export interface IUserRepository {
    save(user: User): Promise<void>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    delete(id: string): Promise<void>;
    findAll(filters?: {
        role?: string;
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ users: User[]; total: number }>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
