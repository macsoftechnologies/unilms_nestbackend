import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './superadmin.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('superadmin')
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Platform global telemetry, KPIs, and recent activities' })
  async getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }

  // ==========================================
  // TENANTS
  // ==========================================
  @Get('tenants')
  @ApiOperation({ summary: 'List all onboarded tenant institutions' })
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get specific tenant institution details and affiliated users' })
  async getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Provision new tenant institution & seed campus admin' })
  async provisionTenant(@Body() dto: any) {
    return this.superAdminService.provisionTenant(dto);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant institution details & configuration' })
  async updateTenant(@Param('id') id: string, @Body() dto: any) {
    return this.superAdminService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete tenant institution' })
  async deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Toggle tenant status between ACTIVE and SUSPENDED' })
  async toggleStatus(@Param('id') id: string) {
    return this.superAdminService.toggleTenantStatus(id);
  }

  @Post('tenants/:id/renew')
  @ApiOperation({ summary: 'Renew or upgrade tenant subscription & record receipt' })
  async renewTenant(@Param('id') id: string, @Body() dto: any) {
    return this.superAdminService.renewTenant(id, dto);
  }

  // ==========================================
  // SUBSCRIPTION PLANS
  // ==========================================
  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  async getPlans() {
    return this.superAdminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create new subscription plan' })
  async createPlan(@Body() dto: any) {
    return this.superAdminService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.superAdminService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.deletePlan(id);
  }

  // ==========================================
  // PLATFORM ADMINISTRATORS
  // ==========================================
  @Get('admins')
  @ApiOperation({ summary: 'List all platform super administrators' })
  async getAdmins() {
    return this.superAdminService.getAdmins();
  }

  @Post('admins')
  @ApiOperation({ summary: 'Add a new super administrator' })
  async createAdmin(@Body() dto: any) {
    return this.superAdminService.createAdmin(dto);
  }

  @Patch('admins/:id')
  @ApiOperation({ summary: 'Update administrator account' })
  async updateAdmin(@Param('id') id: string, @Body() dto: any) {
    return this.superAdminService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Delete administrator account' })
  async deleteAdmin(@Param('id') id: string, @Request() req: any) {
    const currentUserId = req.user?.id || req.user?.userId || req.user?.sub;
    return this.superAdminService.deleteAdmin(id, currentUserId);
  }

  // ==========================================
  // CONTENT CREATORS
  // ==========================================
  @Get('creators')
  @ApiOperation({ summary: 'List all platform course authors and creators' })
  async getCreators() {
    return this.superAdminService.getCreators();
  }

  @Post('creators')
  @ApiOperation({ summary: 'Create new course creator account' })
  async createCreator(@Body() dto: any) {
    return this.superAdminService.createCreator(dto);
  }

  @Patch('creators/:id')
  @ApiOperation({ summary: 'Update creator details' })
  async updateCreator(@Param('id') id: string, @Body() dto: any) {
    return this.superAdminService.updateCreator(id, dto);
  }

  @Delete('creators/:id')
  @ApiOperation({ summary: 'Delete creator account' })
  async deleteCreator(@Param('id') id: string) {
    return this.superAdminService.deleteCreator(id);
  }

  // ==========================================
  // PAYMENTS & RECEIPTS
  // ==========================================
  @Get('payments')
  @ApiOperation({ summary: 'List all subscription transaction receipts' })
  async getPayments() {
    return this.superAdminService.getPayments();
  }

  // ==========================================
  // GLOBAL AUDIT LOGS
  // ==========================================
  @Get('activity-logs')
  @ApiOperation({ summary: 'Global platform audit logs' })
  async getActivityLogs() {
    return this.superAdminService.getActivityLogs();
  }

  // ==========================================
  // PLATFORM SETTINGS (PAYMENT GATEWAYS, SMTP, SMS)
  // ==========================================
  @Get('settings')
  @ApiOperation({ summary: 'Get global platform settings (Gateways, SMTP, SMS)' })
  async getSettings() {
    return this.superAdminService.getSettings();
  }

  @Post('settings/:key')
  @ApiOperation({ summary: 'Save or update global platform setting by key' })
  async saveSetting(@Param('key') key: string, @Body() body: any) {
    return this.superAdminService.updateSettings(key, body);
  }
}
