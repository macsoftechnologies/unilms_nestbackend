import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ParentService } from './parent.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Module 10: Parent Portal & Academic 360')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Roles('PARENT', 'CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN', 'STUDENT')
@Controller('parent')
export class ParentController {
  constructor(
    private readonly parentService: ParentService,
  ) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for parent portal.');
    return id;
  }

  private resolveStudentId(user: any, requestedId: string): string {
    const role = (user?.role || '').toUpperCase();
    if (role === 'STUDENT') {
      const selfId = user.studentId || user.id;
      if (requestedId && requestedId !== selfId && requestedId !== 'self' && requestedId !== 'me') {
        throw new ForbiddenException('IDOR violation: Students can only view their own academic records.');
      }
      return selfId;
    }
    return requestedId;
  }

  @Get('children')
  @ApiOperation({ summary: 'List linked student wards for parent' })
  async getChildren(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.parentService.getChildren(tenantId, { email, phone }, user);
  }

  @Get('student/:id/overview')
  @ApiOperation({ summary: 'Get comprehensive Academic 360 overview for a student ward' })
  async getStudentOverview(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getStudentOverview(tenantId, targetId, user);
  }

  @Get('student/:id/attendance')
  @ApiOperation({ summary: 'Get period attendance register & rate for student ward' })
  async getAttendance(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getAttendance(tenantId, targetId, month, user);
  }

  @Get('student/:id/fees')
  @ApiOperation({ summary: 'List fee invoices, balances & payment transactions for student ward' })
  async getFees(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getFees(tenantId, targetId, user);
  }

  @Post('student/:id/fees/pay')
  @ApiOperation({ summary: 'Initiate or record parent payment for student invoice' })
  async payFee(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { invoiceId: string; amount: number; paymentMode?: string },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.payFee(tenantId, targetId, dto, user);
  }

  @Get('student/:id/marks')
  @ApiOperation({ summary: 'Get examination marks, grade cards and GPA for student ward' })
  async getMarks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('semester') semester?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getMarks(tenantId, targetId, semester, user);
  }

  @Get('student/:id/homework')
  @ApiOperation({ summary: 'List course assignments and submission statuses for student ward' })
  async getHomework(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getHomework(tenantId, targetId, user);
  }

  @Get('student/:id/timetable')
  @ApiOperation({ summary: 'Get weekly academic class timetable for student ward' })
  async getTimetable(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getTimetable(tenantId, targetId, user);
  }

  @Get('student/:id/remarks')
  @ApiOperation({ summary: 'List mentor & faculty behavioral remarks for student ward' })
  async getRemarks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getRemarks(tenantId, targetId, user);
  }

  @Get('student/:id/calendar')
  @ApiOperation({ summary: 'Get student academic calendar and event schedule' })
  async getCalendar(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetId = this.resolveStudentId(user, id);
    return this.parentService.getCalendar(tenantId, targetId, user);
  }
}
