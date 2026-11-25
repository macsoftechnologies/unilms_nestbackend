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
import { LibraryService } from './library.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Campus Facilities: Central Library & OPAC')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for library operations.');
    return id;
  }

  // ==========================================
  // DASHBOARD TELEMETRY
  // ==========================================
  @Get('stats')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STAFF', 'FACULTY')
  @ApiOperation({ summary: 'Get summary statistics of library holdings and circulation' })
  async getStats(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.getStats(tenantId);
  }

  // ==========================================
  // 1. BOOK CATEGORIES / SECTIONS
  // ==========================================
  @Get('categories')
  @ApiOperation({ summary: 'List library book categories & sections' })
  async findCategories(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findCategories(tenantId);
  }

  @Post('categories')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new book category' })
  async createCategory(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createCategory(tenantId, dto);
  }

  @Put('categories/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update book category' })
  async updateCategory(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updateCategory(tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete book category' })
  async deleteCategory(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteCategory(tenantId, id);
  }

  // ==========================================
  // 2. BOOKS / OPAC CRUD
  // ==========================================
  @Get('books')
  @ApiOperation({ summary: 'List library books with search & category filtering (OPAC)' })
  async findBooks(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findBooks(tenantId, query);
  }

  @Post('books')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Accession new book to library' })
  async createBook(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createBook(tenantId, dto);
  }

  @Put('books/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update book details' })
  async updateBook(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updateBook(tenantId, id, dto);
  }

  @Delete('books/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete book from accession ledger' })
  async deleteBook(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteBook(tenantId, id);
  }

  // ==========================================
  // 3. CIRCULATION DESK (ISSUES & RETURNS)
  // ==========================================
  @Get('issues')
  @ApiOperation({ summary: 'List book issue transactions' })
  async findIssues(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    if (role === 'STUDENT') {
      query = { ...(query || {}), studentId: user.studentId };
    }
    return this.libraryService.findIssues(tenantId, query);
  }

  @Post('issues')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Issue book to student or faculty member' })
  async issueBook(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.issueBook(tenantId, dto);
  }

  @Put('issues/:id/return')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Check in / Return issued book' })
  async returnBook(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('fineAmount') fineAmount?: number,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.returnBook(tenantId, id, fineAmount);
  }

  @Put('issues/:id/renew')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Renew issued book' })
  async renewBook(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('extensionDays') extensionDays?: number,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.renewBook(tenantId, id, extensionDays);
  }

  @Delete('issues/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete issue record' })
  async deleteIssue(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteIssue(tenantId, id);
  }

  // ==========================================
  // 4. MEMBERS MANAGEMENT
  // ==========================================
  @Get('members')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List library card holders' })
  async findMembers(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findMembers(tenantId, query);
  }

  @Post('members')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Enroll new library card holder' })
  async createMember(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createMember(tenantId, dto);
  }

  @Put('members/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update library membership' })
  async updateMember(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updateMember(tenantId, id, dto);
  }

  @Delete('members/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate / Delete library membership' })
  async deleteMember(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteMember(tenantId, id);
  }

  // ==========================================
  // 5. PERIODICALS & JOURNALS
  // ==========================================
  @Get('periodicals')
  @ApiOperation({ summary: 'List subscriptions to magazines and journals' })
  async findPeriodicals(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findPeriodicals(tenantId);
  }

  @Post('periodicals')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add journal / magazine subscription' })
  async createPeriodical(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createPeriodical(tenantId, dto);
  }

  @Put('periodicals/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update periodical record' })
  async updatePeriodical(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updatePeriodical(tenantId, id, dto);
  }

  @Delete('periodicals/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete periodical entry' })
  async deletePeriodical(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deletePeriodical(tenantId, id);
  }

  // ==========================================
  // 6. SUPPLIERS & VENDORS
  // ==========================================
  @Get('suppliers')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List book vendors and distributors' })
  async findSuppliers(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findSuppliers(tenantId);
  }

  @Post('suppliers')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Register book vendor / publisher' })
  async createSupplier(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createSupplier(tenantId, dto);
  }

  @Put('suppliers/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update supplier information' })
  async updateSupplier(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updateSupplier(tenantId, id, dto);
  }

  @Delete('suppliers/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete vendor' })
  async deleteSupplier(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteSupplier(tenantId, id);
  }

  // ==========================================
  // 7. STOCK AUDITS & PHYSICAL INVENTORY
  // ==========================================
  @Get('audits')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List stock verification reports' })
  async findStockAudits(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.findStockAudits(tenantId);
  }

  @Post('audits')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record physical book stock audit' })
  async createStockAudit(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.createStockAudit(tenantId, dto);
  }

  @Put('audits/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update audit report' })
  async updateStockAudit(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.updateStockAudit(tenantId, id, dto);
  }

  @Delete('audits/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete audit report' })
  async deleteStockAudit(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.libraryService.deleteStockAudit(tenantId, id);
  }
}
