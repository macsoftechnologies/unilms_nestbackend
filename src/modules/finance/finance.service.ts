import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- FEE STRUCTURES ---
  async findFeeStructures(tenantId: string) {
    return this.prisma.feeStructure.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { id: true, name: true, code: true, durationYears: true } },
        heads: true,
      },
    });
  }

  async createFeeStructure(tenantId: string, dto: {
    programId: string;
    name: string;
    academicYear: string;
    totalAmount: number;
    heads?: Array<{ name: string; amount: number }>;
  }) {
    if (!dto.programId || !dto.name || !dto.academicYear || !dto.totalAmount) {
      throw new BadRequestException('Program, structure name, academic year, and total amount are required.');
    }

    return this.prisma.feeStructure.create({
      data: {
        tenantId,
        programId: dto.programId,
        name: dto.name,
        academicYear: dto.academicYear,
        totalAmount: Number(dto.totalAmount),
        heads: dto.heads && Array.isArray(dto.heads)
          ? {
              create: dto.heads.map((h) => ({
                tenantId,
                name: h.name,
                amount: Number(h.amount),
              })),
            }
          : undefined,
      },
      include: { heads: true, program: true },
    });
  }

  async updateFeeStructure(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.feeStructure.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Fee structure not found.');

    if (dto.heads && Array.isArray(dto.heads)) {
      await this.prisma.feeHead.deleteMany({ where: { structureId: id } });
      await this.prisma.feeHead.createMany({
        data: dto.heads.map((h: any) => ({
          tenantId,
          structureId: id,
          name: h.name,
          amount: Number(h.amount),
        })),
      });
    }

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        name: dto.name || existing.name,
        academicYear: dto.academicYear || existing.academicYear,
        totalAmount: dto.totalAmount ? Number(dto.totalAmount) : existing.totalAmount,
        status: dto.status || existing.status,
      },
      include: { heads: true, program: true },
    });
  }

  async deleteFeeStructure(tenantId: string, id: string) {
    const existing = await this.prisma.feeStructure.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Fee structure not found.');

    await this.prisma.feeStructure.delete({ where: { id } });
    return { success: true, message: `Fee structure "${existing.name}" deleted.` };
  }

  // --- FEE TYPES CATALOG ---
  async findFeeTypes(tenantId: string) {
    let types = await this.prisma.feeType.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (types.length === 0) {
      const defaults = [
        { name: 'Tuition Fee', code: '1001-TUITION', applicableTo: 'All Students', glHead: '1001-TUITION-ACC', description: 'Core semester academic instructional and teaching fee.' },
        { name: 'Lab & Practical Fee', code: '1002-LAB', applicableTo: 'Engineering Students', glHead: '1002-LAB-ACC', description: 'Laboratory computing clusters, chemicals, and workshop maintenance.' },
        { name: 'Examination Fee', code: '1003-EXAM', applicableTo: 'All Exam Enrolled', glHead: '1003-EXAM-ACC', description: 'End semester answer booklets, evaluation, and question bank moderation.' },
        { name: 'Library & Digital Resources', code: '1004-LIB', applicableTo: 'All Students', glHead: '1004-LIB-ACC', description: 'IEEE, Springer subscriptions, physical library access, and repository.' },
        { name: 'Hostel & Mess Fee', code: '1005-HOSTEL', applicableTo: 'Hostellers', glHead: '1005-HOSTEL-ACC', description: 'On-campus boarding, electricity, security, and meal services.' },
        { name: 'Campus Amenities & Sports', code: '1006-SPORTS', applicableTo: 'All Students', glHead: '1006-SPORTS-ACC', description: 'Gymnasium, sports arena, medical infirmary, and wellness center.' },
      ];

      await this.prisma.feeType.createMany({
        data: defaults.map((d) => ({ ...d, tenantId })),
      });

      types = await this.prisma.feeType.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return types;
  }

  async createFeeType(tenantId: string, dto: any) {
    if (!dto.name) throw new BadRequestException('Fee type name is required.');

    return this.prisma.feeType.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code || dto.gl_head || `FEE-${Date.now().toString().slice(-4)}`,
        description: dto.description || null,
        applicableTo: dto.applicableTo || dto.applicable_to || 'All Students',
        glHead: dto.glHead || dto.gl_head || null,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async updateFeeType(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.feeType.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Fee type not found.');

    return this.prisma.feeType.update({
      where: { id },
      data: {
        name: dto.name || existing.name,
        code: dto.code || existing.code,
        description: dto.description !== undefined ? dto.description : existing.description,
        applicableTo: dto.applicableTo || dto.applicable_to || existing.applicableTo,
        glHead: dto.glHead || dto.gl_head || existing.glHead,
        status: dto.status || existing.status,
      },
    });
  }

  async deleteFeeType(tenantId: string, id: string) {
    const existing = await this.prisma.feeType.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Fee type not found.');

    await this.prisma.feeType.delete({ where: { id } });
    return { success: true, message: `Fee type "${existing.name}" deleted.` };
  }

  // --- STUDENT INVOICING & DUES ---
  async findInvoices(tenantId: string, query?: { studentId?: string; status?: string; search?: string }) {
    const where: any = { tenantId };
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.status && query.status.toLowerCase() !== 'all') {
      where.status = query.status.toUpperCase();
    }

    if (query?.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { student: { rollNumber: { contains: query.search, mode: 'insensitive' } } },
        { student: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.studentInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
            user: { select: { name: true, email: true } },
            program: { select: { id: true, name: true, code: true } },
            cohort: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createInvoice(tenantId: string, dto: {
    studentId: string;
    totalAmount: number;
    dueDate: string;
    invoiceNumber?: string;
    title?: string;
    academicYear?: string;
    semester?: string;
  }) {
    if (!dto.studentId || !dto.totalAmount || !dto.dueDate) {
      throw new BadRequestException('Student, total amount, and due date are required.');
    }

    const invNum = dto.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const total = Number(dto.totalAmount);

    return this.prisma.studentInvoice.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        invoiceNumber: invNum,
        title: dto.title || 'Term Tuition & Academic Dues',
        academicYear: dto.academicYear || '2026-2027',
        semester: dto.semester || 'Semester 1',
        totalAmount: total,
        paidAmount: 0,
        balanceAmount: total,
        dueDate: new Date(dto.dueDate),
        status: 'PENDING',
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: true,
            cohort: true,
            section: true,
          },
        },
      },
    });
  }

  async createBulkInvoices(tenantId: string, dto: {
    cohortId?: string;
    sectionId?: string;
    programId?: string;
    totalAmount: number;
    dueDate: string;
    title?: string;
    academicYear?: string;
    semester?: string;
  }) {
    if (!dto.totalAmount || !dto.dueDate) {
      throw new BadRequestException('Total amount and due date are required.');
    }

    const studentWhere: any = {
      tenantId,
      status: { in: ['active', 'ACTIVE', 'Active'] },
    };
    if (dto.sectionId) {
      studentWhere.sectionId = dto.sectionId;
    } else if (dto.cohortId) {
      studentWhere.cohortId = dto.cohortId;
    } else if (dto.programId) {
      studentWhere.OR = [
        { programId: dto.programId },
        { cohort: { programId: dto.programId } },
      ];
    }

    const students = await this.prisma.studentProfile.findMany({
      where: studentWhere,
    });

    if (students.length === 0) {
      return { count: 0, message: 'No enrolled students found matching target filter.' };
    }

    const created = [];
    for (const student of students) {
      const invNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const inv = await this.prisma.studentInvoice.create({
        data: {
          tenantId,
          studentId: student.id,
          invoiceNumber: invNum,
          title: dto.title || 'Term Tuition & Academic Package',
          academicYear: dto.academicYear || '2026-2027',
          semester: dto.semester || 'Semester 1',
          totalAmount: Number(dto.totalAmount),
          paidAmount: 0,
          balanceAmount: Number(dto.totalAmount),
          dueDate: new Date(dto.dueDate),
          status: 'PENDING',
        },
      });
      created.push(inv);
    }

    return { count: created.length, message: `Successfully issued ${created.length} invoices.` };
  }

  // --- RECORD PAYMENT & INSTANT RECEIPT ---
  async recordPayment(tenantId: string, dto: {
    invoiceId: string;
    amountPaid?: number;
    amount?: number;
    paymentMode?: string;
    transactionRef?: string;
    referenceNo?: string;
  }) {
    const rawAmount = dto.amountPaid !== undefined ? dto.amountPaid : dto.amount;
    if (!dto.invoiceId || !rawAmount) {
      throw new BadRequestException('Invoice ID and amount paid are required.');
    }

    const invoice = await this.prisma.studentInvoice.findFirst({
      where: { tenantId, id: dto.invoiceId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: true,
            cohort: true,
            section: true,
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Student invoice not found.');

    const amount = Number(rawAmount);
    const newPaid = Number(invoice.paidAmount) + amount;
    const newBalance = Math.max(0, Number(invoice.totalAmount) - newPaid);
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    const rcptNum = `RCP-FEE-2026-${Date.now().toString().slice(-5)}`;
    const txRef = dto.transactionRef || dto.referenceNo || `UPI-${Date.now()}`;
    const pMode = dto.paymentMode || 'UPI';

    const [payment] = await this.prisma.$transaction([
      this.prisma.feePayment.create({
        data: {
          tenantId,
          invoiceId: dto.invoiceId,
          receiptNumber: rcptNum,
          amountPaid: amount,
          paymentMode: pMode,
          transactionRef: txRef,
        },
      }),
      this.prisma.studentInvoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      }),
      this.prisma.daybookEntry.create({
        data: {
          tenantId,
          entryType: 'INCOME',
          category: 'Student Tuition & Fee Collection',
          amount,
          paymentMode: pMode,
          description: `Fee Receipt ${rcptNum} for ${invoice.student?.user?.name || 'Student'} (Inv: ${invoice.invoiceNumber})`,
        },
      }),
    ]);

    return {
      ...payment,
      studentName: invoice.student?.user?.name || `${invoice.student?.firstName} ${invoice.student?.lastName || ''}`.trim(),
      rollNumber: invoice.student?.rollNumber,
      programName: invoice.student?.program?.name,
      invoiceNumber: invoice.invoiceNumber,
      balanceRemaining: newBalance,
      invoiceStatus: newStatus,
    };
  }

  async getPaymentReceipt(tenantId: string, receiptIdOrPaymentId: string, currentUser?: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receiptIdOrPaymentId);
    const where: any = { tenantId };
    if (isUuid) {
      where.OR = [
        { id: receiptIdOrPaymentId },
        { receiptNumber: receiptIdOrPaymentId },
      ];
    } else {
      where.receiptNumber = receiptIdOrPaymentId;
    }

    const payment = await this.prisma.feePayment.findFirst({
      where,
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: true,
                program: true,
                cohort: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Receipt not found.');

    if (currentUser) {
      const role = (currentUser.role || '').toUpperCase().replace(/-/g, '_');
      if (role === 'STUDENT') {
        const studentId = currentUser.studentId || currentUser.id;
        if (!studentId || payment.invoice.studentId !== studentId) {
          throw new ForbiddenException('IDOR violation: access denied. Students may only view their own payment receipts.');
        }
      } else if (role === 'PARENT') {
        const isLinked = await this.prisma.parentProfile.findFirst({
          where: {
            tenantId,
            studentId: payment.invoice.studentId,
            OR: [
              { email: currentUser.email },
              { id: currentUser.id },
              { userId: currentUser.id },
            ],
          },
        });
        if (!isLinked) {
          throw new ForbiddenException('IDOR violation: access denied. This receipt belongs to another student.');
        }
      }
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    return {
      receipt_no: payment.receiptNumber,
      date: payment.paidAt.toLocaleDateString('en-GB'),
      student_name: payment.invoice.student?.user?.name || `${payment.invoice.student?.firstName} ${payment.invoice.student?.lastName || ''}`.trim(),
      roll_number: payment.invoice.student?.rollNumber || '—',
      program_name: payment.invoice.student?.program?.name || 'Degree Program',
      semester: payment.invoice.semester || 'Semester 1',
      mode: payment.paymentMode,
      bank_ref: payment.transactionRef || 'N/A',
      amount: Number(payment.amountPaid),
      invoice_number: payment.invoice.invoiceNumber,
      remarks: `Term Fee Clearance & Academic Invoicing`,
      college_name: tenant?.name || 'UniLMS University Campus',
      address: 'University Knowledge Park, Academic Block A',
    };
  }

  // --- DAYBOOK JOURNAL ---
  async findDaybook(tenantId: string, date?: string) {
    const where: any = { tenantId };
    if (date) {
      where.date = new Date(date);
    }

    const entries = await this.prisma.daybookEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const totalIncome = entries
      .filter((e) => e.entryType === 'INCOME')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpense = entries
      .filter((e) => e.entryType === 'EXPENSE')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      date: date || new Date().toISOString().split('T')[0],
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      entries,
    };
  }

  async createDaybookEntry(tenantId: string, dto: {
    entryType: string;
    category: string;
    amount: number;
    paymentMode?: string;
    description?: string;
    date?: string;
  }) {
    if (!dto.entryType || !dto.category || !dto.amount) {
      throw new BadRequestException('Entry type, category, and amount are required.');
    }

    return this.prisma.daybookEntry.create({
      data: {
        tenantId,
        entryType: dto.entryType.toUpperCase(),
        category: dto.category,
        amount: Number(dto.amount),
        paymentMode: dto.paymentMode || 'CASH',
        description: dto.description || null,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }
}
