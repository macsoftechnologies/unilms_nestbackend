import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeedData(tenantId: string) {
    return;
    const recordCount = await this.prisma.attendanceRecord.count({ where: { tenantId } });
    if (recordCount > 0) return;

    // Check student count, seed realistic student roster if needed
    let students = await this.prisma.studentProfile.findMany({ where: { tenantId } });
    const cohort = await this.prisma.cohort.findFirst({ where: { tenantId } });
    const section = await this.prisma.section.findFirst({ where: { tenantId } });
    const subject = await this.prisma.subject.findFirst({ where: { tenantId } });
    const staff = await this.prisma.staffProfile.findFirst({ where: { tenantId } });

    if (students.length < 5) {
      const demoStudents = [
        { rollNumber: '26CSE101', firstName: 'Aditya', lastName: 'Verma', email: 'aditya.verma@campus.edu' },
        { rollNumber: '26CSE102', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@campus.edu' },
        { rollNumber: '26CSE103', firstName: 'Rahul', lastName: 'Deshmukh', email: 'rahul.deshmukh@campus.edu' },
        { rollNumber: '26CSE104', firstName: 'Sneha', lastName: 'Patel', email: 'sneha.patel@campus.edu' },
        { rollNumber: '26CSE105', firstName: 'Rohan', lastName: 'Joshi', email: 'rohan.joshi@campus.edu' },
        { rollNumber: '26CSE106', firstName: 'Kavita', lastName: 'Rao', email: 'kavita.rao@campus.edu' },
      ];

      for (const ds of demoStudents) {
        const existing = await this.prisma.studentProfile.findFirst({
          where: { tenantId, rollNumber: ds.rollNumber },
        });
        if (!existing) {
          // Create or link User
          let user = await this.prisma.user.findFirst({ where: { tenantId, email: ds.email } });
          if (!user) {
            user = await this.prisma.user.create({
              data: {
                tenantId,
                role: 'STUDENT' as any,
                name: `${ds.firstName} ${ds.lastName}`,
                email: ds.email,
                passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
              },
            });
          }
          await this.prisma.studentProfile.create({
            data: {
              tenantId,
              userId: user.id,
              rollNumber: ds.rollNumber,
              firstName: ds.firstName,
              lastName: ds.lastName,
              email: ds.email,
              cohortId: cohort?.id || null,
              sectionId: section?.id || null,
              status: 'Active',
            },
          });
        }
      }

      students = await this.prisma.studentProfile.findMany({ where: { tenantId } });
    }

    // Seed attendance records for today and recent sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];
    const recordsToCreate = [];

    // Today's session records
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      const status = statuses[i % statuses.length];
      recordsToCreate.push({
        tenantId,
        date: today,
        entityType: 'student',
        studentId: stu.id,
        sectionId: section?.id || null,
        subjectId: subject?.id || null,
        periodNumber: 1,
        status,
        remarks: status === 'ABSENT' ? 'Sick leave intimation' : status === 'LATE' ? 'Late arrival 10 min' : 'Present in hall',
        markedBy: staff ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Dr. Vikram Sengupta',
      });
    }

    // Yesterday's session records for historical reports
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      const status = i === 4 ? 'ABSENT' : 'PRESENT';
      recordsToCreate.push({
        tenantId,
        date: yesterday,
        entityType: 'student',
        studentId: stu.id,
        sectionId: section?.id || null,
        subjectId: subject?.id || null,
        periodNumber: 2,
        status,
        remarks: 'Curriculum lecture session',
        markedBy: staff ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Dr. Vikram Sengupta',
      });
    }

    // Staff attendance record
    if (staff) {
      recordsToCreate.push({
        tenantId,
        date: today,
        entityType: 'staff',
        staffId: staff.id,
        periodNumber: 1,
        status: 'PRESENT',
        remarks: 'Biometric verified at 08:52 AM',
        markedBy: 'Biometric Gateway',
      });
    }

    await this.prisma.attendanceRecord.createMany({ data: recordsToCreate });
  }

  async findAll(
    tenantId: string,
    query?: { date?: string; entityType?: string; sectionId?: string; studentId?: string; staffId?: string },
  ) {
    const where: any = { tenantId };

    if (query?.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }
    if (query?.entityType && query.entityType !== 'ALL') {
      where.entityType = { equals: query.entityType, mode: 'insensitive' };
    }
    if (query?.sectionId && query.sectionId !== 'ALL') {
      where.sectionId = query.sectionId;
    }
    if (query?.studentId) {
      where.studentId = query.studentId;
    }
    if (query?.staffId) {
      where.staffId = query.staffId;
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  async markBatch(
    tenantId: string,
    dto: {
      date?: string;
      entityType?: 'student' | 'staff';
      sectionId?: string;
      subjectId?: string;
      periodNumber?: number;
      markedBy?: string;
      records: Array<{
        id?: string;
        studentId?: string;
        staffId?: string;
        status: string;
        remarks?: string;
        date?: string;
        sectionId?: string;
        subjectId?: string;
      }>;
    },
  ) {
    const rawDate = dto.date || dto.records?.[0]?.date || new Date().toISOString().split('T')[0];
    if (!rawDate || !dto.records || !Array.isArray(dto.records)) {
      throw new BadRequestException('Date and records array are required.');
    }

    const date = new Date(rawDate);
    date.setHours(0, 0, 0, 0);
    const entityType = dto.entityType || 'student';

    const operations = dto.records.map((rec) => {
      const entityId = rec.id || rec.studentId || rec.staffId;
      const status = (rec.status || 'PRESENT').toUpperCase();

      const data: any = {
        tenantId,
        date,
        entityType,
        status,
        remarks: rec.remarks || null,
        markedBy: dto.markedBy || 'Teacher / System',
        sectionId: dto.sectionId || rec.sectionId || null,
        subjectId: dto.subjectId || rec.subjectId || null,
        periodNumber: dto.periodNumber || null,
      };

      if (entityType === 'student') {
        data.studentId = entityId;
      } else {
        data.staffId = entityId;
      }

      return this.prisma.attendanceRecord.create({ data });
    });

    await this.prisma.$transaction(operations);

    return {
      success: true,
      markedCount: dto.records.length,
      date: rawDate,
      entityType,
    };
  }

  async getDashboardSummary(tenantId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [totalStudents, totalStaff, todayRecords, allRecords] = await Promise.all([
      this.prisma.studentProfile.count({ where: { tenantId, status: { in: ['Active', 'active'] } } }),
      this.prisma.staffProfile.count({ where: { tenantId, status: { in: ['active', 'Active'] } } }),
      this.prisma.attendanceRecord.findMany({
        where: {
          tenantId,
          date: targetDate,
        },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          tenantId,
        },
      }),
    ]);

    const activeRecords = todayRecords.length > 0 ? todayRecords : allRecords;
    const studentRecords = activeRecords.filter((r) => r.entityType?.toLowerCase() === 'student');
    const studentPresent = studentRecords.filter((r) => r.status?.toUpperCase() === 'PRESENT').length;
    const studentAbsent = studentRecords.filter((r) => r.status?.toUpperCase() === 'ABSENT').length;
    const studentLate = studentRecords.filter((r) => r.status?.toUpperCase() === 'LATE').length;

    const staffRecords = activeRecords.filter((r) => r.entityType?.toLowerCase() === 'staff');
    const staffPresent = staffRecords.filter((r) => r.status?.toUpperCase() === 'PRESENT').length;
    const staffAbsent = staffRecords.filter((r) => r.status?.toUpperCase() === 'ABSENT').length;
    const staffLate = staffRecords.filter((r) => r.status?.toUpperCase() === 'LATE').length;

    const attendanceRate =
      studentRecords.length > 0
        ? Math.round((studentPresent / studentRecords.length) * 100)
        : totalStudents > 0
          ? Math.round((studentPresent / totalStudents) * 100)
          : 0;

    return {
      date: targetDate.toISOString().split('T')[0],
      totalRecords: activeRecords.length,
      presentCount: studentPresent + staffPresent,
      absentCount: studentAbsent + staffAbsent,
      lateCount: studentLate + staffLate,
      attendanceRate,
      students: {
        total: totalStudents,
        marked: studentRecords.length,
        present: studentPresent,
        absent: studentAbsent,
        late: studentLate,
        percentage: attendanceRate,
      },
      staff: {
        total: totalStaff,
        marked: staffRecords.length,
        present: staffPresent,
        absent: staffAbsent,
        late: staffLate,
        percentage: staffRecords.length > 0 ? Math.round((staffPresent / staffRecords.length) * 100) : 0,
      },
    };
  }
}
