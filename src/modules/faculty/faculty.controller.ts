import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Module 16: Faculty Workspace & Lesson Planner')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for faculty operations.');
    return id;
  }

  // --- 1. Overview Telemetry & Stats ---
  @Get('stats')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Get faculty workspace telemetry, syllabus delivery, and defaulter rates' })
  async getStats(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('staffId') staffId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetStaffId = user?.staffId || staffId;
    return this.facultyService.getStats(tenantId, targetStaffId);
  }

  // --- 1B. Faculty Dynamic Multi-Role Privileges ---
  @Get('me/privileges')
  @ApiOperation({ summary: 'Get current faculty verified permissions (isClassTeacher, isHOD, department)' })
  async getMyPrivileges(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const identifier = user?.email || user?.staffId;
    return this.facultyService.getPrivileges(tenantId, identifier);
  }

  @Get('privileges')
  @ApiOperation({ summary: 'Get verified faculty permissions by staffId or email' })
  async getPrivileges(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('email') email?: string,
    @Query('staffId') staffId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    if (role !== 'CAMPUS_ADMIN' && role !== 'SUPER_ADMIN') {
      const identifier = user?.email || user?.staffId;
      return this.facultyService.getPrivileges(tenantId, identifier);
    }
    return this.facultyService.getPrivileges(tenantId, email || staffId);
  }

  // --- 2. Subject Allocations ---
  @Get('allocations')
  @ApiOperation({ summary: 'List subject allocations for faculty' })
  async findAllocations(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('staffId') staffId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.findAllocations(tenantId, { staffId, subjectId });
  }

  @Post('allocations')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new faculty subject allocation' })
  async createAllocation(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.createAllocation(tenantId, dto);
  }

  @Delete('allocations/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a faculty subject allocation' })
  async deleteAllocation(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.deleteAllocation(tenantId, id);
  }

  // --- 3. Class Sessions & Period Attendance ---
  @Get('sessions')
  @ApiOperation({ summary: 'List class lecture sessions and period attendance' })
  async findSessions(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('staffId') staffId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('cohortName') cohortName?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.findSessions(tenantId, { staffId, subjectId, cohortName });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details with full attendance roster' })
  async getSessionById(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.getSessionById(tenantId, id);
  }

  @Post('sessions')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Record new class session and submit student attendance' })
  async createSession(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.createSession(tenantId, dto);
  }

  // --- 4. Continuous Assessments & Marks ---
  @Get('assessments')
  @ApiOperation({ summary: 'List continuous evaluation assessments (IA1, IA2, Practical, etc.)' })
  async findAssessments(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('subjectId') subjectId?: string,
    @Query('cohortName') cohortName?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.findAssessments(tenantId, { subjectId, cohortName });
  }

  @Post('assessments')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Create continuous assessment' })
  async createAssessment(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.createAssessment(tenantId, dto);
  }

  @Get('assessments/:id/marks')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'Get marks roster for an assessment (students restricted to self)' })
  async getAssessmentMarks(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    const studentId = (user?.role || '').toUpperCase() === 'STUDENT' ? (user.studentId || user.id) : undefined;
    return this.facultyService.getAssessmentMarks(tenantId, id, studentId);
  }

  @Post('assessments/:id/marks')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Save or update student marks for an assessment' })
  async saveAssessmentMarks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { marks: any[] },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.saveAssessmentMarks(tenantId, id, body.marks || []);
  }

  @Delete('assessments/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Delete continuous assessment' })
  async deleteAssessment(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.deleteAssessment(tenantId, id);
  }

  // --- 5. Lesson Plans / Syllabus Delivery ---
  @Get('lesson-plans')
  @ApiOperation({ summary: 'List syllabus lesson plans for courses' })
  async findLessonPlans(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('subjectId') subjectId?: string,
    @Query('staffId') staffId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.findLessonPlans(tenantId, { subjectId, staffId });
  }

  @Post('lesson-plans')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Create lesson plan module or topic' })
  async createLessonPlan(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.createLessonPlan(tenantId, dto);
  }

  @Patch('lesson-plans/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Update lesson plan progress / status' })
  async updateLessonPlan(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.updateLessonPlan(tenantId, id, dto);
  }

  @Delete('lesson-plans/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Delete a lesson plan unit' })
  async deleteLessonPlan(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.deleteLessonPlan(tenantId, id);
  }

  // --- 6. Class Teacher Monitor & Defaulters ---
  @Get('monitor/defaulters')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Get cohort students attendance rates and identify defaulters below 75%' })
  async getCohortDefaulters(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('cohortName') cohortName?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.getCohortDefaulters(tenantId, cohortName);
  }

  // --- 7. Faculty Timetable ---
  @Get('timetable')
  @ApiOperation({ summary: 'Get faculty weekly timetable schedule' })
  async getTimetable(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('staffId') staffId?: string,
    @Query('day') day?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetStaffId = user?.staffId || staffId;
    return this.facultyService.getTimetable(tenantId, { staffId: targetStaffId, day });
  }

  // --- 8. Faculty Leaves & Applications ---
  @Get('leaves')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'List faculty leave applications' })
  async findLeaves(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const targetStaffId = user?.staffId || staffId;
    return this.facultyService.findLeaves(tenantId, { staffId: targetStaffId, status });
  }

  @Post('leaves')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Submit new leave application' })
  async applyLeave(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    if (user?.staffId) dto.staffId = user.staffId;
    return this.facultyService.applyLeave(tenantId, dto);
  }

  @Patch('leaves/:id/status')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update leave status (Approve / Reject)' })
  async updateLeaveStatus(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: string; approvedBy?: string },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.updateLeaveStatus(tenantId, id, body.status, body.approvedBy);
  }

  @Delete('leaves/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel / delete leave application' })
  async deleteLeave(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.deleteLeave(tenantId, id);
  }

  // --- 9. Faculty Profiles Directory ---
  @Get('profiles')
  @ApiOperation({ summary: 'List faculty directory profiles' })
  async findProfiles(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.findProfiles(tenantId, { departmentId, search });
  }

  @Post('profiles')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create new faculty profile' })
  async createProfile(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.createProfile(tenantId, dto);
  }

  @Put('profiles/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update faculty profile' })
  async updateProfile(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.updateProfile(tenantId, id, dto);
  }

  @Delete('profiles/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete faculty profile' })
  async deleteProfile(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.facultyService.deleteProfile(tenantId, id);
  }
}
