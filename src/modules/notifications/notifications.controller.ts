import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '@prisma/client';

@ApiTags('Phase 8: In-App Smart Polling Notification Engine')
@ApiHeader({ name: 'X-Tenant-Code', description: 'Institution Identifier' })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getTenantId(tenant?: Tenant, user?: any): string {
    const id = tenant?.id || user?.tenantId;
    if (!id) throw new UnauthorizedException('Tenant context required for notifications.');
    return id;
  }

  @Get()
  @ApiOperation({ summary: 'Smart Polling Endpoint: Poll notifications (supports ?unread=true)' })
  async findNotifications(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Query('unread') unread?: string,
  ) {
    const isUnread = unread === 'true';
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    const effectiveUserId = (role === 'SUPER_ADMIN' || role === 'CAMPUS_ADMIN') ? undefined : user?.id;
    return this.notificationsService.findNotifications(tenantId, effectiveUserId, isUnread);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.notificationsService.markAsRead(tenantId, id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for tenant' })
  async markAllRead(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    const role = (user?.role || '').toUpperCase();
    const effectiveUserId = (role === 'SUPER_ADMIN' || role === 'CAMPUS_ADMIN') ? undefined : user?.id;
    return this.notificationsService.markAllRead(tenantId, effectiveUserId);
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SUPER_ADMIN', 'FACULTY')
  @ApiOperation({ summary: 'Dispatch new system notification' })
  async createNotification(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const tenantId = this.getTenantId(tenant, user);
    return this.notificationsService.createNotification(tenantId, dto);
  }
}
