import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD TELEMETRY
  // ==========================================
  async getStats(tenantId: string) {
    const [totalBooks, totalCategories, activeIssues, overdueIssues] = await Promise.all([
      this.prisma.libraryBook.count({ where: { tenantId } }),
      this.prisma.libraryCategory.count({ where: { tenantId } }),
      this.prisma.libraryIssue.count({ where: { tenantId, status: 'ISSUED' } }),
      this.prisma.libraryIssue.count({
        where: {
          tenantId,
          status: 'ISSUED',
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalBooks,
      totalCategories,
      activeIssues,
      overdueIssues,
    };
  }

  // ==========================================
  // 1. BOOK CATEGORIES / SECTIONS
  // ==========================================
  async findCategories(tenantId: string) {
    return this.prisma.libraryCategory.findMany({
      where: { tenantId },
      include: {
        _count: { select: { books: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, dto: any) {
    return this.prisma.libraryCategory.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
      },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.libraryCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Category not found in this institution');

    return this.prisma.libraryCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await this.prisma.libraryCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Category not found in this institution');
    return this.prisma.libraryCategory.delete({ where: { id } });
  }

  // ==========================================
  // 2. BOOKS / OPAC CRUD
  // ==========================================
  async findBooks(tenantId: string, query?: any) {
    const { search, categoryId } = query || {};
    return this.prisma.libraryBook.findMany({
      where: {
        tenantId,
        ...(categoryId && categoryId !== 'All' ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { accessionNo: { contains: search, mode: 'insensitive' } },
                { isbn: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        _count: { select: { issues: true } },
      },
      orderBy: { accessionNo: 'asc' },
    });
  }

  async createBook(tenantId: string, dto: any) {
    const total = Number(dto.totalCopies || dto.total_copies || 1);
    return this.prisma.libraryBook.create({
      data: {
        tenantId,
        categoryId: dto.categoryId || dto.category_id || null,
        accessionNo: dto.accessionNo || dto.accession_no,
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn || null,
        rackNo: dto.rackNo || dto.rack_no || null,
        totalCopies: total,
        availableCopies: total,
        publisher: dto.publisher || null,
        edition: dto.edition || null,
      },
      include: { category: true },
    });
  }

  async updateBook(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.libraryBook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Book not found in this institution');

    const total = dto.totalCopies !== undefined ? Number(dto.totalCopies) : (dto.total_copies !== undefined ? Number(dto.total_copies) : undefined);
    const avail = dto.availableCopies !== undefined ? Number(dto.availableCopies) : (dto.available_copies !== undefined ? Number(dto.available_copies) : undefined);

    return this.prisma.libraryBook.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.author ? { author: dto.author } : {}),
        ...(dto.accessionNo || dto.accession_no ? { accessionNo: dto.accessionNo || dto.accession_no } : {}),
        ...(dto.isbn !== undefined ? { isbn: dto.isbn } : {}),
        ...(dto.rackNo || dto.rack_no ? { rackNo: dto.rackNo || dto.rack_no } : {}),
        ...(dto.categoryId || dto.category_id ? { categoryId: dto.categoryId || dto.category_id } : {}),
        ...(dto.publisher !== undefined ? { publisher: dto.publisher } : {}),
        ...(dto.edition !== undefined ? { edition: dto.edition } : {}),
        ...(total !== undefined ? { totalCopies: total } : {}),
        ...(avail !== undefined ? { availableCopies: avail } : {}),
      },
      include: { category: true },
    });
  }

  async deleteBook(tenantId: string, id: string) {
    const existing = await this.prisma.libraryBook.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Book not found in this institution');
    return this.prisma.libraryBook.delete({ where: { id } });
  }

  // ==========================================
  // 3. CIRCULATION DESK (ISSUES & RETURNS)
  // ==========================================
  async findIssues(tenantId: string, query?: any) {
    const { status, studentId, search } = query || {};
    return this.prisma.libraryIssue.findMany({
      where: {
        tenantId,
        ...(status && status !== 'All' ? { status } : {}),
        ...(studentId ? { studentId } : {}),
        ...(search
          ? {
              OR: [
                { book: { title: { contains: search, mode: 'insensitive' } } },
                { book: { accessionNo: { contains: search, mode: 'insensitive' } } },
                { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
                { student: { firstName: { contains: search, mode: 'insensitive' } } },
                { student: { lastName: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        book: { include: { category: true } },
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, email: true } },
        staff: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async issueBook(tenantId: string, dto: any) {
    const book = await this.prisma.libraryBook.findFirst({
      where: { id: dto.bookId || dto.book_id, tenantId },
    });

    if (!book || book.availableCopies <= 0) {
      throw new BadRequestException('Selected book is out of stock / unavailable for circulation.');
    }

    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);

    const issue = await this.prisma.libraryIssue.create({
      data: {
        tenantId,
        bookId: book.id,
        studentId: dto.studentId || dto.student_id || null,
        staffId: dto.staffId || dto.staff_id || null,
        issueDate: dto.issueDate || dto.issue_date ? new Date(dto.issueDate || dto.issue_date) : new Date(),
        dueDate: dto.dueDate || dto.due_date ? new Date(dto.dueDate || dto.due_date) : defaultDue,
        status: 'ISSUED',
        remarks: dto.remarks || null,
      },
      include: {
        book: true,
        student: true,
        staff: true,
      },
    });

    await this.prisma.libraryBook.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });

    return issue;
  }

  async returnBook(tenantId: string, issueId: string, fineAmount?: number) {
    const issue = await this.prisma.libraryIssue.findFirst({
      where: { id: issueId, tenantId },
    });

    if (!issue) {
      throw new NotFoundException('Library issue record not found in this institution');
    }

    const updated = await this.prisma.libraryIssue.update({
      where: { id: issueId },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
        fineAmount: Number(fineAmount || 0),
      },
      include: {
        book: true,
        student: true,
        staff: true,
      },
    });

    await this.prisma.libraryBook.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return updated;
  }

  async renewBook(tenantId: string, id: string, extensionDays = 14) {
    const issue = await this.prisma.libraryIssue.findFirst({ where: { id, tenantId } });
    if (!issue) throw new NotFoundException('Issue record not found in this institution');

    const newDueDate = new Date(issue.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    return this.prisma.libraryIssue.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        status: 'ISSUED',
        remarks: (issue.remarks ? issue.remarks + ' | ' : '') + `Renewed for +${extensionDays} days on ${new Date().toLocaleDateString()}`,
      },
      include: {
        book: true,
        student: true,
        staff: true,
      },
    });
  }

  async deleteIssue(tenantId: string, id: string) {
    const issue = await this.prisma.libraryIssue.findFirst({ where: { id, tenantId } });
    if (!issue) throw new NotFoundException('Issue record not found in this institution');

    if (issue.status !== 'RETURNED') {
      await this.prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });
    }
    return this.prisma.libraryIssue.delete({ where: { id } });
  }

  // ==========================================
  // 4. MEMBERS MANAGEMENT
  // ==========================================
  async findMembers(tenantId: string, query?: any) {
    const { type, search } = query || {};
    return this.prisma.libraryMember.findMany({
      where: {
        tenantId,
        ...(type && type !== 'All' ? { memberType: type.toLowerCase() } : {}),
        ...(search
          ? {
              OR: [
                { cardNo: { contains: search, mode: 'insensitive' } },
                { student: { firstName: { contains: search, mode: 'insensitive' } } },
                { student: { lastName: { contains: search, mode: 'insensitive' } } },
                { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
                { staff: { firstName: { contains: search, mode: 'insensitive' } } },
                { staff: { lastName: { contains: search, mode: 'insensitive' } } },
                { staff: { employeeCode: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, email: true, phone: true } },
        staff: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMember(tenantId: string, dto: any) {
    const memberType = (dto.memberType || dto.member_type || 'student').toLowerCase();
    const cardNo = dto.cardNo || dto.card_no || `LIB-CARD-${Date.now().toString().slice(-6)}`;

    return this.prisma.libraryMember.create({
      data: {
        tenantId,
        memberType,
        cardNo,
        studentId: memberType === 'student' ? (dto.studentId || dto.student_id) : null,
        staffId: memberType === 'staff' ? (dto.staffId || dto.staff_id) : null,
        maxBooksAllowed: Number(dto.maxBooksAllowed || dto.max_books_allowed || 3),
        validTill: dto.validTill || dto.valid_till ? new Date(dto.validTill || dto.valid_till) : new Date('2027-06-30'),
        status: dto.status || 'active',
      },
      include: { student: true, staff: true },
    });
  }

  async updateMember(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.libraryMember.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Member record not found in this institution');

    return this.prisma.libraryMember.update({
      where: { id },
      data: {
        ...(dto.maxBooksAllowed || dto.max_books_allowed ? { maxBooksAllowed: Number(dto.maxBooksAllowed || dto.max_books_allowed) } : {}),
        ...(dto.validTill || dto.valid_till ? { validTill: new Date(dto.validTill || dto.valid_till) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: { student: true, staff: true },
    });
  }

  async deleteMember(tenantId: string, id: string) {
    const existing = await this.prisma.libraryMember.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Member record not found in this institution');
    return this.prisma.libraryMember.delete({ where: { id } });
  }

  // ==========================================
  // 5. PERIODICALS & JOURNALS
  // ==========================================
  async findPeriodicals(tenantId: string) {
    return this.prisma.libraryPeriodical.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPeriodical(tenantId: string, dto: any) {
    return this.prisma.libraryPeriodical.create({
      data: {
        tenantId,
        title: dto.title,
        type: dto.type || 'Journal',
        issn: dto.issn || null,
        frequency: dto.frequency || 'Monthly',
        publisher: dto.publisher || null,
        subscriptionStart: dto.subscriptionStart || dto.subscription_start ? new Date(dto.subscriptionStart || dto.subscription_start) : null,
        subscriptionEnd: dto.subscriptionEnd || dto.subscription_end ? new Date(dto.subscriptionEnd || dto.subscription_end) : null,
        annualCost: Number(dto.annualCost || dto.annual_cost || 0),
        status: dto.status || 'Active',
      },
    });
  }

  async updatePeriodical(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.libraryPeriodical.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Periodical not found in this institution');

    return this.prisma.libraryPeriodical.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.issn !== undefined ? { issn: dto.issn } : {}),
        ...(dto.frequency ? { frequency: dto.frequency } : {}),
        ...(dto.publisher !== undefined ? { publisher: dto.publisher } : {}),
        ...(dto.annualCost !== undefined || dto.annual_cost !== undefined ? { annualCost: Number(dto.annualCost ?? dto.annual_cost) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deletePeriodical(tenantId: string, id: string) {
    const existing = await this.prisma.libraryPeriodical.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Periodical not found in this institution');
    return this.prisma.libraryPeriodical.delete({ where: { id } });
  }

  // ==========================================
  // 6. SUPPLIERS & VENDORS
  // ==========================================
  async findSuppliers(tenantId: string) {
    return this.prisma.librarySupplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, dto: any) {
    return this.prisma.librarySupplier.create({
      data: {
        tenantId,
        name: dto.name,
        contactPerson: dto.contactPerson || dto.contact_person || null,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        gstin: dto.gstin || null,
        status: dto.status || 'Active',
      },
    });
  }

  async updateSupplier(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.librarySupplier.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Supplier not found in this institution');

    return this.prisma.librarySupplier.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.contactPerson || dto.contact_person !== undefined ? { contactPerson: dto.contactPerson || dto.contact_person } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.gstin !== undefined ? { gstin: dto.gstin } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deleteSupplier(tenantId: string, id: string) {
    const existing = await this.prisma.librarySupplier.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Supplier not found in this institution');
    return this.prisma.librarySupplier.delete({ where: { id } });
  }

  // ==========================================
  // 7. STOCK AUDITS & PHYSICAL INVENTORY
  // ==========================================
  async findStockAudits(tenantId: string) {
    return this.prisma.libraryStockAudit.findMany({
      where: { tenantId },
      orderBy: { auditDate: 'desc' },
    });
  }

  async createStockAudit(tenantId: string, dto: any) {
    return this.prisma.libraryStockAudit.create({
      data: {
        tenantId,
        auditDate: dto.auditDate || dto.audit_date ? new Date(dto.auditDate || dto.audit_date) : new Date(),
        auditorName: dto.auditorName || dto.auditor_name || 'Chief Librarian',
        totalPhysical: Number(dto.totalPhysical || dto.total_physical || 0),
        verifiedCount: Number(dto.verifiedCount || dto.verified_count || 0),
        missingCount: Number(dto.missingCount || dto.missing_count || 0),
        damagedCount: Number(dto.damagedCount || dto.damaged_count || 0),
        status: dto.status || 'Completed',
        remarks: dto.remarks || null,
      },
    });
  }

  async updateStockAudit(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.libraryStockAudit.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Stock audit not found in this institution');

    return this.prisma.libraryStockAudit.update({
      where: { id },
      data: {
        ...(dto.auditorName || dto.auditor_name ? { auditorName: dto.auditorName || dto.auditor_name } : {}),
        ...(dto.totalPhysical !== undefined || dto.total_physical !== undefined ? { totalPhysical: Number(dto.totalPhysical ?? dto.total_physical) } : {}),
        ...(dto.verifiedCount !== undefined || dto.verified_count !== undefined ? { verifiedCount: Number(dto.verifiedCount ?? dto.verified_count) } : {}),
        ...(dto.missingCount !== undefined || dto.missing_count !== undefined ? { missingCount: Number(dto.missingCount ?? dto.missing_count) } : {}),
        ...(dto.damagedCount !== undefined || dto.damaged_count !== undefined ? { damagedCount: Number(dto.damagedCount ?? dto.damaged_count) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks } : {}),
      },
    });
  }

  async deleteStockAudit(tenantId: string, id: string) {
    const existing = await this.prisma.libraryStockAudit.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Stock audit not found in this institution');
    return this.prisma.libraryStockAudit.delete({ where: { id } });
  }
}
