import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(tenantId: string, query?: { staffId?: string; status?: string; leaveType?: string }, currentUser?: any) {
    const count = await this.prisma.leaveApplication.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialLeaves(tenantId);
    }

    const where: any = { tenantId };

    // Scoping: If user is FACULTY, restrict strictly to their own leaves
    const role = (currentUser?.role || '').toUpperCase().replace(/-/g, '_');
    if (role === 'FACULTY' && currentUser?.id) {
      const staffRecord = await this.prisma.staffProfile.findFirst({
        where: { tenantId, userId: currentUser.id },
      });
      if (staffRecord) {
        where.staffId = staffRecord.id;
      }
    } else if (query?.staffId && query.staffId !== 'ALL' && query.staffId !== 'All') {
      where.staffId = query.staffId;
    }

    if (query?.status && query.status !== 'ALL' && query.status !== 'All') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }
    if (query?.leaveType && query.leaveType !== 'ALL' && query.leaveType !== 'All') {
      where.leaveType = { equals: query.leaveType, mode: 'insensitive' };
    }

    return this.prisma.leaveApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  async apply(tenantId: string, dto: any, currentUser?: any) {
    let resolvedStaffId = dto.staffId || dto.staff_id;
    if (!resolvedStaffId && currentUser?.id) {
      const staff = await this.prisma.staffProfile.findFirst({
        where: { tenantId, userId: currentUser.id },
      });
      if (staff) resolvedStaffId = staff.id;
    }

    const leaveType = dto.leaveType || dto.leave_type;
    const startDateStr = dto.startDate || dto.start_date;
    const endDateStr = dto.endDate || dto.end_date;

    if (!resolvedStaffId || !startDateStr || !endDateStr || !leaveType) {
      throw new BadRequestException('Staff ID, start date, end date, and leave type are required.');
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leaveApplication.create({
      data: {
        tenantId,
        staffId: resolvedStaffId,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount: dto.daysCount ? parseInt(dto.daysCount, 10) : days,
        reason: (dto.reason || 'Personal leave').trim(),
        status: dto.status || 'pending',
      },
      include: {
        staff: true,
      },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string, approvedBy?: string, currentUser?: any) {
    const existing = await this.prisma.leaveApplication.findFirst({
      where: { id, tenantId },
      include: {
        staff: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Leave application #${id} not found.`);
    }

    return this.prisma.leaveApplication.update({
      where: { id },
      data: {
        status: status.toLowerCase(),
        approvedBy: approvedBy || (currentUser?.name || 'Campus Administrator'),
      },
      include: {
        staff: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.leaveApplication.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Leave application #${id} not found.`);
    }

    return this.prisma.leaveApplication.delete({
      where: { id },
    });
  }

  private async seedInitialLeaves(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    let staff = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    if (staff.length === 0) return;

    const s1 = staff[0];
    const s2 = staff[1] || staff[0];
    const s3 = staff[2] || staff[0];
    const s4 = staff[3] || staff[0];

    const today = new Date();
    const d1Start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    const d1End = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4);

    const d2Start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);
    const d2End = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8);

    const d3Start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
    const d3End = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);

    const d4Start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const d4End = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4);

    await this.prisma.leaveApplication.createMany({
      data: [
        {
          tenantId,
          staffId: s1.id,
          leaveType: 'Casual Leave (CL)',
          startDate: d1Start,
          endDate: d1End,
          daysCount: 3,
          reason: 'Annual medical health checkup and personal appointment',
          status: 'pending',
        },
        {
          tenantId,
          staffId: s2.id,
          leaveType: 'On Duty (OD)',
          startDate: d2Start,
          endDate: d2End,
          daysCount: 3,
          reason: 'Invited Keynote Speaker at IEEE International Neural Systems Conference',
          status: 'approved',
          approvedBy: 'Director & Principal',
        },
        {
          tenantId,
          staffId: s3.id,
          leaveType: 'Casual Leave (CL)',
          startDate: d3Start,
          endDate: d3End,
          daysCount: 2,
          reason: 'Family event and personal travel',
          status: 'pending',
        },
        {
          tenantId,
          staffId: s4.id,
          leaveType: 'Earned Leave (EL)',
          startDate: d4Start,
          endDate: d4End,
          daysCount: 2,
          reason: 'Personal leave during mid-term exam cycle',
          status: 'rejected',
          approvedBy: 'Dean Academics',
        },
      ],
    });
  }
}
