import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ObeService } from './obe.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Outcome-Based Education (OBE)')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('obe')
export class ObeController {
  constructor(private readonly obeService: ObeService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for OBE operations.');
    return id;
  }

  @Get('cos')
  @ApiOperation({ summary: 'List Course Outcomes (COs)' })
  async findCos(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('subjectId') subjectId?: string) {
    return this.obeService.findCos(this.getTenantId(tenant, user), subjectId);
  }

  @Post('cos')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Define new Course Outcome' })
  async createCo(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    return this.obeService.createCo(this.getTenantId(tenant, user), dto);
  }

  @Get('pos')
  @ApiOperation({ summary: 'List Program Outcomes (POs/PSOs)' })
  async findPos(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Query('programId') programId?: string) {
    return this.obeService.findPos(this.getTenantId(tenant, user), programId);
  }

  @Post('pos')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Define new Program Outcome' })
  async createPo(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    return this.obeService.createPo(this.getTenantId(tenant, user), dto);
  }

  @Post('pos/seed/:programId')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Auto-seed standard NBA/NAAC Program Outcomes into database' })
  async seedPos(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('programId') programId: string) {
    return this.obeService.seedStandardPosForProgram(this.getTenantId(tenant, user), programId);
  }

  @Get('matrix/:subjectId')
  @ApiOperation({ summary: 'Get CO-PO Articulation Matrix for a course' })
  async findMatrix(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('subjectId') subjectId: string) {
    return this.obeService.findCoPoMatrix(this.getTenantId(tenant, user), subjectId);
  }

  @Post('matrix/mapping')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Save CO-PO Correlation Mapping (1=Low, 2=Med, 3=High)' })
  async saveMapping(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    return this.obeService.saveCoPoMapping(this.getTenantId(tenant, user), dto);
  }

  @Get('attainment-report')
  @ApiOperation({ summary: 'Compute NBA CO-PO Attainment Analysis Report' })
  async getAttainmentReport(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('subjectId') subjectId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.obeService.calculateAttainmentReport(
      this.getTenantId(tenant, user),
      subjectId,
      academicYear || '2026-2027',
    );
  }
}
