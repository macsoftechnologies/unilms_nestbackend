import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Phase 8: Student LMS & Creator Studio')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier (e.g. AIT, SXG, HAE)' })
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  private ensureTenant(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) {
      throw new UnauthorizedException('Tenant context required for LMS operations.');
    }
    return id;
  }

  @Get('courses')
  @ApiOperation({ summary: 'Browse published or draft LMS online courses' })
  async findCourses(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('isPublished') isPublished?: string,
    @Query('search') search?: string,
  ) {
    const pub = isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.lmsService.findCourses(this.ensureTenant(tenant, user), { category, isPublished: pub, search });
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course curriculum structure with modules and lessons' })
  async getCourseById(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    return this.lmsService.getCourseById(this.ensureTenant(tenant, user), id);
  }

  @Post('courses')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Create new course in Creator Studio' })
  async createCourse(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    return this.lmsService.createCourse(this.ensureTenant(tenant, user), dto);
  }

  @Put('courses/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Update course details in Creator Studio' })
  async updateCourse(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.lmsService.updateCourse(this.ensureTenant(tenant, user), id, dto);
  }

  @Post('courses/:id/modules')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Add learning module to a course' })
  async addModule(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.lmsService.addModule(this.ensureTenant(tenant, user), id, dto);
  }

  @Post('modules/:id/lessons')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Add video or text lesson to a module' })
  async addLesson(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.lmsService.addLesson(this.ensureTenant(tenant, user), id, dto);
  }

  @Post('courses/:id/enroll')
  @ApiOperation({ summary: 'Enroll student into a course' })
  async enrollCourse(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    const targetStudentId = role === 'STUDENT' ? (user.studentId || studentId) : studentId;
    return this.lmsService.enrollCourse(this.ensureTenant(tenant, user), id, targetStudentId);
  }

  @Get('my-courses')
  @ApiOperation({ summary: 'Get enrolled courses and progress for active student' })
  async getMyCourses(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    const effectiveStudentId = role === 'STUDENT' ? (user?.studentId || '') : (studentId || user?.studentId || '');
    return this.lmsService.getMyCourses(this.ensureTenant(tenant, user), effectiveStudentId);
  }

  @Patch('courses/:id/progress')
  @ApiOperation({ summary: 'Update student course completion percentage' })
  async updateProgress(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { studentId: string; progressPct: number },
  ) {
    const role = (user?.role || '').toUpperCase().replace(/-/g, '_');
    const effectiveStudentId = role === 'STUDENT' ? (user?.studentId || '') : (body.studentId || user?.studentId || '');
    return this.lmsService.updateProgress(
      this.ensureTenant(tenant, user),
      id,
      effectiveStudentId,
      Number(body.progressPct) || 0,
    );
  }
}
