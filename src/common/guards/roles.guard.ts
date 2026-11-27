import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no explicit @Roles decorator is defined on handler or class, allow authenticated caller
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User authentication or role missing from session context.');
    }

    let userRole = String(user.role).toUpperCase().replace(/-/g, '_');
    if (userRole === 'ADMIN') userRole = 'CAMPUS_ADMIN';

    // Super Admin or Organization Administrator has global override capability
    if (userRole === 'SUPER_ADMIN' || userRole === 'CAMPUS_ADMIN' || Boolean(user.isOrgAdmin)) {
      return true;
    }

    const normalizedRequired = requiredRoles.map((r) => {
      const norm = String(r).toUpperCase().replace(/-/g, '_');
      return norm === 'ADMIN' ? 'CAMPUS_ADMIN' : norm;
    });

    const hasRole = normalizedRequired.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: role "${user.role}" does not have required permissions. Required: [${requiredRoles.join(', ')}]`
      );
    }

    return true;
  }
}

