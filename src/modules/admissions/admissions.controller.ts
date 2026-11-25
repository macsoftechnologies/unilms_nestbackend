import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AdmissionsService } from './admissions.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Admissions & Student Lifecycle CRM')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  private ensureTenant(tenant: Tenant): string {
    if (!tenant?.id) {
      throw new UnauthorizedException('Tenant context required for admissions operations.');
    }
    return tenant.id;
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dynamic admissions KPI metrics and program intake analytics' })
  async getDashboardStats(@CurrentTenant() tenant: Tenant) {
    return this.admissionsService.getDashboardStats(this.ensureTenant(tenant));
  }

  // --- LEADS CRM ---
  @Get('leads')
  @ApiOperation({ summary: 'List admissions leads with search & status filters' })
  async getLeads(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    return this.admissionsService.findAllLeads(this.ensureTenant(tenant), query);
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create new admissions lead' })
  async createLead(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.admissionsService.createLead(this.ensureTenant(tenant), dto);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update admissions lead details or status' })
  async updateLead(@CurrentTenant() tenant: Tenant, @Param('id') id: string, @Body() dto: any) {
    return this.admissionsService.updateLead(this.ensureTenant(tenant), id, dto);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Delete lead' })
  async deleteLead(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.admissionsService.deleteLead(this.ensureTenant(tenant), id);
  }

  // --- APPLICATIONS ---
  @Get('applications')
  @ApiOperation({ summary: 'List student admission applications' })
  async getApplications(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    return this.admissionsService.findAllApplications(this.ensureTenant(tenant), query);
  }

  @Post('applications')
  @ApiOperation({ summary: 'Submit new student application' })
  async createApplication(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.admissionsService.createApplication(this.ensureTenant(tenant), dto);
  }

  @Patch('applications/:id/status')
  @ApiOperation({ summary: 'Update application review status' })
  async updateApplicationStatus(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.admissionsService.updateApplicationStatus(this.ensureTenant(tenant), id, status);
  }

  @Post('applications/:id/offer-letter')
  @ApiOperation({ summary: 'Generate and issue formal offer letter' })
  async issueOfferLetter(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.admissionsService.issueOfferLetter(this.ensureTenant(tenant), id, dto);
  }

  @Post('applications/:id/enroll')
  @ApiOperation({ summary: 'Enroll applicant directly as active student profile' })
  async enrollApplication(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.admissionsService.enrollApplication(this.ensureTenant(tenant), id, dto);
  }

  @Delete('applications/:id')
  @ApiOperation({ summary: 'Delete student admission application' })
  async deleteApplication(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.admissionsService.deleteApplication(this.ensureTenant(tenant), id);
  }

  // --- DOCUMENT VERIFICATION ---
  @Get('documents')
  @ApiOperation({ summary: 'List applicants with document verification checklists' })
  async getDocuments(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    return this.admissionsService.getDocuments(this.ensureTenant(tenant), query);
  }

  @Patch('documents/:id')
  @ApiOperation({ summary: 'Update candidate document verification status' })
  async updateDocumentVerification(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.admissionsService.updateDocumentVerification(this.ensureTenant(tenant), id, dto);
  }

  // --- QUOTAS & CATEGORIES ---
  @Get('categories')
  @ApiOperation({ summary: 'List admission quota categories with live enrolled counts' })
  async getCategories(@CurrentTenant() tenant: Tenant) {
    return this.admissionsService.getCategories(this.ensureTenant(tenant));
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create admission quota category' })
  async createCategory(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.admissionsService.createCategory(this.ensureTenant(tenant), dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update admission quota category' })
  async updateCategory(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.admissionsService.updateCategory(this.ensureTenant(tenant), id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete admission quota category' })
  async deleteCategory(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.admissionsService.deleteCategory(this.ensureTenant(tenant), id);
  }

  // --- SCHOLARSHIPS ---
  @Get('scholarships')
  @ApiOperation({ summary: 'List student scholarships and fee concessions' })
  async getScholarships(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    return this.admissionsService.getScholarships(this.ensureTenant(tenant), query);
  }

  @Post('scholarships')
  @ApiOperation({ summary: 'Grant or apply for scholarship' })
  async createScholarship(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.admissionsService.createScholarship(this.ensureTenant(tenant), dto);
  }

  @Patch('scholarships/:id')
  @ApiOperation({ summary: 'Update scholarship status or amount' })
  async updateScholarship(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.admissionsService.updateScholarship(this.ensureTenant(tenant), id, dto);
  }

  @Delete('scholarships/:id')
  @ApiOperation({ summary: 'Delete scholarship' })
  async deleteScholarship(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.admissionsService.deleteScholarship(this.ensureTenant(tenant), id);
  }

  // --- PAYMENTS & SEAT BOOKING ---
  @Get('payments')
  @ApiOperation({ summary: 'List seat booking and admission fee payments' })
  async getPayments(@CurrentTenant() tenant: Tenant, @Query() query: any) {
    return this.admissionsService.getPayments(this.ensureTenant(tenant), query);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record admission seat booking or application payment' })
  async createPayment(@CurrentTenant() tenant: Tenant, @Body() dto: any) {
    return this.admissionsService.createPayment(this.ensureTenant(tenant), dto);
  }

  // --- COLLEGE STRENGTH CENSUS ---
  @Get('college-strength')
  @ApiOperation({ summary: 'Get live department-wise and program-wise college strength census' })
  async getCollegeStrength(@CurrentTenant() tenant: Tenant) {
    return this.admissionsService.getCollegeStrength(this.ensureTenant(tenant));
  }

  // --- DETAINED STUDENTS ---
  @Get('detained')
  @ApiOperation({ summary: 'List detained or barred students' })
  async getDetainedStudents(@CurrentTenant() tenant: Tenant) {
    return this.admissionsService.getDetainedStudents(this.ensureTenant(tenant));
  }

  @Post('detained/:id/readmit')
  @ApiOperation({ summary: 'Readmit detained student back to active status' })
  async readmitStudent(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.admissionsService.readmitStudent(this.ensureTenant(tenant), id);
  }

  // --- CONVERSION FUNNEL ---
  @Get('funnel')
  @ApiOperation({ summary: 'Get 7-stage conversion funnel analytics' })
  async getFunnel(@CurrentTenant() tenant: Tenant) {
    return this.admissionsService.getFunnel(this.ensureTenant(tenant));
  }
}

