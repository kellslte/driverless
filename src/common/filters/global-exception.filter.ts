import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { DomainException, ValidationException } from '../exceptions/index.js';

/**
 * Global exception filter implementing RFC 7807 (Problem Details) responses.
 *
 * Case Study Context: Uber's inconsistent error formats across services caused
 * confusion in client apps and made debugging harder. We standardize from day one.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const traceId = (request.headers['x-trace-id'] as string) || uuid();

        let status: number;
        let body: Record<string, unknown>;

        if (exception instanceof DomainException) {
            status = exception.statusCode;
            body = {
                type: `https://driverless.dev/errors/${exception.errorCode.toLowerCase().replace(/_/g, '-')}`,
                title: exception.errorCode.replace(/_/g, ' '),
                status,
                detail: exception.message,
                instance: request.url,
                traceId,
            };

            if (exception instanceof ValidationException) {
                body.errors = exception.errors;
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();
            body = {
                type: 'https://driverless.dev/errors/http-error',
                title: typeof exResponse === 'string' ? exResponse : (exResponse as Record<string, unknown>).error || 'Error',
                status,
                detail: typeof exResponse === 'string' ? exResponse : (exResponse as Record<string, unknown>).message || exception.message,
                instance: request.url,
                traceId,
            };
        } else {
            // Unexpected error — log full details, return generic response
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
            body = {
                type: 'https://driverless.dev/errors/internal-error',
                title: 'Internal Server Error',
                status,
                detail: 'An unexpected error occurred. Please try again later.',
                instance: request.url,
                traceId,
            };
        }

        response.status(status).json(body);
    }
}
