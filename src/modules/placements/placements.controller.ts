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
import { PlacementsService } from './placements.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Phase 12: Campus Placements & Career Portal')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('placements')
export class PlacementsController {
  constructor(
    private readonly placementsService: PlacementsService,
  ) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) {
      throw new UnauthorizedException('Tenant context required for placements operations.');
    }
    return id;
  }

  // --- COMPANIES ---
  @Get('companies')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all placement partner companies' })
  async getCompanies(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.findAllCompanies(tenantId);
  }

  @Post('companies')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create partner company' })
  async createCompany(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.createCompany(tenantId, dto);
  }

  @Patch('companies/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update partner company details' })
  async updateCompany(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.updateCompany(tenantId, id, dto);
  }

  @Delete('companies/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete partner company' })
  async deleteCompany(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.deleteCompany(tenantId, id);
  }

  // --- RECRUITMENT DRIVES ---
  @Get('drives')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all placement drives' })
  async getDrives(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.findAllDrives(tenantId);
  }

  @Post('drives')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create recruitment drive' })
  async createDrive(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.createDrive(tenantId, dto);
  }

  @Patch('drives/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update recruitment drive' })
  async updateDrive(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.updateDrive(tenantId, id, dto);
  }

  @Delete('drives/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete recruitment drive' })
  async deleteDrive(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.deleteDrive(tenantId, id);
  }

  // --- CANDIDATE APPLICATIONS ---
  @Get('applications')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List candidate job applications (Strictly scoped by student for student caller)' })
  async getApplications(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('driveId') driveId?: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    const effectiveStudentId = isStudent ? (user.studentId || user.id) : undefined;
    return this.placementsService.findAllApplications(tenantId, driveId, effectiveStudentId);
  }

  @Post('applications')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: 'Submit candidate job application (Enforces authenticated student ID)' })
  async createApplication(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    if (isStudent && user.studentId) {
      dto.studentId = user.studentId;
    }
    return this.placementsService.createApplication(tenantId, dto);
  }

  @Patch('applications/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update candidate selection round / status' })
  async updateApplication(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.updateApplicationStage(tenantId, id, dto);
  }

  @Delete('applications/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: 'Withdraw / remove application (Scoped to owning student if student caller)' })
  async deleteApplication(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    const effectiveStudentId = isStudent ? (user.studentId || user.id) : undefined;
    return this.placementsService.deleteApplication(tenantId, id, effectiveStudentId);
  }

  // --- OFFERS ---
  @Get('offers')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all issued placement offers (Scoped for student callers)' })
  async getOffers(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    const effectiveStudentId = isStudent ? (user.studentId || user.id) : undefined;
    return this.placementsService.findAllOffers(tenantId, effectiveStudentId);
  }

  @Post('offers')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Record placement job offer' })
  async createOffer(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.createOffer(tenantId, dto);
  }

  @Patch('offers/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update placement offer details' })
  async updateOffer(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.updateOffer(tenantId, id, dto);
  }

  @Delete('offers/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revoke placement offer' })
  async deleteOffer(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.deleteOffer(tenantId, id);
  }

  // --- INTERNSHIPS ---
  @Get('internships')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all internship postings' })
  async getInternships(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.findAllInternships(tenantId);
  }

  @Post('internships')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create internship posting' })
  async createInternship(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.createInternship(tenantId, dto);
  }

  @Patch('internships/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update internship posting' })
  async updateInternship(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.updateInternship(tenantId, id, dto);
  }

  @Delete('internships/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete internship posting' })
  async deleteInternship(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.placementsService.deleteInternship(tenantId, id);
  }
}
