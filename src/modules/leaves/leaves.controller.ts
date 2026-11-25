import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Operations & HR: Leaves')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for leave operations.');
    return id;
  }

  @Get()
  @ApiOperation({ summary: 'List employee leave applications' })
  async getLeaves(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.leavesService.findAll(tenantId, query, user);
  }

  @Post()
  @ApiOperation({ summary: 'Submit new leave application' })
  async applyLeave(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.leavesService.apply(tenantId, dto, user);
  }

  @Patch(':id/status')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Approve or reject leave application' })
  async updateStatus(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('approvedBy') approvedBy?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.leavesService.updateStatus(tenantId, id, status, approvedBy, user);
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete leave application' })
  async deleteLeave(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.leavesService.delete(tenantId, id);
  }
}
