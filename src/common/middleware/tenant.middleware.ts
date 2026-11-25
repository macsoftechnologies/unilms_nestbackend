import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Resolve from custom header (X-Tenant-Code or X-Tenant-ID)
    const headerCode = (req.headers['x-tenant-code'] as string) || (req.headers['x-tenant-id'] as string);

    // 2. Resolve from subdomain hostname (e.g. ait.unilms.in -> AIT)
    let hostTenant = null;
    const rawHost = (req.headers.host || '').split(':')[0].toLowerCase();
    if (
      rawHost !== 'localhost' &&
      rawHost !== '127.0.0.1' &&
      !rawHost.endsWith('.internal')
    ) {
      const parts = rawHost.split('.');
      if (parts.length >= 3) {
        const sub = parts[0];
        if (!['www', 'api', 'app', 'superadmin', 'admin', 'stage', 'dev'].includes(sub)) {
          hostTenant = sub.toUpperCase();
        }
      }
    }

    const requestedCode = (headerCode || hostTenant || '').trim().toUpperCase();

    if (requestedCode) {
      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { code: requestedCode },
              { id: headerCode && headerCode.length === 36 ? headerCode : undefined },
            ],
          },
        });

        if (tenant) {
          (req as any).tenant = tenant;
          (req as any).tenantId = tenant.id;
          (req as any).tenantCode = tenant.code;
        }
      } catch (e) {
        // Ignore database lookup error in middleware, allow downstream guards to handle
      }
    }

    next();
  }
}

