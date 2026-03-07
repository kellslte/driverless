import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles on controller methods.
 *
 * Usage: @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
