import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
//rest parameter to allow multiple roles to access a route
//final SetMetadata('roles', ['admin', 'user'])