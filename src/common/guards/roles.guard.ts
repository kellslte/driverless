import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Guard that enforces role-based access control (RBAC).
 *
 * Case Study Context: Uber's "God View" had no access control.
 * Every admin endpoint in Driverless is role-gated and logged.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No roles specified — allow access (auth guard already checked identity)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        return requiredRoles.includes(user.role);
    }
}
