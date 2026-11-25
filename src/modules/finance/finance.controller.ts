import { Controller, Get, Post, Patch, Delete, Body, Param, Query, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Finance, Fees & Student Billing')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. AIT, SXG, HAE)' })
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  private ensureTenant(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) {
      throw new UnauthorizedException('Tenant context required for finance operations.');
    }
    return id;
  }

  // --- FEE STRUCTURES ---
  @Get('structures')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all fee structures' })
  async findFeeStructures(@CurrentTenant() tenant: Tenant) {
    return this.financeService.findFeeStructures(this.ensureTenant(tenant));
  }

  @Post('structures')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new fee structure with component heads' })
  async createFeeStructure(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.createFeeStructure(this.ensureTenant(tenant), dto);
  }

  @Patch('structures/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update fee structure parameters and component heads' })
  async updateFeeStructure(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.financeService.updateFeeStructure(this.ensureTenant(tenant), id, dto);
  }

  @Delete('structures/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete fee structure' })
  async deleteFeeStructure(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteFeeStructure(this.ensureTenant(tenant), id);
  }

  // --- FEE TYPES CATALOG ---
  @Get('types')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List fee types catalog' })
  async findFeeTypes(@CurrentTenant() tenant: Tenant) {
    return this.financeService.findFeeTypes(this.ensureTenant(tenant));
  }

  @Post('types')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create fee type' })
  async createFeeType(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.createFeeType(this.ensureTenant(tenant), dto);
  }

  @Patch('types/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update fee type' })
  async updateFeeType(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.financeService.updateFeeType(this.ensureTenant(tenant), id, dto);
  }

  @Delete('types/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete fee type' })
  async deleteFeeType(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteFeeType(this.ensureTenant(tenant), id);
  }

  // --- INVOICES & DUES ---
  @Get('invoices')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'PARENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List student fee invoices' })
  async findInvoices(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    let effectiveStudentId = studentId;
    if (role === 'STUDENT') {
      if (!user?.studentId) {
        throw new ForbiddenException('Student profile not found for authenticated user.');
      }
      effectiveStudentId = user.studentId;
    }
    return this.financeService.findInvoices(this.ensureTenant(tenant), { studentId: effectiveStudentId, status, search });
  }

  @Post('invoices')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate new student fee invoice' })
  async createInvoice(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.createInvoice(this.ensureTenant(tenant), dto);
  }

  @Post('invoices/bulk')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bulk generate invoices for cohort / section' })
  async createBulkInvoices(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.createBulkInvoices(this.ensureTenant(tenant), dto);
  }

  // --- PAYMENTS & RECEIPTS ---
  @Post('payments')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record fee payment transaction against an invoice' })
  async recordPayment(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.recordPayment(this.ensureTenant(tenant), dto);
  }

  @Get('payments/:id/receipt')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'PARENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get official printable payment receipt' })
  async getPaymentReceipt(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.financeService.getPaymentReceipt(this.ensureTenant(tenant, user), id, user);
  }

  // --- DAYBOOK JOURNAL ---
  @Get('daybook')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get daily institutional cash & bank ledger daybook' })
  async findDaybook(@CurrentTenant() tenant: Tenant, @Query('date') date?: string) {
    return this.financeService.findDaybook(this.ensureTenant(tenant), date);
  }

  @Post('daybook')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record manual daybook entry (income/expense)' })
  async createDaybookEntry(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.financeService.createDaybookEntry(this.ensureTenant(tenant), dto);
  }
}
