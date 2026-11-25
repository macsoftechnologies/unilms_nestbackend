import { Controller, Get, Post, Put, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FrontOfficeService } from './front-office.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Campus Facilities: Front Office & Security Gate')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. ORG1, AIT, SXG)' })
@Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
@Controller('front-office')
export class FrontOfficeController {
  constructor(
    private readonly frontOfficeService: FrontOfficeService,
  ) {}

  private getTenantId(tenant: Tenant, user: any): string {
    const tid = tenant?.id || user?.tenantId;
    if (!tid) throw new UnauthorizedException('Tenant context is required');
    return tid;
  }

  // --- Dashboard Telemetry ---
  @Get('stats')
  @ApiOperation({ summary: 'Get overview metrics for visitors, calls, postal dispatches, and admission enquiries' })
  async getStats(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.getStats(tenantId);
  }

  // --- 1. Visitor Gatepasses & Badges ---
  @Get('visitors')
  @ApiOperation({ summary: 'List visitor entry passes & security check-ins' })
  async findVisitors(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('status') status?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.findVisitors(tenantId, status);
  }

  @Get('visitors/:id')
  @ApiOperation({ summary: 'Get single visitor pass details' })
  async findVisitorById(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.findVisitorById(tenantId, id);
  }

  @Post('visitors')
  @ApiOperation({ summary: 'Issue new visitor gate pass' })
  async createVisitor(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.createVisitor(tenantId, dto);
  }

  @Put('visitors/:id')
  @ApiOperation({ summary: 'Update visitor pass information' })
  async updateVisitor(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.updateVisitor(tenantId, id, dto);
  }

  @Put('visitors/:id/checkout')
  @ApiOperation({ summary: 'Record visitor departure / checkout' })
  async checkoutVisitor(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.checkoutVisitor(tenantId, id);
  }

  @Delete('visitors/:id')
  @ApiOperation({ summary: 'Delete visitor pass record' })
  async deleteVisitor(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.deleteVisitor(tenantId, id);
  }

  // --- 2. Postal & Courier Dispatches ---
  @Get('postal')
  @ApiOperation({ summary: 'List inward/outward postal & dispatch records' })
  async findPostal(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('type') type?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.findPostal(tenantId, type);
  }

  @Post('postal')
  @ApiOperation({ summary: 'Log inward or outward postal shipment' })
  async createPostal(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.createPostal(tenantId, dto);
  }

  @Put('postal/:id')
  @ApiOperation({ summary: 'Update postal dispatch record' })
  async updatePostal(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.updatePostal(tenantId, id, dto);
  }

  @Delete('postal/:id')
  @ApiOperation({ summary: 'Delete postal dispatch record' })
  async deletePostal(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.deletePostal(tenantId, id);
  }

  // --- 3. Telephonic Call Logs ---
  @Get('calls')
  @ApiOperation({ summary: 'List reception telephonic call logs' })
  async findCalls(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.findCalls(tenantId);
  }

  @Post('calls')
  @ApiOperation({ summary: 'Log telephonic inquiry or follow-up call' })
  async createCall(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.createCall(tenantId, dto);
  }

  @Put('calls/:id')
  @ApiOperation({ summary: 'Update telephonic call log' })
  async updateCall(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.updateCall(tenantId, id, dto);
  }

  @Delete('calls/:id')
  @ApiOperation({ summary: 'Delete telephonic call log' })
  async deleteCall(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.deleteCall(tenantId, id);
  }

  // --- 4. Admission & Public Enquiries ---
  @Get('enquiries')
  @ApiOperation({ summary: 'List admission and public enquiries' })
  async findEnquiries(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.findEnquiries(tenantId, query);
  }

  @Post('enquiries')
  @ApiOperation({ summary: 'Log new walk-in / online admission enquiry' })
  async createEnquiry(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.createEnquiry(tenantId, dto);
  }

  @Put('enquiries/:id')
  @ApiOperation({ summary: 'Update enquiry details' })
  async updateEnquiry(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.updateEnquiry(tenantId, id, dto);
  }

  @Post('enquiries/:id/followups')
  @ApiOperation({ summary: 'Add counselling followup note to enquiry' })
  async addFollowup(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.addFollowup(tenantId, id, dto);
  }

  @Post('enquiries/:id/convert-to-lead')
  @ApiOperation({ summary: 'Convert enquiry to formal Admissions Lead (Module 02 cross-module integration)' })
  async convertToLead(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.convertToLead(tenantId, id);
  }

  @Delete('enquiries/:id')
  @ApiOperation({ summary: 'Delete enquiry record' })
  async deleteEnquiry(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.frontOfficeService.deleteEnquiry(tenantId, id);
  }
}
