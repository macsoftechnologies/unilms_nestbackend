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
import { TransportService } from './transport.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Campus Facilities: Transport')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for transport operations.');
    return id;
  }

  // ==========================================
  // 1. FLEET VEHICLES
  // ==========================================
  @Get('vehicles')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STAFF', 'FACULTY')
  @ApiOperation({ summary: 'List institutional fleet vehicles & buses' })
  async findVehicles(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.findVehicles(tenantId);
  }

  @Post('vehicles')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Register new vehicle into fleet' })
  async createVehicle(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.createVehicle(tenantId, dto);
  }

  @Put('vehicles/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update fleet vehicle details' })
  async updateVehicle(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.updateVehicle(tenantId, id, dto);
  }

  @Delete('vehicles/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Decommission/Delete fleet vehicle' })
  async deleteVehicle(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.deleteVehicle(tenantId, id);
  }

  // ==========================================
  // 2. BUS ROUTES
  // ==========================================
  @Get('routes')
  @ApiOperation({ summary: 'List transport bus routes & stops' })
  async findRoutes(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.findRoutes(tenantId);
  }

  @Post('routes')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new bus route' })
  async createRoute(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.createRoute(tenantId, dto);
  }

  @Put('routes/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update bus route information' })
  async updateRoute(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.updateRoute(tenantId, id, dto);
  }

  @Delete('routes/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete bus route' })
  async deleteRoute(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.deleteRoute(tenantId, id);
  }

  // ==========================================
  // 3. BUS STOPS / HALTS
  // ==========================================
  @Get('stops')
  @ApiOperation({ summary: 'List bus halts and pickup timings' })
  async findStops(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('routeId') routeId?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.findStops(tenantId, routeId);
  }

  @Post('stops')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add stop to bus route' })
  async createStop(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.createStop(tenantId, dto);
  }

  @Put('stops/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update bus halt / stop' })
  async updateStop(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.updateStop(tenantId, id, dto);
  }

  @Delete('stops/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete bus halt' })
  async deleteStop(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.deleteStop(tenantId, id);
  }

  // ==========================================
  // 4. STUDENT BUS SUBSCRIPTIONS / PASSES
  // ==========================================
  @Get('subscriptions')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: 'List student bus passes & route subscriptions' })
  async findSubscriptions(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('routeId') routeId?: string) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    const studentFilter = role === 'STUDENT' ? (user.studentId || user.id) : undefined;
    return this.transportService.findSubscriptions(tenantId, routeId, studentFilter);
  }

  @Post('subscriptions')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: 'Subscribe student to bus route and generate pass' })
  async createSubscription(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user.role || '').toUpperCase();
    if (role === 'STUDENT') {
      dto.studentId = user.studentId || dto.studentId;
    }
    return this.transportService.createSubscription(tenantId, dto);
  }

  @Put('subscriptions/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update student bus subscription / pass' })
  async updateSubscription(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.updateSubscription(tenantId, id, dto);
  }

  @Delete('subscriptions/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revoke student bus pass subscription' })
  async deleteSubscription(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.deleteSubscription(tenantId, id);
  }

  // ==========================================
  // 5. FLEET LOGBOOK & EXPENSES
  // ==========================================
  @Get('logs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List vehicle maintenance and fuel logs' })
  async findLogs(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('vehicleId') vehicleId?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.findLogs(tenantId, vehicleId);
  }

  @Post('logs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record fleet maintenance or fuel expense' })
  async createLog(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.createLog(tenantId, dto);
  }

  @Put('logs/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update fleet log entry' })
  async updateLog(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.updateLog(tenantId, id, dto);
  }

  @Delete('logs/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete fleet log entry' })
  async deleteLog(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.transportService.deleteLog(tenantId, id);
  }
}
