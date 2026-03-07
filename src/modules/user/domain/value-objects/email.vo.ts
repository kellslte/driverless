import { BadRequestException } from '../../../../common/exceptions/index.js';

/**
 * Email Value Object — self-validating, immutable.
 *
 * Case Study Context: Uber stored user data as raw strings with no validation
 * at the domain layer. Invalid data propagated through the system and into the
 * database. Value objects enforce invariants at creation time.
 */
export class Email {
    private constructor(private readonly value: string) { }

    static create(email: string): Email {
        const normalized = email.trim().toLowerCase();
        if (!Email.isValid(normalized)) {
            throw new BadRequestException(
                `"${email}" is not a valid email address.`,
            );
        }
        return new Email(normalized);
    }

    static isValid(email: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email) && email.length <= 254;
    }

    toString(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }
}
