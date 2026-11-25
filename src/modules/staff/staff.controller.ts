import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Operations & HR: Staff Directory')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for staff operations.');
    return id;
  }

  // ==========================================
  // STAFF DIRECTORY
  // ==========================================
  @Get()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STAFF')
  @ApiOperation({ summary: 'List staff members with search, department & status filters' })
  async getStaff(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.findAll(tenantId, query);
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new staff employee profile' })
  async createStaff(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.create(tenantId, dto);
  }

  // ==========================================
  // STAFF DUTIES & WORKLOAD ALLOCATIONS
  // ==========================================
  @Get('duties')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STAFF')
  @ApiOperation({ summary: 'List faculty & staff duties' })
  async getDuties(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.findAllDuties(tenantId, query);
  }

  @Post('duties')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign new faculty duty' })
  async createDuty(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.createDuty(tenantId, dto);
  }

  @Put('duties/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update duty assignment' })
  async updateDuty(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.updateDuty(tenantId, id, dto);
  }

  @Delete('duties/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete duty assignment' })
  async deleteDuty(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.deleteDuty(tenantId, id);
  }

  // ==========================================
  // STAFF CERTIFICATES & ATTESTATIONS
  // ==========================================
  @Get('certificates')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STAFF')
  @ApiOperation({ summary: 'List generated staff certificates' })
  async getCertificates(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.findAllCertificates(tenantId, query);
  }

  @Post('certificates')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Issue new service / experience certificate' })
  async createCertificate(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.createCertificate(tenantId, dto);
  }

  @Delete('certificates/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete certificate record' })
  async deleteCertificate(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.deleteCertificate(tenantId, id);
  }

  // ==========================================
  // STAFF ONBOARDING CHECKLISTS
  // ==========================================
  @Get('checklists')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List staff onboarding and exit checklists' })
  async getChecklists(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.findAllChecklists(tenantId, query);
  }

  @Post('checklists')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add checklist item' })
  async createChecklist(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.createChecklist(tenantId, dto);
  }

  @Put('checklists/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update checklist item' })
  async updateChecklist(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.updateChecklist(tenantId, id, dto);
  }

  @Delete('checklists/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete checklist item' })
  async deleteChecklist(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.deleteChecklist(tenantId, id);
  }

  // ==========================================
  // STAFF 360 PROFILE
  // ==========================================
  @Get(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STAFF')
  @ApiOperation({ summary: 'Get staff 360 profile with leave and payroll summary' })
  async getStaffById(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.findById(tenantId, id);
  }

  @Put(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update staff member profile' })
  async updateStaff(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete staff member profile' })
  async deleteStaff(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.staffService.delete(tenantId, id);
  }
}
