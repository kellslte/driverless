import { v4 as uuid } from 'uuid';
import { IDomainEvent } from '../../../../common/interfaces/index.js';
import { UserRole, UserStatus } from '../enums/index.js';
import { Email } from '../value-objects/email.vo.js';
import { PhoneNumber } from '../value-objects/phone-number.vo.js';
import { UserCreatedEvent } from '../events/user-created.event.js';
import { UserDeletedEvent } from '../events/user-deleted.event.js';
import { BadRequestException } from '../../../../common/exceptions/index.js';

export interface CreateUserProps {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role?: UserRole;
}

export interface UserProps {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    profilePhotoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

/**
 * User Domain Entity — the business object that owns all invariant enforcement.
 *
 * Case Study Design: Unlike Uber's original system where validation lived in
 * controllers (or nowhere), our User entity self-validates at creation and
 * rejects invalid state transitions. The entity is a pure TypeScript class
 * with ZERO framework dependencies.
 */
export class User {
    private _domainEvents: IDomainEvent[] = [];

    private constructor(private props: UserProps) { }

    // ─── Factory Method ───────────────────────────────────────────

    static create(input: CreateUserProps): User {
        // Value objects enforce format validity
        const email = Email.create(input.email);
        const phone = PhoneNumber.create(input.phone);

        if (!input.firstName || input.firstName.trim().length < 1) {
            throw new BadRequestException('First name is required.');
        }
        if (!input.lastName || input.lastName.trim().length < 1) {
            throw new BadRequestException('Last name is required.');
        }

        const now = new Date();
        const user = new User({
            id: uuid(),
            email: email.toString(),
            phone: phone.toString(),
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            passwordHash: input.passwordHash,
            role: input.role || UserRole.RIDER,
            status: UserStatus.PENDING_VERIFICATION,
            emailVerified: false,
            phoneVerified: false,
            profilePhotoUrl: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        user.addDomainEvent(
            new UserCreatedEvent({
                userId: user.id,
                email: user.email,
                role: user.role,
            }),
        );

        return user;
    }

    // ─── Reconstitution (from persistence) ────────────────────────

    static fromPersistence(props: UserProps): User {
        return new User(props);
    }

    // ─── Getters ──────────────────────────────────────────────────

    get id(): string {
        return this.props.id;
    }
    get email(): string {
        return this.props.email;
    }
    get phone(): string {
        return this.props.phone;
    }
    get firstName(): string {
        return this.props.firstName;
    }
    get lastName(): string {
        return this.props.lastName;
    }
    get fullName(): string {
        return `${this.props.firstName} ${this.props.lastName}`;
    }
    get passwordHash(): string {
        return this.props.passwordHash;
    }
    get role(): UserRole {
        return this.props.role;
    }
    get status(): UserStatus {
        return this.props.status;
    }
    get emailVerified(): boolean {
        return this.props.emailVerified;
    }
    get phoneVerified(): boolean {
        return this.props.phoneVerified;
    }
    get profilePhotoUrl(): string | null {
        return this.props.profilePhotoUrl;
    }
    get createdAt(): Date {
        return this.props.createdAt;
    }
    get updatedAt(): Date {
        return this.props.updatedAt;
    }
    get deletedAt(): Date | null {
        return this.props.deletedAt;
    }
    get domainEvents(): ReadonlyArray<IDomainEvent> {
        return this._domainEvents;
    }

    // ─── State Transitions ────────────────────────────────────────

    updateProfile(data: {
        firstName?: string;
        lastName?: string;
        profilePhotoUrl?: string | null;
    }): void {
        if (this.props.status === UserStatus.DELETED) {
            throw new BadRequestException('Cannot update a deleted account.');
        }

        if (data.firstName !== undefined) {
            if (!data.firstName.trim()) {
                throw new BadRequestException('First name cannot be empty.');
            }
            this.props.firstName = data.firstName.trim();
        }
        if (data.lastName !== undefined) {
            if (!data.lastName.trim()) {
                throw new BadRequestException('Last name cannot be empty.');
            }
            this.props.lastName = data.lastName.trim();
        }
        if (data.profilePhotoUrl !== undefined) {
            this.props.profilePhotoUrl = data.profilePhotoUrl;
        }

        this.props.updatedAt = new Date();
    }

    verifyEmail(): void {
        this.props.emailVerified = true;
        this.props.updatedAt = new Date();
        this.activateIfFullyVerified();
    }

    verifyPhone(): void {
        this.props.phoneVerified = true;
        this.props.updatedAt = new Date();
        this.activateIfFullyVerified();
    }

    suspend(): void {
        if (this.props.status === UserStatus.DELETED) {
            throw new BadRequestException('Cannot suspend a deleted account.');
        }
        this.props.status = UserStatus.SUSPENDED;
        this.props.updatedAt = new Date();
    }

    reactivate(): void {
        if (this.props.status !== UserStatus.SUSPENDED) {
            throw new BadRequestException('Only suspended accounts can be reactivated.');
        }
        this.props.status = UserStatus.ACTIVE;
        this.props.updatedAt = new Date();
    }

    softDelete(): void {
        if (this.props.status === UserStatus.DELETED) {
            throw new BadRequestException('Account is already deleted.');
        }
        this.props.status = UserStatus.DELETED;
        this.props.deletedAt = new Date();
        this.props.updatedAt = new Date();

        this.addDomainEvent(
            new UserDeletedEvent({
                userId: this.props.id,
                email: this.props.email,
            }),
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private activateIfFullyVerified(): void {
        if (
            this.props.emailVerified &&
            this.props.phoneVerified &&
            this.props.status === UserStatus.PENDING_VERIFICATION
        ) {
            this.props.status = UserStatus.ACTIVE;
        }
    }

    private addDomainEvent(event: IDomainEvent): void {
        this._domainEvents.push(event);
    }

    clearDomainEvents(): void {
        this._domainEvents = [];
    }

    /**
     * Returns a plain object for serialization.
     * Excludes passwordHash — never expose credentials in responses.
     */
    toResponse(): Record<string, unknown> {
        return {
            id: this.props.id,
            email: this.props.email,
            phone: this.props.phone,
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            fullName: this.fullName,
            role: this.props.role,
            status: this.props.status,
            emailVerified: this.props.emailVerified,
            phoneVerified: this.props.phoneVerified,
            profilePhotoUrl: this.props.profilePhotoUrl,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
}
