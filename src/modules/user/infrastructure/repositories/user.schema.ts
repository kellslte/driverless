import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole, UserStatus } from '../../domain/enums/index.js';

/**
 * TypeORM Entity schema for the User table.
 * Distinct from the domain entity `User` to physically separate persistence
 * details from business invariants.
 *
 * Case Study Context: PII fields (email, phone, firstName, lastName) are stored
 * encrypted. The encryption/decryption happens in the repository via the mapper.
 */
@Entity('users')
export class UserEntity {
    @PrimaryColumn('uuid')
    id!: string;

    // Encrypted at rest
    @Column({ name: 'email', type: 'varchar', unique: true })
    encryptedEmail!: string;

    // Encrypted at rest
    @Column({ name: 'phone', type: 'varchar', unique: true })
    encryptedPhone!: string;

    // Encrypted at rest
    @Column({ name: 'first_name', type: 'text' })
    encryptedFirstName!: string;

    // Encrypted at rest
    @Column({ name: 'last_name', type: 'text' })
    encryptedLastName!: string;

    // To allow deterministic searching on email/phone without decrypting the whole table,
    // we could store a blind index (HMAC of email). For Phase 1 simplicity, we assume
    // lookups happen via blind index or standard DB queries if encryption operates at DB layer.
    // In our app-layer encryption model, we'll store a blind index:
    @Column({ name: 'email_hash', type: 'varchar', unique: true })
    emailHash!: string;

    @Column({ name: 'phone_hash', type: 'varchar', unique: true })
    phoneHash!: string;

    @Column({ name: 'password_hash', type: 'varchar' })
    passwordHash!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.RIDER })
    role!: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING_VERIFICATION,
    })
    status!: UserStatus;

    @Column({ name: 'email_verified', default: false })
    emailVerified!: boolean;

    @Column({ name: 'phone_verified', default: false })
    phoneVerified!: boolean;

    @Column({ name: 'profile_photo_url', type: 'varchar', nullable: true })
    profilePhotoUrl!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt!: Date | null;
}
