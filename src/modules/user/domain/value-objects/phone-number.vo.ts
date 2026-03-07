import { BadRequestException } from '../../../../common/exceptions/index.js';

/**
 * PhoneNumber Value Object — enforces E.164 international format.
 *
 * Validates and normalizes phone numbers at the domain layer.
 * Stored in E.164 format (e.g., +2348012345678) for global consistency.
 */
export class PhoneNumber {
    private constructor(private readonly value: string) { }

    static create(phone: string): PhoneNumber {
        const normalized = phone.replace(/[\s\-()]/g, '');
        if (!PhoneNumber.isValid(normalized)) {
            throw new BadRequestException(
                `"${phone}" is not a valid E.164 phone number. Expected format: +[country code][number]`,
            );
        }
        return new PhoneNumber(normalized);
    }

    static isValid(phone: string): boolean {
        // E.164: + followed by 7-15 digits
        const regex = /^\+[1-9]\d{6,14}$/;
        return regex.test(phone);
    }

    toString(): string {
        return this.value;
    }

    equals(other: PhoneNumber): boolean {
        return this.value === other.value;
    }
}
