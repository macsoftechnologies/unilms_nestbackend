import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 1. COURSES & CREATOR STUDIO
  async findCourses(tenantId: string, query?: { category?: string; isPublished?: boolean; search?: string }) {
    const cacheKey = `lms:courses:${tenantId}:${JSON.stringify(query || {})}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = { tenantId };
    if (query?.category && query.category !== 'all') where.category = query.category;
    if (query?.isPublished !== undefined) where.isPublished = query.isPublished;
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const courses = await this.prisma.lmsCourse.findMany({
      where,
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, courses, 900);
    return courses;
  }

  async getCourseById(tenantId: string, id: string) {
    const cacheKey = `lms:course:${tenantId}:${id}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const course = await this.prisma.lmsCourse.findFirst({
      where: { id, tenantId },
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');

    await this.redis.set(cacheKey, course, 900);
    return course;
  }

  async createCourse(tenantId: string, data: any) {
    const slug = (data.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const created = await this.prisma.lmsCourse.create({
      data: {
        tenantId,
        title: data.title,
        slug,
        description: data.description || 'Comprehensive online interactive learning course.',
        category: data.category || 'General',
        level: data.level || 'Beginner',
        thumbnail: data.thumbnail || null,
        instructorId: data.instructorId || null,
        isPublished: Boolean(data.isPublished),
      },
      include: {
        instructor: true,
        modules: true,
      },
    });

    // Invalidate course list caches for this tenant
    await this.redis.delByPattern(`lms:courses:${tenantId}:*`);
    return created;
  }

  async updateCourse(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.lmsCourse.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Course not found.');

    const updated = await this.prisma.lmsCourse.update({
      where: { id },
      data: {
        title: data.title || existing.title,
        description: data.description || existing.description,
        category: data.category || existing.category,
        level: data.level || existing.level,
        thumbnail: data.thumbnail !== undefined ? data.thumbnail : existing.thumbnail,
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : existing.isPublished,
      },
    });

    // Invalidate single course and list caches
    await this.redis.del(`lms:course:${tenantId}:${id}`);
    await this.redis.delByPattern(`lms:courses:${tenantId}:*`);
    return updated;
  }

  async addModule(tenantId: string, courseId: string, data: any) {
    const course = await this.prisma.lmsCourse.findFirst({
      where: { id: courseId, tenantId },
    });
    if (!course) throw new NotFoundException('Course not found.');

    const count = await this.prisma.lmsCourseModule.count({
      where: { courseId, tenantId },
    });

    const moduleRecord = await this.prisma.lmsCourseModule.create({
      data: {
        tenantId,
        courseId,
        title: data.title || `Module ${count + 1}`,
        order: data.order || count + 1,
      },
    });

    // Invalidate course cache
    await this.redis.del(`lms:course:${tenantId}:${courseId}`);
    await this.redis.delByPattern(`lms:courses:${tenantId}:*`);
    return moduleRecord;
  }

  async addLesson(tenantId: string, moduleId: string, data: any) {
    const mod = await this.prisma.lmsCourseModule.findFirst({
      where: { id: moduleId, tenantId },
    });
    if (!mod) throw new NotFoundException('Module not found.');

    const count = await this.prisma.lmsCourseLesson.count({
      where: { moduleId, tenantId },
    });

    const lesson = await this.prisma.lmsCourseLesson.create({
      data: {
        tenantId,
        moduleId,
        title: data.title,
        contentType: data.contentType || 'VIDEO',
        videoUrl: data.videoUrl || null,
        durationMinutes: Number(data.durationMinutes) || 10,
        textContent: data.textContent || null,
        order: data.order || count + 1,
      },
    });

    // Invalidate caches
    await this.redis.del(`lms:course:${tenantId}:${mod.courseId}`);
    await this.redis.delByPattern(`lms:courses:${tenantId}:*`);
    return lesson;
  }

  // 2. ENROLLMENTS & STUDENT PROGRESS
  async enrollCourse(tenantId: string, courseId: string, studentId: string) {
    return this.prisma.lmsCourseEnrollment.upsert({
      where: {
        tenantId_courseId_studentId: {
          tenantId,
          courseId,
          studentId,
        },
      },
      create: {
        tenantId,
        courseId,
        studentId,
        progressPct: 0.0,
        status: 'IN_PROGRESS',
      },
      update: {},
      include: {
        course: true,
      },
    });
  }

  async getMyCourses(tenantId: string, studentId: string) {
    return this.prisma.lmsCourseEnrollment.findMany({
      where: { tenantId, studentId },
      include: {
        course: {
          include: {
            instructor: true,
            modules: {
              include: { lessons: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProgress(tenantId: string, courseId: string, studentId: string, progressPct: number) {
    const status = progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
    const completedAt = progressPct >= 100 ? new Date() : null;

    return this.prisma.lmsCourseEnrollment.upsert({
      where: {
        tenantId_courseId_studentId: {
          tenantId,
          courseId,
          studentId,
        },
      },
      create: {
        tenantId,
        courseId,
        studentId,
        progressPct,
        status,
        completedAt,
      },
      update: {
        progressPct,
        status,
        completedAt,
      },
    });
  }
}

