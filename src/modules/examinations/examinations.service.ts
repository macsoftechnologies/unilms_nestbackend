import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- EXAM CYCLES ---
  async findAllExams(tenantId: string) {
    return this.prisma.exam.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { schedules: true } },
      },
    });
  }

  async createExam(tenantId: string, dto: {
    title?: string;
    name?: string;
    examType?: string;
    type?: string;
    academicYear?: string;
    semester?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) {
    const title = dto.title || dto.name;
    const academicYear = dto.academicYear || '2026-2027';
    if (!title) {
      throw new BadRequestException('Exam title is required.');
    }

    return this.prisma.exam.create({
      data: {
        tenantId,
        title,
        examType: dto.examType || dto.type || 'REGULAR',
        academicYear,
        semester: dto.semester ? parseInt(String(dto.semester), 10) : 1,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'PUBLISHED',
      },
      include: {
        _count: { select: { schedules: true } },
      },
    });
  }

  async updateExam(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.exam.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Exam cycle not found.');

    return this.prisma.exam.update({
      where: { id },
      data: {
        title: dto.title || dto.name || existing.title,
        examType: dto.examType || dto.type || existing.examType,
        academicYear: dto.academicYear || existing.academicYear,
        semester: dto.semester ? parseInt(String(dto.semester), 10) : existing.semester,
        startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
        status: dto.status || existing.status,
      },
    });
  }

  async deleteExam(tenantId: string, id: string) {
    const existing = await this.prisma.exam.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Exam cycle not found.');

    await this.prisma.exam.delete({ where: { id } });
    return { success: true, message: `Exam cycle "${existing.title}" deleted.` };
  }

  // --- EXAM SCHEDULES & TIMETABLE ---
  async findSchedules(tenantId: string, examId?: string) {
    const where: any = { tenantId };
    if (examId && examId !== 'undefined' && examId !== 'null' && examId !== 'ALL') where.examId = examId;

    const schedules = await this.prisma.examSchedule.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        exam: { select: { id: true, title: true, examType: true, academicYear: true } },
        subject: { select: { id: true, name: true, code: true, credits: true, departmentId: true } },
        _count: { select: { marks: true } },
      },
    });

    return schedules.map(s => ({
      ...s,
      hallRoomNo: s.venue,
      passingMarks: s.passMarks,
      subject_name: s.subject ? `${s.subject.name} (${s.subject.code})` : 'Subject',
      exam_name: s.exam?.title || 'Exam',
    }));
  }

  async createSchedule(tenantId: string, dto: {
    examId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    venue?: string;
    hallRoomNo?: string;
    maxMarks?: number;
    passMarks?: number;
    passingMarks?: number;
  }) {
    if (!dto.examId || !dto.subjectId || !dto.date || !dto.startTime || !dto.endTime) {
      throw new BadRequestException('Exam, subject, date, startTime, and endTime are required.');
    }

    const created = await this.prisma.examSchedule.create({
      data: {
        tenantId,
        examId: dto.examId,
        subjectId: dto.subjectId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue || dto.hallRoomNo || 'Main Examination Hall A-101',
        maxMarks: dto.maxMarks ? parseInt(String(dto.maxMarks), 10) : 100,
        passMarks: dto.passMarks || dto.passingMarks ? parseInt(String(dto.passMarks || dto.passingMarks), 10) : 40,
      },
      include: {
        exam: true,
        subject: true,
      },
    });

    return {
      ...created,
      hallRoomNo: created.venue,
      passingMarks: created.passMarks,
    };
  }

  async updateSchedule(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.examSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Exam schedule slot not found.');

    const updated = await this.prisma.examSchedule.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : existing.date,
        startTime: dto.startTime || existing.startTime,
        endTime: dto.endTime || existing.endTime,
        venue: dto.venue || dto.hallRoomNo || existing.venue,
        maxMarks: dto.maxMarks ? parseInt(String(dto.maxMarks), 10) : existing.maxMarks,
        passMarks: dto.passMarks || dto.passingMarks ? parseInt(String(dto.passMarks || dto.passingMarks), 10) : existing.passMarks,
      },
      include: { exam: true, subject: true },
    });

    return {
      ...updated,
      hallRoomNo: updated.venue,
      passingMarks: updated.passMarks,
    };
  }

  async deleteSchedule(tenantId: string, id: string) {
    const existing = await this.prisma.examSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Exam schedule slot not found.');

    await this.prisma.examSchedule.delete({ where: { id } });
    return { success: true, message: 'Exam schedule slot deleted.' };
  }

  // --- MARKS ENTRY (CIE / SEE) ---
  async findMarks(tenantId: string, scheduleId: string) {
    return this.prisma.examMark.findMany({
      where: { tenantId, scheduleId },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
            program: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });
  }

  async recordMarksBatch(tenantId: string, scheduleId: string, marks: Array<{
    studentId: string;
    marksObtained: number;
    maxMarks?: number;
    isAbsent?: boolean;
    grade?: string;
    remarks?: string;
  }>) {
    if (!Array.isArray(marks)) {
      throw new BadRequestException('Marks array is required.');
    }

    const operations = marks.map((m) => {
      const marksVal = Number(m.marksObtained) || 0;
      const maxVal = Number(m.maxMarks) || 100;
      let grade = m.grade;
      if (!grade && !m.isAbsent) {
        const pct = (marksVal / maxVal) * 100;
        if (pct >= 90) grade = 'O';
        else if (pct >= 80) grade = 'A+';
        else if (pct >= 70) grade = 'A';
        else if (pct >= 60) grade = 'B+';
        else if (pct >= 50) grade = 'B';
        else if (pct >= 40) grade = 'C';
        else grade = 'F';
      }

      return this.prisma.examMark.upsert({
        where: {
          scheduleId_studentId: { scheduleId, studentId: m.studentId },
        },
        update: {
          marksObtained: marksVal,
          maxMarks: maxVal,
          isAbsent: Boolean(m.isAbsent),
          grade: m.isAbsent ? 'AB' : grade,
          remarks: m.remarks || null,
        },
        create: {
          tenantId,
          scheduleId,
          studentId: m.studentId,
          marksObtained: marksVal,
          maxMarks: maxVal,
          isAbsent: Boolean(m.isAbsent),
          grade: m.isAbsent ? 'AB' : grade,
          remarks: m.remarks || null,
        },
      });
    });

    await this.prisma.$transaction(operations);
    return { success: true, count: marks.length };
  }

  // --- HALL TICKET GENERATION WITH MODULE 03 FEE CLEARANCE GATE ---
  async generateHallTicket(tenantId: string, studentId: string, examId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { tenantId, id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        program: true,
        cohort: true,
        section: true,
      },
    });

    if (!student) throw new NotFoundException('Student profile not found.');

    const exam = await this.prisma.exam.findFirst({
      where: { tenantId, id: examId },
    });

    if (!exam) throw new NotFoundException('Exam cycle not found.');

    const schedules = await this.prisma.examSchedule.findMany({
      where: { tenantId, examId },
      include: { subject: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Check Module 03 Fee Clearance Gate
    const invoices = await this.prisma.studentInvoice.findMany({
      where: { tenantId, studentId },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const balanceDue = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);

    const isCleared = balanceDue <= 0;
    const feeStatus = isCleared ? 'CLEARED' : (totalPaid > 0 ? 'PARTIAL' : 'PENDING');
    const studentFullName = student.user?.name || `${student.firstName} ${student.lastName || ''}`.trim();
    const rollNo = student.rollNumber || student.id.slice(0, 8).toUpperCase();

    return {
      ticketNumber: `HT-${exam.academicYear?.slice(0, 4) || '2026'}-${rollNo.replace(/[^a-zA-Z0-9]/g, '')}`,
      qrToken: `QR-AUTH-${exam.id.slice(0, 6)}-${student.id.slice(0, 6)}`.toUpperCase(),
      issuedAt: new Date(),
      status: isCleared ? 'VERIFIED_ELIGIBLE' : 'CONDITIONAL_WITHHELD',
      isEligible: isCleared,
      feeClearance: {
        status: feeStatus,
        isCleared,
        totalBilled,
        totalPaid,
        balanceDue,
        withholdingNotice: !isCleared
          ? `Outstanding Fee Dues: ₹${balanceDue.toLocaleString()}. Please clear dues to release Admit Card.`
          : 'Fee Clearance Verified: Zero Outstanding Dues.',
      },
      student: {
        id: student.id,
        name: studentFullName,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: rollNo,
        programName: student.program?.name || 'Degree Program',
        programCode: student.program?.code || 'DEGREE',
        cohortName: student.cohort?.name || 'Class of 2026',
        sectionName: student.section?.name || 'Section A',
      },
      exam: {
        id: exam.id,
        name: exam.title,
        title: exam.title,
        examType: exam.examType,
        academicYear: exam.academicYear,
        semester: exam.semester,
      },
      schedules: schedules.map((s) => ({
        ...s,
        hallRoomNo: s.venue || 'Exam Hall A-101',
      })),
    };
  }

  // --- EXAMINATION REPORTS & GAZETTE ---
  async getReports(tenantId: string, examId?: string) {
    const where: any = { tenantId };
    if (examId && examId !== 'undefined' && examId !== 'null' && examId !== 'ALL') where.id = examId;

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        schedules: {
          include: {
            subject: true,
            marks: {
              include: { student: { include: { user: true, program: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const defaulterInvoices = await this.prisma.studentInvoice.findMany({
      where: { tenantId, balanceAmount: { gt: 0 } },
      include: {
        student: { include: { user: true, program: true } },
      },
    });

    const defaulters = defaulterInvoices.map((inv) => ({
      id: inv.id,
      exam_name: 'End Semester Terminal Examination 2026',
      first_name: inv.student?.firstName || 'Student',
      last_name: inv.student?.lastName || '',
      roll_number: inv.student?.rollNumber || '—',
      program: inv.student?.program?.name || 'Degree Program',
      due_amount: `₹${Number(inv.balanceAmount).toLocaleString()}`,
    }));

    return {
      exams,
      defaulters,
    };
  }

  // --- ACADEMIC BACKLOGS & ARREARS REMEDIATION ---
  async findAllBacklogs(tenantId: string, studentId?: string) {
    return this.prisma.examBacklog.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: { include: { program: true } },
        subject: true,
        exam: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBacklog(tenantId: string, dto: any) {
    if (!dto.studentId || !dto.subjectId) {
      throw new BadRequestException('Student ID and Subject ID are required');
    }

    return this.prisma.examBacklog.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        examId: dto.examId || null,
        semester: dto.semester ? parseInt(String(dto.semester), 10) : 1,
        attempt: dto.attempt ? parseInt(String(dto.attempt), 10) : 2,
        status: dto.status || 'Pending',
        remarks: dto.remarks || null,
      },
      include: {
        student: { include: { program: true } },
        subject: true,
        exam: true,
      },
    });
  }

  async updateBacklog(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.examBacklog.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Backlog record not found.');

    return this.prisma.examBacklog.update({
      where: { id },
      data: {
        status: dto.status || existing.status,
        attempt: dto.attempt !== undefined ? parseInt(String(dto.attempt), 10) : existing.attempt,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
        examId: dto.examId !== undefined ? dto.examId : existing.examId,
      },
      include: {
        student: { include: { program: true } },
        subject: true,
        exam: true,
      },
    });
  }

  async deleteBacklog(tenantId: string, id: string) {
    const existing = await this.prisma.examBacklog.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Backlog record not found.');

    return this.prisma.examBacklog.delete({ where: { id } });
  }
}
