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
import { AccountsService } from './accounts.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Institutional Accounts & Double-Entry Accounting')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for accounts operations.');
    return id;
  }

  // --- 1. Overview Telemetry ---
  @Get('stats')
  @ApiOperation({ summary: 'Get institutional financial telemetry, bank/cash balances, inflows and outflows' })
  async getStats(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.getStats(tenantId);
  }

  // --- 2. Chart of Accounts (Account Heads) ---
  @Get('heads')
  @ApiOperation({ summary: 'List institutional account heads & chart of accounts' })
  async findHeads(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.findHeads(tenantId, type, search);
  }

  @Post('heads')
  @ApiOperation({ summary: 'Create new account head' })
  async createHead(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.createHead(tenantId, dto);
  }

  @Put('heads/:id')
  @ApiOperation({ summary: 'Update account head parameters' })
  async updateHead(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.updateHead(tenantId, id, dto);
  }

  @Delete('heads/:id')
  @ApiOperation({ summary: 'Delete account head' })
  async deleteHead(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.deleteHead(tenantId, id);
  }

  // --- 3. Bank & Cash Accounts ---
  @Get('banks')
  @ApiOperation({ summary: 'List institutional bank accounts and cash registers' })
  async findBanks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.findBanks(tenantId, type, search);
  }

  @Post('banks')
  @ApiOperation({ summary: 'Add bank account or cash chest' })
  async createBank(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.createBank(tenantId, dto);
  }

  @Put('banks/:id')
  @ApiOperation({ summary: 'Update bank account metadata' })
  async updateBank(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.updateBank(tenantId, id, dto);
  }

  @Delete('banks/:id')
  @ApiOperation({ summary: 'Delete bank account' })
  async deleteBank(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.deleteBank(tenantId, id);
  }

  // --- 4. Transactions & Vouchers ---
  @Get('transactions')
  @ApiOperation({ summary: 'List double-entry financial voucher transactions' })
  async findTransactions(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query() query: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.findTransactions(tenantId, query);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Post new financial voucher transaction with automatic bank balance update' })
  async createTransaction(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.createTransaction(tenantId, dto);
  }

  @Put('transactions/:id')
  @ApiOperation({ summary: 'Update financial transaction' })
  async updateTransaction(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.updateTransaction(tenantId, id, dto);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Void / delete financial transaction and revert balance change' })
  async deleteTransaction(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.deleteTransaction(tenantId, id);
  }

  // --- 5. Daybook Register ---
  @Get('daybook')
  @ApiOperation({ summary: 'Get daily institutional cash & bank ledger daybook' })
  async getDaybook(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('date') date?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.getDaybook(tenantId, date);
  }

  // --- 6. Profit & Loss / Income & Expenditure Statement ---
  @Get('pl-statement')
  @ApiOperation({ summary: 'Generate institutional Profit & Loss / Income & Expenditure statement' })
  async getPlStatement(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.accountsService.getPlStatement(tenantId, startDate, endDate);
  }
}
