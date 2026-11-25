import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantBindingGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Public routes do not enforce authenticated tenant-token binding
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // If unauthenticated, deny
    if (!user) {
      return false;
    }

    const normalizedRole = (user.role || '').toUpperCase().replace(/-/g, '_');

    // Super Admin has global cross-tenant administration authority
    if (normalizedRole === 'SUPER_ADMIN') {
      return true;
    }

    // Non-superadmin tokens MUST carry a valid tenantId
    if (!user.tenantId) {
      throw new ForbiddenException('Tenant context missing from user token: institutional users must belong to a verified tenant.');
    }

    // Validate against requested tenant context from header or resolved tenant
    const headerCode = ((req.headers['x-tenant-code'] as string) || '').trim().toUpperCase();

    if (req.tenant) {
      // If tenant middleware resolved a tenant, verify exact ID and code match
      if (req.tenant.id !== user.tenantId) {
        throw new ForbiddenException(
          `Cross-tenant token violation: authenticated tenant (${user.tenantCode || user.tenantId}) cannot access tenant context (${req.tenant.code || req.tenant.id}).`
        );
      }

      // Suspended Tenant Protection (Real-time check)
      if (req.tenant.status && req.tenant.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Institution account for "${req.tenant.name}" is currently ${req.tenant.status.toLowerCase()}. Access denied.`
        );
      }
    } else if (headerCode && user.tenantCode && headerCode !== user.tenantCode.toUpperCase()) {
      // Header tenant explicitly mismatches token tenant
      throw new ForbiddenException(
        `Cross-tenant token violation: token tenant code (${user.tenantCode}) does not match header X-Tenant-Code (${headerCode}).`
      );
    }

    // Enforce binding: ensure req.tenantId and req.tenantCode reflect the authenticated token
    req.tenantId = user.tenantId;
    if (user.tenantCode) {
      req.tenantCode = user.tenantCode;
    }
    if (!req.tenant) {
      req.tenant = { id: user.tenantId, code: user.tenantCode };
    }

    return true;
  }
}
