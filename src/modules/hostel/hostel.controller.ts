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
import { HostelService } from './hostel.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Campus Facilities: Hostel')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('hostel')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for hostel operations.');
    return id;
  }

  // --- HOSTEL BLOCKS ---
  @Get()
  @ApiOperation({ summary: 'List all hostel buildings & blocks' })
  async findHostels(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.findHostels(tenantId);
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new hostel block' })
  async createHostel(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.createHostel(tenantId, dto);
  }

  @Put(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update hostel block' })
  async updateHostel(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.updateHostel(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete hostel block' })
  async deleteHostel(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.deleteHostel(tenantId, id);
  }

  // --- ROOMS ---
  @Get('rooms')
  @ApiOperation({ summary: 'List hostel rooms' })
  async findRooms(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('hostelId') hostelId?: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.findRooms(tenantId, hostelId);
  }

  @Post('rooms')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create room in hostel block' })
  async createRoom(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.createRoom(tenantId, dto);
  }

  @Put('rooms/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update hostel room' })
  async updateRoom(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.updateRoom(tenantId, id, dto);
  }

  @Delete('rooms/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete hostel room' })
  async deleteRoom(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.deleteRoom(tenantId, id);
  }

  // --- ALLOCATIONS ---
  @Get('allocations')
  @ApiOperation({ summary: 'List active student hostel allocations' })
  async findAllocations(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('roomId') roomId?: string) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    const studentFilter = role === 'STUDENT' ? user.studentId : undefined;
    return this.hostelService.findAllocations(tenantId, roomId, studentFilter);
  }

  @Post('allocations')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Allocate student to hostel bed' })
  async createAllocation(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.createAllocation(tenantId, dto);
  }

  @Delete('allocations/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Vacate / Delete hostel bed allocation' })
  async deleteAllocation(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.deleteAllocation(tenantId, id);
  }

  // --- OUTINGS & GATEPASSES ---
  @Get('outings')
  @ApiOperation({ summary: 'List student outing & gate pass requests' })
  async findOutings(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('status') status?: string) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    const studentFilter = role === 'STUDENT' ? user.studentId : undefined;
    return this.hostelService.findOutings(tenantId, status, studentFilter);
  }

  @Post('outings')
  @ApiOperation({ summary: 'Submit new student outing request' })
  async createOuting(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    if (role === 'STUDENT') {
      dto.studentId = user.studentId;
    }
    return this.hostelService.createOuting(tenantId, dto);
  }

  @Put('outings/:id/status')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Approve, reject or mark student returned from outing' })
  async updateOutingStatus(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.updateOutingStatus(tenantId, id, status);
  }

  @Delete('outings/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete student outing log' })
  async deleteOuting(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.hostelService.deleteOuting(tenantId, id);
  }
}
