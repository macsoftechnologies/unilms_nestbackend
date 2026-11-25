import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, SuperAdminLoginDto, RefreshTokenDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Authentication & User Management')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required.');
    return id;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Multi-Tenant Campus Login (Student, Faculty, Staff, Parent)' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('superadmin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Global Super Admin Login' })
  @ApiResponse({ status: 200, description: 'Super Admin authenticated successfully' })
  async superAdminLogin(@Body() dto: SuperAdminLoginDto) {
    return this.authService.superAdminLogin(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Access Token using long-lived Refresh Token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Get('users')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN')
  @ApiOperation({ summary: 'List all institutional users for tenant' })
  async getUsers(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.authService.getUsers(tenantId);
  }

  @Post('users')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN')
  @ApiOperation({ summary: 'Create user credential' })
  async createUser(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any, @Body() body: any) {
    const tenantId = this.getTenantId(tenant, user);
    return this.authService.createUser(tenantId, body);
  }

  @Put('users/:id')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN')
  @ApiOperation({ summary: 'Update user credential' })
  async updateUser(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.authService.updateUser(tenantId, id, body);
  }

  @Delete('users/:id')
  @Roles('SUPER_ADMIN', 'CAMPUS_ADMIN')
  @ApiOperation({ summary: 'Delete user credential' })
  async deleteUser(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.authService.deleteUser(tenantId, id);
  }

  @Get('access-groups')
  @ApiOperation({ summary: 'List standard access groups' })
  async getAccessGroups(@CurrentTenant() tenant: Tenant, @CurrentUser() user: any) {
    const tenantId = tenant?.id || user?.tenantId;
    return this.authService.getAccessGroups(tenantId);
  }
}
