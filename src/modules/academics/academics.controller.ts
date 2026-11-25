import {
  Controller,
  UnauthorizedException,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Academic Structure & Campus Systems')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. AIT, SXG, HAE, ORG1)' })
@Controller('academics')
export class AcademicsController {
  constructor(
    private readonly academicsService: AcademicsService,
    private readonly prisma: PrismaService,
  ) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (id) return id;
    throw new UnauthorizedException('Tenant context required for academic operations.');
  }

  // --- DEPARTMENTS ---
  @Get('departments')
  @ApiOperation({ summary: 'List all departments for current institution' })
  async getDepartments(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getDepartments(tenantId);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create department under current institution' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createDepartment(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createDepartment(tenantId, dto);
  }

  @Put('departments/:id')
  @ApiOperation({ summary: 'Update department' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateDepartment(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateDepartment(tenantId, id, dto);
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete department' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteDepartment(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteDepartment(tenantId, id);
  }

  // --- PROGRAMS ---
  @Get('programs')
  @ApiOperation({ summary: 'List academic programs / degrees' })
  async getPrograms(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getPrograms(tenantId);
  }

  @Post('programs')
  @ApiOperation({ summary: 'Create academic program' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createProgram(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createProgram(tenantId, dto);
  }

  @Put('programs/:id')
  @ApiOperation({ summary: 'Update academic program' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateProgram(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateProgram(tenantId, id, dto);
  }

  @Delete('programs/:id')
  @ApiOperation({ summary: 'Delete academic program' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteProgram(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteProgram(tenantId, id);
  }

  // --- ACADEMIC YEARS ---
  @Get('academic-years')
  @ApiOperation({ summary: 'List academic calendar years' })
  async getAcademicYears(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getAcademicYears(tenantId);
  }

  @Post('academic-years')
  @ApiOperation({ summary: 'Create academic year' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createAcademicYear(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createAcademicYear(tenantId, dto);
  }

  @Put('academic-years/:id')
  @ApiOperation({ summary: 'Update academic year' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateAcademicYear(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateAcademicYear(tenantId, id, dto);
  }

  @Delete('academic-years/:id')
  @ApiOperation({ summary: 'Delete academic year' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteAcademicYear(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteAcademicYear(tenantId, id);
  }

  // --- SEMESTERS ---
  @Get('semesters')
  @ApiOperation({ summary: 'List standard semesters' })
  async getSemesters(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getSemesters(tenantId);
  }

  @Post('semesters')
  @ApiOperation({ summary: 'Create semester definition' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createSemester(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createSemester(tenantId, dto);
  }

  @Put('semesters/:id')
  @ApiOperation({ summary: 'Update semester' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateSemester(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateSemester(tenantId, id, dto);
  }

  @Delete('semesters/:id')
  @ApiOperation({ summary: 'Delete semester' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteSemester(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteSemester(tenantId, id);
  }

  // --- COHORTS ---
  @Get('cohorts')
  @ApiOperation({ summary: 'List student batches and cohorts' })
  async getCohorts(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getCohorts(tenantId);
  }

  @Post('cohorts')
  @ApiOperation({ summary: 'Create cohort / student batch' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createCohort(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createCohort(tenantId, dto);
  }

  @Put('cohorts/:id')
  @ApiOperation({ summary: 'Update cohort' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateCohort(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateCohort(tenantId, id, dto);
  }

  @Delete('cohorts/:id')
  @ApiOperation({ summary: 'Delete cohort' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteCohort(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteCohort(tenantId, id);
  }

  // --- SECTIONS ---
  @Get('sections')
  @ApiOperation({ summary: 'List class sections' })
  async getSections(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getSections(tenantId);
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create class section' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createSection(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createSection(tenantId, dto);
  }

  @Put('sections/:id')
  @ApiOperation({ summary: 'Update class section' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateSection(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateSection(tenantId, id, dto);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete class section' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteSection(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteSection(tenantId, id);
  }

  // --- SUBJECTS ---
  @Get('subjects')
  @ApiOperation({ summary: 'List curriculum subjects and courses' })
  async getSubjects(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getSubjects(tenantId);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create curriculum subject' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createSubject(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createSubject(tenantId, dto);
  }

  @Put('subjects/:id')
  @ApiOperation({ summary: 'Update curriculum subject' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateSubject(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateSubject(tenantId, id, dto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete curriculum subject' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteSubject(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteSubject(tenantId, id);
  }

  // --- ACCESS GROUPS (RBAC) ---
  @Get('access-groups')
  @ApiOperation({ summary: 'List campus RBAC access groups' })
  async getAccessGroups(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getAccessGroups(tenantId);
  }

  @Post('access-groups')
  @ApiOperation({ summary: 'Create campus access group' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createAccessGroup(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createAccessGroup(tenantId, dto);
  }

  @Put('access-groups/:id')
  @ApiOperation({ summary: 'Update campus access group' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateAccessGroup(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateAccessGroup(tenantId, id, dto);
  }

  @Delete('access-groups/:id')
  @ApiOperation({ summary: 'Delete campus access group' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteAccessGroup(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteAccessGroup(tenantId, id);
  }

  // --- REGULATIONS ---
  @Get('regulations')
  @ApiOperation({ summary: 'List academic regulations' })
  async getRegulations(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getRegulations(tenantId);
  }

  @Post('regulations')
  @ApiOperation({ summary: 'Create academic regulation' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createRegulation(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createRegulation(tenantId, dto);
  }

  @Put('regulations/:id')
  @ApiOperation({ summary: 'Update academic regulation' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async updateRegulation(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateRegulation(tenantId, id, dto);
  }

  @Delete('regulations/:id')
  @ApiOperation({ summary: 'Delete academic regulation' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteRegulation(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteRegulation(tenantId, id);
  }

  // --- TIMETABLE & PERIODS ---
  @Get('timetable/periods')
  @ApiOperation({ summary: 'List timetable periods' })
  async getTimetablePeriods(@CurrentTenant() tenant: Tenant) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getTimetablePeriods(tenantId);
  }

  @Post('timetable/periods')
  @ApiOperation({ summary: 'Create timetable period' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async createTimetablePeriod(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createTimetablePeriod(tenantId, dto);
  }

  @Delete('timetable/periods/:id')
  @ApiOperation({ summary: 'Delete timetable period' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteTimetablePeriod(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteTimetablePeriod(tenantId, id);
  }

  @Get('timetable/slots')
  @ApiOperation({ summary: 'List timetable slots' })
  async getTimetableSlots(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getTimetableSlots(tenantId, query);
  }

  @Post('timetable/slots')
  @ApiOperation({ summary: 'Create or update timetable slot' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async saveTimetableSlot(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.saveTimetableSlot(tenantId, dto);
  }

  @Delete('timetable/slots/:id')
  @ApiOperation({ summary: 'Delete timetable slot' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  async deleteTimetableSlot(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteTimetableSlot(tenantId, id);
  }

  // --- STUDY MATERIALS ---
  @Get('materials')
  @ApiOperation({ summary: 'List study materials' })
  async getStudyMaterials(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getStudyMaterials(tenantId, query);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create study material' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async createStudyMaterial(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createStudyMaterial(tenantId, dto);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete study material' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async deleteStudyMaterial(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteStudyMaterial(tenantId, id);
  }

  @Patch('materials/:id')
  @ApiOperation({ summary: 'Update study material' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async updateStudyMaterial(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateStudyMaterial(tenantId, id, dto);
  }

  // --- ASSIGNMENTS & CONTINUOUS ASSESSMENTS ---
  @Get('assessments')
  @ApiOperation({ summary: 'List course assignments and continuous assessments' })
  async getAssessments(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.getAssessments(tenantId, query);
  }

  @Post('assessments')
  @ApiOperation({ summary: 'Create course assignment / continuous assessment' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async createAssessment(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.createAssessment(tenantId, dto);
  }

  @Patch('assessments/:id')
  @ApiOperation({ summary: 'Update course assignment' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async updateAssessment(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.updateAssessment(tenantId, id, dto);
  }

  @Delete('assessments/:id')
  @ApiOperation({ summary: 'Delete course assignment' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async deleteAssessment(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant);
    return this.academicsService.deleteAssessment(tenantId, id);
  }

  @Get('assessments/:id/marks')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'Get student marks and submissions for an assessment (students restricted to self)' })
  async getAssessmentMarks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const studentId = (user?.role || '').toUpperCase() === 'STUDENT' ? (user.studentId || user.id) : undefined;
    return this.academicsService.getAssessmentMarks(tenantId, id, studentId);
  }

  @Post('assessments/:id/marks')
  @ApiOperation({ summary: 'Batch grade student assessment submissions' })
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  async saveAssessmentMarks(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { marks: any[] },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.academicsService.saveAssessmentMarks(tenantId, id, dto.marks || []);
  }

  @Post('assessments/:id/submit')
  @ApiOperation({ summary: 'Submit student assignment deliverable or essay' })
  @Roles('STUDENT', 'CAMPUS_ADMIN', 'SUPER_ADMIN')
  async submitAssessment(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { essayText?: string; fileName?: string; remarks?: string; score?: number },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const studentId = user?.studentId || user?.id;
    if (!studentId) throw new UnauthorizedException('Student profile required for submission.');
    return this.academicsService.submitAssessment(tenantId, id, studentId, dto, user?.role);
  }

  @Get('assessments/:id/my-submission')
  @ApiOperation({ summary: 'Get current student submission for an assessment' })
  @Roles('STUDENT', 'CAMPUS_ADMIN', 'SUPER_ADMIN')
  async getMySubmission(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const studentId = user?.studentId || user?.id || 'demo-student';
    return this.academicsService.getStudentSubmission(tenantId, id, studentId);
  }
}
