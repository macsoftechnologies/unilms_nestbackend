import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findNotifications(tenantId: string, userId?: string, unreadOnly = false) {
    const cacheKey = `notif:${tenantId}:${userId || 'all'}:${unreadOnly ? 'unread' : 'all'}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (unreadOnly) where.isRead = false;

    const notifs = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    await this.redis.set(cacheKey, notifs, 60); // 60s cache
    return notifs;
  }

  async markAllRead(tenantId: string, userId?: string) {
    const where: any = { tenantId, isRead: false };
    if (userId) where.userId = userId;

    await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    await this.redis.delByPattern(`notif:${tenantId}:*`);
    return { success: true };
  }

  async markAsRead(tenantId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notif) throw new NotFoundException('Notification not found.');

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    // Invalidate notification caches for user / tenant
    await this.redis.delByPattern(`notif:${tenantId}:${notif.userId || '*'}:*`);
    return updated;
  }

  async createNotification(tenantId: string, data: any) {
    const created = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        isRead: false,
      },
    });

    // Invalidate notification caches
    await this.redis.delByPattern(`notif:${tenantId}:${data.userId || '*'}:*`);
    return created;
  }
}
