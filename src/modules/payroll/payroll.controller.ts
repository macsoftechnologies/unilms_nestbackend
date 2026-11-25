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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Operations & HR: Payroll & Payslips')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) {
      throw new UnauthorizedException('Tenant context required for payroll operations.');
    }
    return id;
  }

  // ==========================================
  // PAYROLL RUNS & DISBURSEMENT
  // ==========================================
  @Get('runs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List payroll batch runs' })
  async getPayrollRuns(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.findAllRuns(tenantId);
  }

  @Post('runs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate automated payroll run and generate payslips' })
  async generatePayrollRun(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.generatePayrollRun(tenantId, dto);
  }

  @Post('runs/:id/disburse')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Disburse payroll and mark all payslips paid' })
  async disbursePayroll(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.disbursePayroll(tenantId, id);
  }

  // ==========================================
  // PAYSLIPS
  // ==========================================
  @Get('payslips')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STAFF')
  @ApiOperation({ summary: 'List generated payslips with filters' })
  async getPayslips(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    if (role === 'FACULTY' || role === 'STAFF') {
      if (!user.staffId) {
        throw new ForbiddenException('Staff identity not associated with user token.');
      }
      query = { ...(query || {}), staffId: user.staffId };
    }
    return this.payrollService.findAllPayslips(tenantId, query);
  }

  // ==========================================
  // PAYROLL COMPONENTS
  // ==========================================
  @Get('components')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List salary components' })
  async getComponents(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.findAllComponents(tenantId);
  }

  @Post('components')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create salary component' })
  async createComponent(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.createComponent(tenantId, dto);
  }

  @Put('components/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update salary component' })
  async updateComponent(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.updateComponent(tenantId, id, dto);
  }

  @Delete('components/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete salary component' })
  async deleteComponent(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.deleteComponent(tenantId, id);
  }

  // ==========================================
  // SALARY STRUCTURES
  // ==========================================
  @Get('structures')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List salary structures' })
  async getStructures(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.findAllStructures(tenantId);
  }

  @Post('structures')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create salary structure' })
  async createStructure(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.createStructure(tenantId, dto);
  }

  @Put('structures/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update salary structure' })
  async updateStructure(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.updateStructure(tenantId, id, dto);
  }

  @Delete('structures/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete salary structure' })
  async deleteStructure(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.payrollService.deleteStructure(tenantId, id);
  }
}
