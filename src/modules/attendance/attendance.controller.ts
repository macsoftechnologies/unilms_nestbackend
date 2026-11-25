import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Operations & Telemetry: Attendance Engine')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for attendance operations.');
    return id;
  }

  @Get('records')
  @ApiOperation({ summary: 'List detailed attendance logs by date and cohort' })
  async getRecords(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    if (role === 'STUDENT') {
      query = { ...(query || {}), studentId: user.studentId };
    }
    return this.attendanceService.findAll(tenantId, query);
  }

  @Post('mark-batch')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Batch mark attendance for students or staff' })
  async markBatch(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.attendanceService.markBatch(tenantId, dto);
  }

  @Get('summary')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Live attendance telemetry summary for dashboard polling' })
  async getSummary(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.attendanceService.getDashboardSummary(tenantId, date);
  }
}
