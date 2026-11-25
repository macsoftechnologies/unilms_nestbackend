import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { CbtService } from './cbt.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Phase 8 & 11: CBT Exam Player Engine & Quiz Management')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('cbt')
export class CbtController {
  constructor(private readonly cbtService: CbtService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for CBT operations.');
    return id;
  }

  // --- PLAYER SESSION ENDPOINTS ---
  @Post('start')
  @ApiOperation({ summary: 'Initialize or resume CBT test session' })
  async startOrResumeSession(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    if ((user?.role || '').toUpperCase() === 'STUDENT' && user?.studentId) {
      dto.studentId = user.studentId;
    }
    return this.cbtService.startOrResumeSession(tenantId, dto);
  }

  @Get('session/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'Get current CBT exam player state, timer and answers' })
  async getSession(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.getSession(tenantId, id, user);
  }

  @Post('session/:id/heartbeat')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: '30-second polling heartbeat: Autosave responses and proctoring timer' })
  async recordHeartbeat(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { remainingSeconds: number; answers: Record<string, any>; tabSwitched?: boolean },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.recordHeartbeat(tenantId, id, dto, user);
  }

  @Post('session/:id/submit')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'STUDENT')
  @ApiOperation({ summary: 'Finalize and submit CBT test' })
  async submitSession(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { answers: Record<string, any> },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.submitSession(tenantId, id, dto, user);
  }

  // --- QUIZ & QUESTION BANK MANAGEMENT ---
  @Get('quizzes')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'List all quizzes with question banks' })
  async getQuizzes(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.findAllQuizzes(tenantId, user);
  }

  @Get('quizzes/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT')
  @ApiOperation({ summary: 'Get single quiz with questions' })
  async getQuiz(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.findQuizById(tenantId, id, user);
  }

  @Post('quizzes')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Create new CBT quiz' })
  async createQuiz(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() dto: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.createQuiz(tenantId, dto);
  }

  @Patch('quizzes/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Update CBT quiz details and questions' })
  async updateQuiz(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.updateQuiz(tenantId, id, dto);
  }

  @Delete('quizzes/:id')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Delete CBT quiz' })
  async deleteQuiz(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.deleteQuiz(tenantId, id);
  }

  @Post('quizzes/:id/questions/sync')
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Batch sync all questions for a quiz' })
  async syncQuestions(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.cbtService.syncQuestions(tenantId, id, dto.questions || []);
  }
}
