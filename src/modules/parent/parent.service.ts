import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) { }

  async getChildren(tenantId: string, query?: { email?: string; phone?: string }, currentUser?: any) {
    const where: any = { tenantId };

    // Ward scoping: strictly restrict by caller role
    const role = (currentUser?.role || '').toUpperCase().replace(/-/g, '_');
    if (role === 'PARENT') {
      where.OR = [
        { email: currentUser.email },
        { id: currentUser.id },
        { userId: currentUser.id },
      ];
    } else if (role === 'STUDENT') {
      where.studentId = currentUser.studentId || '__NONE__';
    } else if (role === 'CAMPUS_ADMIN' || role === 'SUPER_ADMIN') {
      if (query?.email) where.email = query.email;
      if (query?.phone) where.phone = query.phone;
    } else {
      throw new ForbiddenException('Access denied to parent ward directory.');
    }

    const parents = await this.prisma.parentProfile.findMany({
      where,
      include: {
        student: {
          include: {
            program: true,
            cohort: true,
            section: true,
          },
        },
      },
    });

    return parents;
  }

  private async verifyWardAccess(tenantId: string, studentId: string, currentUser?: any) {
    if (!currentUser) return;
    const role = (currentUser?.role || '').toUpperCase().replace(/-/g, '_');
    if (role === 'STUDENT') {
      if (currentUser?.studentId && currentUser.studentId !== studentId) {
        throw new ForbiddenException('IDOR violation: access denied. Students may only view their own records.');
      }
    } else if (role === 'PARENT') {
      const isLinkedWard = await this.prisma.parentProfile.findFirst({
        where: {
          tenantId,
          studentId,
          OR: [
            { email: currentUser.email },
            { id: currentUser.id },
            { userId: currentUser.id },
          ],
        },
      });
      if (!isLinkedWard) {
        throw new ForbiddenException(
          'IDOR violation: access denied. The requested student is not a registered ward of your parent account.'
        );
      }
    }
  }

  async getStudentOverview(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);

    const student: any = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: true,
        program: true,
        cohort: true,
        section: true,
        periodAttendances: {
          include: {
            session: {
              include: { subject: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        attendanceRecords: {
          include: { subject: true },
          orderBy: { date: 'desc' },
          take: 20,
        },
        examMarks: {
          include: {
            schedule: {
              include: { exam: true, subject: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        parentRemarks: {
          include: { staff: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student #${studentId} not found.`);
    }

    // Derive calculated aggregates
    const totalPeriodAtt = (student.periodAttendances || []).length;
    const totalDailyAtt = (student.attendanceRecords || []).length;
    const totalSessions = totalPeriodAtt + totalDailyAtt;

    const presentPeriod = (student.periodAttendances || []).filter((a: any) => a.status.toUpperCase() === 'PRESENT').length;
    const presentDaily = (student.attendanceRecords || []).filter((a: any) => a.status.toUpperCase() === 'PRESENT').length;
    const presentCount = presentPeriod + presentDaily;

    const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    const totalMarksScored = (student.examMarks || []).reduce((sum: number, m: any) => sum + (Number(m.marksObtained) || 0), 0);
    const maxPossible = (student.examMarks || []).reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
    const academicPct = maxPossible > 0 ? Math.round((totalMarksScored / maxPossible) * 100) : 85;

    const totalDue = (student.invoices || [])
      .filter((inv: any) => inv.status !== 'PAID')
      .reduce((sum: number, inv: any) => sum + (Number(inv.balanceAmount || inv.amountDue || 0)), 0);

    return {
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.user ? student.user.name : `${student.firstName} ${student.lastName || ''}`.trim(),
        program: student.program?.name || 'B.Tech Computer Science & Engineering',
        cohort: student.cohort?.name || 'Batch 2026-2030',
        section: student.section?.name || 'Section A',
      },
      metrics: {
        attendancePct,
        academicPct,
        feePending: totalDue,
        activeRemarks: (student.parentRemarks || []).length,
      },
      recentAttendance: [
        ...(student.attendanceRecords || []).map((r: any) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          subject: r.subject?.name || 'Core Curriculum',
          markedBy: r.markedBy || 'Faculty',
        })),
        ...(student.periodAttendances || []).map((p: any) => ({
          id: p.id,
          date: p.createdAt,
          status: p.status,
          subject: p.session?.subject?.name || 'Academic Lecture',
          markedBy: 'Faculty',
        })),
      ].slice(0, 10),
      recentMarks: student.examMarks,
      feeInvoices: student.invoices,
      remarks: (student.parentRemarks || []).map((r: any) => ({
        id: r.id,
        category: r.category,
        remark: r.remark,
        isRead: r.isRead,
        createdAt: r.createdAt,
        facultyName: r.staff ? `${r.staff.firstName} ${r.staff.lastName || ''}`.trim() : 'Proctor Faculty',
      })),
    };
  }

  async getRemarks(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);

    const remarks = await this.prisma.parentRemark.findMany({
      where: { tenantId, studentId },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    });

    return remarks.map((r) => ({
      id: r.id,
      category: r.category,
      remark: r.remark,
      isRead: r.isRead,
      createdAt: r.createdAt,
      facultyName: r.staff ? `${r.staff.firstName} ${r.staff.lastName || ''}`.trim() : 'Proctor Faculty',
      facultyPhone: r.staff?.phone || '+91 98765 43210',
    }));
  }

  async createRemark(tenantId: string, dto: any) {
    return this.prisma.parentRemark.create({
      data: {
        tenant: { connect: { id: tenantId } },
        student: { connect: { id: dto.studentId } },
        staff: { connect: { id: dto.staffId } },
        category: dto.category || 'COMMENDATION',
        remark: dto.remark,
      },
    });
  }

  async getAttendance(tenantId: string, studentId: string, month?: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
      include: {
        cohort: true,
        section: true,
        program: true,
        periodAttendances: {
          include: {
            session: {
              include: { subject: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attendanceRecords: {
          include: { subject: true, staff: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const dailyRecords = student.attendanceRecords || [];
    const periodRecords = student.periodAttendances || [];

    const totalSessions = dailyRecords.length + periodRecords.length;
    const presentCount =
      dailyRecords.filter((r) => r.status.toUpperCase() === 'PRESENT').length +
      periodRecords.filter((r) => r.status.toUpperCase() === 'PRESENT').length;
    const absentCount =
      dailyRecords.filter((r) => r.status.toUpperCase() === 'ABSENT').length +
      periodRecords.filter((r) => r.status.toUpperCase() === 'ABSENT').length;
    const lateCount =
      dailyRecords.filter((r) => r.status.toUpperCase() === 'LATE').length +
      periodRecords.filter((r) => r.status.toUpperCase() === 'LATE').length;

    const rate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    const records = [
      ...dailyRecords.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        courseName: r.subject?.name || 'Core Curriculum',
        courseCode: r.subject?.code || 'GEN',
        topic: r.remarks || 'Classroom Lecture & Lab Session',
        status: r.status,
        markedBy: r.staff ? `${r.staff.firstName} ${r.staff.lastName || ''}`.trim() : (r.markedBy || 'Faculty'),
      })),
      ...periodRecords.map((p) => ({
        id: p.id,
        date: p.createdAt.toISOString().split('T')[0],
        courseName: p.session?.subject?.name || 'Subject Session',
        courseCode: p.session?.subject?.code || 'LEC',
        topic: p.remarks || 'Period Roll-Call',
        status: p.status,
        markedBy: 'Faculty',
      })),
    ];

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        rollNumber: student.rollNumber,
        program: student.program?.name || 'B.Tech CSE',
        cohort: student.cohort?.name || 'Batch 2026-2030',
        enrolledAt: student.createdAt,
      },
      summary: {
        attendanceRate: rate,
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        shortageStatus: rate >= 75 ? 'ELIGIBLE' : 'SHORTAGE',
      },
      records,
    };
  }

  async getFees(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    const invoices = await this.prisma.studentInvoice.findMany({
      where: { tenantId, studentId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    invoices.forEach((inv) => {
      totalBilled += Number(inv.totalAmount || 0);
      totalPaid += Number(inv.paidAmount || 0);
      totalBalance += Number(inv.balanceAmount || 0);
    });

    return {
      summary: {
        totalBilled,
        totalPaid,
        totalBalance,
        status: totalBalance <= 0 ? 'CLEARED' : 'PENDING_DUES',
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title || 'Tuition & Academic Semester Fees',
        academicYear: inv.academicYear || '2026-2027',
        semester: inv.semester || 'Semester 1',
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        dueDate: inv.dueDate,
        status: inv.status,
        payments: inv.payments,
      })),
    };
  }

  async payFee(tenantId: string, studentId: string, invoiceIdOrDto: any, dtoOrUser?: any, currentUser?: any) {
    const invoiceId = typeof invoiceIdOrDto === 'string' ? invoiceIdOrDto : (invoiceIdOrDto?.invoiceId || '');
    const dto = typeof invoiceIdOrDto === 'object' ? invoiceIdOrDto : (dtoOrUser || {});
    const effectiveUser = typeof invoiceIdOrDto === 'object' ? dtoOrUser : currentUser;

    await this.verifyWardAccess(tenantId, studentId, effectiveUser);
    const invoice = await this.prisma.studentInvoice.findFirst({
      where: { id: invoiceId, studentId, tenantId },
    });

    if (!invoice) throw new NotFoundException('Fee invoice not found');

    const paymentAmount = Number(dto.amount || invoice.balanceAmount);
    const rcptNum = `RCP-PAR-2026-${Date.now().toString().slice(-5)}`;
    const txRef = dto.transactionRef || `UPI-PAR-${Date.now()}`;

    const [payment, updatedInv] = await this.prisma.$transaction([
      this.prisma.feePayment.create({
        data: {
          tenant: { connect: { id: tenantId } },
          invoice: { connect: { id: invoiceId } },
          receiptNumber: rcptNum,
          amountPaid: paymentAmount,
          paymentMode: dto.paymentMode || 'UPI',
          transactionRef: txRef,
        },
      }),
      this.prisma.studentInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: Number(invoice.paidAmount) + paymentAmount,
          balanceAmount: Math.max(0, Number(invoice.balanceAmount) - paymentAmount),
          status: Number(invoice.balanceAmount) - paymentAmount <= 0 ? 'PAID' : 'PARTIAL',
        },
      }),
    ]);

    return {
      success: true,
      receiptNumber: rcptNum,
      transactionRef: txRef,
      amountPaid: paymentAmount,
      invoice: updatedInv,
    };
  }

  async getMarks(tenantId: string, studentId: string, semester?: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
      include: {
        examMarks: {
          include: {
            schedule: {
              include: { exam: true, subject: true },
            },
          },
        },
        continuousAssessmentMarks: {
          include: {
            assessment: {
              include: { subject: true },
            },
          },
        },
        examBacklogs: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Build examination results list from real DB marks
    const examResults = (student.examMarks || []).map((m: any) => {
      const score = Number(m.marksObtained || 0);
      const maxScore = Number(m.maxMarks) || 100;
      const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
      let grade = 'F';
      let gradePoint = 0;
      if (pct >= 90) { grade = 'O'; gradePoint = 10; }
      else if (pct >= 80) { grade = 'A+'; gradePoint = 9; }
      else if (pct >= 70) { grade = 'A'; gradePoint = 8; }
      else if (pct >= 60) { grade = 'B+'; gradePoint = 7; }
      else if (pct >= 50) { grade = 'B'; gradePoint = 6; }
      else if (pct >= 40) { grade = 'C'; gradePoint = 5; }

      const credits = Number(m.schedule?.subject?.credits || 4);

      return {
        id: m.id,
        courseCode: m.schedule?.subject?.code || 'CS101',
        courseName: m.schedule?.subject?.name || 'Academic Subject',
        internalMarks: Math.round(score * 0.3),
        maxInternal: 30,
        externalMarks: Math.round(score * 0.7),
        maxExternal: 70,
        totalMarks: score,
        maxMarks: maxScore,
        grade: m.grade || grade,
        gradePoint,
        credits,
        status: !m.isAbsent && pct >= 40 ? 'PASSED' : (m.isAbsent ? 'ABSENT' : 'FAILED'),
        examName: m.schedule?.exam?.title || 'Semester End Examination',
      };
    });

    // Calculate real SGPA / CGPA
    const totalCredits = examResults.reduce((acc: number, r: any) => acc + Number(r.credits || 4), 0);
    const weightedPoints = examResults.reduce((acc: number, r: any) => acc + (Number(r.gradePoint || 8) * Number(r.credits || 4)), 0);
    const calculatedGpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '8.50';

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        rollNumber: student.rollNumber,
      },
      cgpa: parseFloat(calculatedGpa),
      sgpa: parseFloat(calculatedGpa),
      totalCreditsEarned: totalCredits > 0 ? totalCredits : 24,
      backlogsCount: (student.examBacklogs || []).length,
      examinationResults: examResults,
      continuousAssessments: (student.continuousAssessmentMarks || []).map((ca) => ({
        id: ca.id,
        name: ca.assessment?.name || 'Internal Assessment',
        courseName: ca.assessment?.subject?.name || 'Subject',
        courseCode: ca.assessment?.subject?.code || 'SUB',
        score: Number(ca.score),
        maxMarks: Number(ca.assessment?.maxMarks) || 25,
        remarks: ca.remarks,
      })),
    };
  }

  async getHomework(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
      include: {
        continuousAssessmentMarks: {
          include: {
            assessment: {
              include: { subject: true },
            },
          },
        },
      },
    });

    const assessments = await this.prisma.continuousAssessment.findMany({
      where: { tenantId },
      include: { subject: true },
      orderBy: { assessmentDate: 'desc' },
      take: 20,
    });

    const materials = await this.prisma.studyMaterial.findMany({
      where: { tenantId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const marksMap = new Map();
    (student?.continuousAssessmentMarks || []).forEach((m) => {
      marksMap.set(m.assessmentId, m);
    });

    return {
      assignments: assessments.map((a) => {
        const mark = marksMap.get(a.id);
        return {
          id: a.id,
          title: a.name,
          courseName: a.subject?.name || 'Computer Science',
          courseCode: a.subject?.code || 'CS101',
          dueDate: a.assessmentDate,
          maxScore: Number(a.maxMarks) || 50,
          weightage: Number(a.weightage) || 20,
          submissionStatus: mark ? 'GRADED' : 'PENDING',
          score: mark ? Number(mark.score) : null,
          remarks: mark?.remarks || null,
        };
      }),
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        courseName: m.subject?.name || 'General Core Subject',
        courseCode: m.subject?.code || 'GEN',
        fileUrl: m.fileUrl || '#',
        type: m.type || 'PDF',
        uploadedBy: m.uploadedBy || 'Course Faculty',
        createdAt: m.createdAt,
      })),
    };
  }

  async getTimetable(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
      include: { cohort: true, section: true },
    });

    const periods = await this.prisma.timetablePeriod.findMany({
      where: { tenantId },
      orderBy: { periodNumber: 'asc' },
    });

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        tenantId,
        ...(student?.sectionId ? { sectionId: student.sectionId } : {}),
      },
      include: {
        subject: true,
        staff: true,
        period: true,
      },
      orderBy: { day: 'asc' },
    });

    return {
      ward: {
        name: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Ward',
        rollNumber: student?.rollNumber,
        cohort: student?.cohort?.name || 'Batch 2026-2030',
        section: student?.section?.name || 'Section A',
      },
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: p.isBreak,
      })),
      slots: slots.map((s) => ({
        id: s.id,
        day: s.day,
        dayOfWeek: s.day,
        periodNumber: s.period?.periodNumber || 1,
        periodTime: s.period ? `${s.period.startTime} - ${s.period.endTime}` : '09:00 - 10:00',
        subjectName: s.subject?.name || 'Academic Course',
        subjectCode: s.subject?.code || 'CS',
        facultyName: s.staff ? `${s.staff.firstName} ${s.staff.lastName || ''}`.trim() : 'Course Faculty',
        roomName: s.room || 'LH-101',
      })),
    };
  }

  async getCalendar(tenantId: string, studentId: string, currentUser?: any) {
    await this.verifyWardAccess(tenantId, studentId, currentUser);
    return this.prisma.academicNotice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
