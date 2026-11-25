import { Controller, Get, Post, Patch, Body, Query, Headers, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve Tenant by Subdomain / Custom Domain' })
  async resolve(@Query('domain') domain: string) {
    return this.tenantsService.resolveByDomain(domain);
  }

  @Public()
  @Get('lookup')
  @ApiOperation({ summary: 'Search institutions by name or code (Mobile onboarding & Web Gateway)' })
  async lookup(@Query('q') query?: string) {
    return this.tenantsService.searchTenants(query);
  }

  @Public()
  @Get('branding')
  @ApiOperation({ summary: 'Get dynamic white-label branding (colors, logo) for active tenant' })
  async branding(
    @Headers('x-tenant-code') headerCode?: string,
    @Headers('x-tenant-id') headerId?: string,
  ) {
    const identifier = headerCode || headerId;
    if (!identifier) {
      throw new BadRequestException('Tenant identifier (X-Tenant-Code or X-Tenant-Id) is required.');
    }
    return this.tenantsService.getBranding(identifier);
  }

  @Patch('settings')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN')
  @ApiOperation({ summary: 'Update tenant organization details and settings' })
  async updateSettings(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const target = tenant?.id || user?.tenantId;
    if (!target) throw new UnauthorizedException('Tenant binding required');
    return this.tenantsService.updateTenant(target, dto);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get institutional configuration or settings by key' })
  async getSetting(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('key') key: string,
  ) {
    const tenantId = tenant?.id || user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant binding required');
    return this.tenantsService.getTenantSetting(tenantId, key);
  }

  @Post('settings/:key')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Save or update institutional configuration by key' })
  async saveSetting(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('key') key: string,
    @Body() body: any,
  ) {
    const tenantId = tenant?.id || user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant binding required');
    return this.tenantsService.saveTenantSetting(tenantId, key, body);
  }
}
