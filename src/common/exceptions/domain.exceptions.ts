/**
 * Domain exception base class.
 * All domain-specific errors extend this so the global exception filter
 * can distinguish them from unexpected crashes.
 */
export abstract class DomainException extends Error {
    abstract readonly statusCode: number;
    abstract readonly errorCode: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class NotFoundException extends DomainException {
    readonly statusCode = 404;
    readonly errorCode = 'NOT_FOUND';

    constructor(entity: string, identifier?: string) {
        super(
            identifier
                ? `${entity} with identifier "${identifier}" was not found.`
                : `${entity} was not found.`,
        );
    }
}

export class ConflictException extends DomainException {
    readonly statusCode = 409;
    readonly errorCode = 'CONFLICT';

    constructor(message: string) {
        super(message);
    }
}

export class UnauthorizedException extends DomainException {
    readonly statusCode = 401;
    readonly errorCode = 'UNAUTHORIZED';

    constructor(message = 'Authentication is required.') {
        super(message);
    }
}

export class ForbiddenException extends DomainException {
    readonly statusCode = 403;
    readonly errorCode = 'FORBIDDEN';

    constructor(message = 'You do not have permission to perform this action.') {
        super(message);
    }
}

export class ValidationException extends DomainException {
    readonly statusCode = 422;
    readonly errorCode = 'VALIDATION_ERROR';
    readonly errors: Array<{ field: string; message: string }>;

    constructor(
        errors: Array<{ field: string; message: string }>,
        message = 'Validation failed.',
    ) {
        super(message);
        this.errors = errors;
    }
}

export class BadRequestException extends DomainException {
    readonly statusCode = 400;
    readonly errorCode = 'BAD_REQUEST';

    constructor(message: string) {
        super(message);
    }
}
