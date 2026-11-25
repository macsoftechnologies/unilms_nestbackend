import { Controller, Get, Post, Patch, Delete, Body, Param, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ExaminationsService } from './examinations.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Academics: Examinations')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. ORG1, AIT, SXG)' })
@Controller('examinations')
export class ExaminationsController {
  constructor(
    private readonly examsService: ExaminationsService,
    private readonly prisma: PrismaService,
  ) {}

  private ensureTenant(tenant: Tenant): string {
    if (!tenant) {
      throw new NotFoundException('Institution could not be resolved. Please provide a valid X-Tenant-Code header.');
    }
    return tenant.id;
  }

  // --- EXAM CYCLES ---
  @Get()
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all institutional exam cycles' })
  async findAllExams(@CurrentTenant() tenant: Tenant) {
    return this.examsService.findAllExams(this.ensureTenant(tenant));
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new examination cycle' })
  async createExam(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.examsService.createExam(this.ensureTenant(tenant), dto);
  }

  @Patch(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update an examination cycle' })
  async updateExam(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.examsService.updateExam(this.ensureTenant(tenant), id, dto);
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete an examination cycle' })
  async deleteExam(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.examsService.deleteExam(this.ensureTenant(tenant), id);
  }

  // --- EXAM SCHEDULES ---
  @Get('schedules')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List scheduled examination slots' })
  async findSchedules(@CurrentTenant() tenant: Tenant, @Query('examId') examId?: string) {
    return this.examsService.findSchedules(this.ensureTenant(tenant), examId);
  }

  @Post('schedules')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a scheduled exam slot for a subject' })
  async createSchedule(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.examsService.createSchedule(this.ensureTenant(tenant), dto);
  }

  @Patch('schedules/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a scheduled exam slot' })
  async updateSchedule(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.examsService.updateSchedule(this.ensureTenant(tenant), id, dto);
  }

  @Delete('schedules/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a scheduled exam slot' })
  async deleteSchedule(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.examsService.deleteSchedule(this.ensureTenant(tenant), id);
  }

  // --- MARKS ENTRY ---
  @Get('schedules/:id/marks')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get marks entered for an examination slot' })
  async findMarks(@CurrentTenant() tenant: Tenant, @Param('id') scheduleId: string) {
    return this.examsService.findMarks(this.ensureTenant(tenant), scheduleId);
  }

  @Post('schedules/:id/marks')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Batch save student examination marks' })
  async recordMarks(
    @CurrentTenant() tenant: Tenant,
    @Param('id') scheduleId: string,
    @Body() dto: { marks: any[] },
  ) {
    return this.examsService.recordMarksBatch(this.ensureTenant(tenant), scheduleId, dto.marks || []);
  }

  // --- HALL TICKET WITH FEE CLEARANCE GATE ---
  @Get('hall-ticket')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate digital verifiable hall ticket for a student with fee clearance verification' })
  async generateHallTicket(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId: string,
    @Query('examId') examId: string,
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    let effectiveStudentId = studentId;
    if (role === 'STUDENT') {
      if (!user?.studentId) {
        throw new ForbiddenException('Student profile not found for authenticated user.');
      }
      effectiveStudentId = user.studentId;
    }
    return this.examsService.generateHallTicket(this.ensureTenant(tenant), effectiveStudentId, examId);
  }

  // --- REPORTS & GAZETTE ---
  @Get('reports')
  @Roles('CAMPUS_ADMIN', 'FACULTY', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get examination result reports, gazette summary, and fee defaulters' })
  async getReports(
    @CurrentTenant() tenant: Tenant,
    @Query('examId') examId?: string,
  ) {
    return this.examsService.getReports(this.ensureTenant(tenant), examId);
  }

  // --- ARREARS & BACKLOGS ---
  @Get('backlogs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all academic backlogs and arrears (students restricted to self)' })
  async findBacklogs(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') queryStudentId?: string,
  ) {
    const tenantId = this.ensureTenant(tenant);
    const filterStudentId = (user?.role || '').toUpperCase() === 'STUDENT'
      ? (user.studentId || user.id)
      : queryStudentId;
    return this.examsService.findAllBacklogs(tenantId, filterStudentId);
  }

  @Post('backlogs')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record student academic backlog / arrear' })
  async createBacklog(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.ensureTenant(tenant);
    return this.examsService.createBacklog(tenantId, dto);
  }

  @Patch('backlogs/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update backlog status or attempt count' })
  async updateBacklog(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.ensureTenant(tenant);
    return this.examsService.updateBacklog(tenantId, id, dto);
  }

  @Delete('backlogs/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete backlog record' })
  async deleteBacklog(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.ensureTenant(tenant);
    return this.examsService.deleteBacklog(tenantId, id);
  }
}
