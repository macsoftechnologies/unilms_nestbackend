import { Controller, UnauthorizedException, Get, Post, Put, Patch, Delete, Body, Param, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Student Lifecycle & 360 Records')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. AIT, SXG, HAE)' })
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly prisma: PrismaService,
  ) { }

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for student operations.');
    return id;
  }

  private resolveStudentId(user: any, requestedStudentId?: string): string {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    if (role === 'STUDENT') {
      if (!user?.studentId) {
        throw new ForbiddenException('Student profile not linked to user account.');
      }
      return user.studentId;
    }
    return requestedStudentId || user?.studentId || '';
  }

  // --- PHASE 13: STUDENT PORTAL SELF-SERVICE & DIGITAL ID ---

  @Get('portal/self-service-summary')
  @ApiOperation({ summary: 'Get student self-service telemetry summary KPIs' })
  async getSelfServiceSummary(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getSelfServiceSummary(tenantId, effectiveStudentId);
  }

  @Get('portal/digital-id')
  @ApiOperation({ summary: 'Get verified student digital ID card dossier' })
  async getDigitalId(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getDigitalId(tenantId, effectiveStudentId);
  }

  @Get('portal/certificate-requests')
  @ApiOperation({ summary: 'List student official certificate requests' })
  async getCertificateRequests(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getCertificateRequests(tenantId, effectiveStudentId);
  }

  @Post('portal/certificate-requests')
  @ApiOperation({ summary: 'Submit application for official certificate' })
  async createCertificateRequest(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, dto?.studentId);
    return this.studentsService.createCertificateRequest(tenantId, { ...dto, studentId: effectiveStudentId });
  }

  @Get('portal/complaints')
  @ApiOperation({ summary: 'List student grievances & helpdesk complaints' })
  async getComplaints(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getComplaints(tenantId, effectiveStudentId);
  }

  @Post('portal/complaints')
  @ApiOperation({ summary: 'Submit confidential grievance or service complaint' })
  async createComplaint(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, dto?.studentId);
    return this.studentsService.createComplaint(tenantId, { ...dto, studentId: effectiveStudentId });
  }

  @Patch('portal/complaints/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update grievance status or resolution remarks' })
  async updateComplaint(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.updateComplaint(tenantId, id, dto);
  }

  @Get('portal/feedbacks')
  @ApiOperation({ summary: 'List submitted student course and faculty feedback' })
  async getFeedbacks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getFeedbacks(tenantId, effectiveStudentId);
  }

  @Post('portal/feedbacks')
  @ApiOperation({ summary: 'Submit course evaluation feedback' })
  async createFeedback(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, dto?.studentId);
    return this.studentsService.createFeedback(tenantId, { ...dto, studentId: effectiveStudentId });
  }

  @Get('portal/notices')
  @ApiOperation({ summary: 'Get student academic diary notices and circulars' })
  async getAcademicNotices(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.getAcademicNotices(tenantId);
  }

  @Post('portal/notices')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Publish academic notice or circular' })
  async createAcademicNotice(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.createAcademicNotice(tenantId, dto);
  }

  @Get('portal/exam-registrations')
  @ApiOperation({ summary: 'List student enrolled exam registrations' })
  async getExamRegistrations(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, studentId);
    return this.studentsService.getExamRegistrations(tenantId, effectiveStudentId);
  }

  @Post('portal/exam-registrations')
  @ApiOperation({ summary: 'Register for upcoming exam cycle and generate hall ticket' })
  async createExamRegistration(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const effectiveStudentId = this.resolveStudentId(user, dto?.studentId);
    return this.studentsService.createExamRegistration(tenantId, { ...dto, studentId: effectiveStudentId });
  }

  @Get()
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List student profiles with cohort, program & search filters' })
  async getStudents(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.findAll(tenantId, query);
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Enroll new student profile' })
  async createStudent(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full 360-degree student profile' })
  async getStudentById(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    if (role === 'STUDENT' && user?.studentId && user.studentId !== id) {
      throw new ForbiddenException('Access denied: students may only view their own profile.');
    }
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.findById(tenantId, id);
  }

  @Put(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update student profile details' })
  async updateStudent(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove student profile' })
  async deleteStudent(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.delete(tenantId, id);
  }

  @Post('bulk-promote')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bulk promote cohort of students to next semester/year' })
  async bulkPromote(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.studentsService.bulkPromote(tenantId, dto);
  }

  @Post('bulk-import')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bulk import student roster records into institutional database' })
  async bulkImport(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const students = Array.isArray(body) ? body : (body?.students || []);
    return this.studentsService.bulkImport(tenantId, students);
  }
}
