import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async resolveByDomain(domain: string) {
    if (!domain) {
      throw new NotFoundException('Domain parameter is required');
    }

    const cacheKey = `tenant:domain:${domain.toLowerCase()}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Direct match
    let tenant = await this.prisma.tenant.findUnique({
      where: { domain: domain.toLowerCase() },
      include: { plan: true },
    });

    // Subdomain extraction fallback (e.g. ait.unilms.in -> code AIT)
    if (!tenant && domain.includes('.')) {
      const sub = domain.split('.')[0].toUpperCase();
      tenant = await this.prisma.tenant.findUnique({
        where: { code: sub },
        include: { plan: true },
      });
    }

    if (!tenant) {
      throw new NotFoundException(`No tenant found matching domain "${domain}"`);
    }

    await this.redis.set(cacheKey, tenant, 1800); // 30 min cache
    return tenant;
  }

  async searchTenants(query?: string) {
    if (!query) {
      return this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          code: true,
          name: true,
          domain: true,
          primaryColor: true,
          logoUrl: true,
          lmsEnabled: true,
          cmsEnabled: true,
          obeEnabled: true,
        },
        take: 20,
      });
    }

    return this.prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { domain: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        domain: true,
        primaryColor: true,
        logoUrl: true,
        lmsEnabled: true,
        cmsEnabled: true,
        obeEnabled: true,
      },
      take: 20,
    });
  }

  async getBranding(tenantCodeOrId: string) {
    const cacheKey = `tenant:branding:${tenantCodeOrId.toLowerCase()}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { code: tenantCodeOrId.toUpperCase() },
          { id: tenantCodeOrId.length === 36 ? tenantCodeOrId : undefined },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        domain: true,
        primaryColor: true,
        primaryHover: true,
        primaryLight: true,
        accentColor: true,
        logoUrl: true,
        faviconUrl: true,
        cmsEnabled: true,
        lmsEnabled: true,
        obeEnabled: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Branding not found for tenant "${tenantCodeOrId}"`);
    }

    await this.redis.set(cacheKey, tenant, 1800); // 30 min cache
    return tenant;
  }

  async invalidateTenantCache(tenantCodeOrId: string, domain?: string) {
    await this.redis.del(`tenant:branding:${tenantCodeOrId.toLowerCase()}`);
    if (domain) {
      await this.redis.del(`tenant:domain:${domain.toLowerCase()}`);
    }
  }

  async updateTenant(tenantId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant "${tenantId}" not found.`);
    if (dto.settings) {
      await this.saveTenantSetting(tenant.id, 'org_contact_details', dto.settings);
    }
    const updated = await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.domain && { domain: dto.domain }),
      },
    });
    await this.invalidateTenantCache(updated.code, updated.domain || undefined);
    return updated;
  }

  async getTenantSetting(tenantId: string, key: string) {
    const tenantKey = `${tenantId}:${key}`;
    const record = await this.prisma.platformSetting.findUnique({ where: { key: tenantKey } });
    return record?.value ?? null;
  }

  async saveTenantSetting(tenantId: string, key: string, value: any) {
    const tenantKey = `${tenantId}:${key}`;
    const upserted = await this.prisma.platformSetting.upsert({
      where: { key: tenantKey },
      create: { key: tenantKey, value },
      update: { value },
    });
    return upserted.value;
  }
}

