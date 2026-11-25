import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Resolve from custom header (X-Tenant-Code or X-Tenant-ID)
    const headerCode = (req.headers['x-tenant-code'] as string) || (req.headers['x-tenant-id'] as string);

    // 2. Resolve from subdomain hostname
    let hostTenant = null;
    const host = req.headers.host || '';
    if (
      !host.startsWith('localhost') &&
      !host.startsWith('127.0.0.1') &&
      !host.startsWith('unilms.com') &&
      !host.startsWith('www.unilms.com')
    ) {
      const parts = host.split('.');
      if (parts.length >= 3) {
        hostTenant = parts[0].toUpperCase();
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

