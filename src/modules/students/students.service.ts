import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { search?: string; programId?: string; cohortId?: string; sectionId?: string; status?: string }) {
    const where: any = { tenantId };

    if (query?.programId && query.programId !== 'ALL') {
      where.programId = query.programId;
    }
    if (query?.cohortId && query.cohortId !== 'ALL') {
      where.cohortId = query.cohortId;
    }
    if (query?.sectionId && query.sectionId !== 'ALL') {
      where.sectionId = query.sectionId;
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.search) {
      where.OR = [
        { rollNumber: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.studentProfile.findMany({
      where,
      orderBy: { rollNumber: 'asc' },
      include: {
        program: { select: { id: true, name: true, code: true } },
        cohort: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId },
      include: {
        program: true,
        cohort: true,
        section: true,
        user: { select: { id: true, email: true, status: true, createdAt: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student #${id} not found.`);
    }

    return student;
  }

  async create(tenantId: string, dto: any) {
    const rollNumber = dto.rollNumber || dto.roll_number;
    const firstName = dto.firstName || dto.first_name;
    const lastName = dto.lastName || dto.last_name || null;
    const email = dto.email || null;
    const phone = dto.phone || null;

    if (!rollNumber || !firstName) {
      throw new BadRequestException('Roll Number and First Name are required.');
    }

    // Check roll number uniqueness within this tenant
    const existing = await this.prisma.studentProfile.findUnique({
      where: {
        tenantId_rollNumber: {
          tenantId,
          rollNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Student with Roll Number '${rollNumber}' already exists in this institution.`);
    }

    // Optionally create User auth account for LMS student portal access
    let userId: string | null = null;
    if (dto.createAuthAccount !== false) {
      try {
        const passwordHash = await bcrypt.hash(dto.password || 'Password@123', 10);
        const user = await this.prisma.user.create({
          data: {
            tenantId,
            role: Role.STUDENT,
            name: `${firstName} ${lastName || ''}`.trim(),
            email: email || `${rollNumber.toLowerCase()}@campus.edu`,
            passwordHash,
            phone,
            rollNumber,
            program: dto.programName || dto.program_name || null,
            semester: dto.currentSemester ? String(dto.currentSemester) : '1',
          },
        });
        userId = user.id;
      } catch (err) {
        // If user already exists or fails, proceed with profile creation
      }
    }

    return this.prisma.studentProfile.create({
      data: {
        tenantId,
        userId,
        rollNumber,
        firstName,
        lastName,
        email,
        phone,
        programId: dto.programId || dto.program_id || null,
        cohortId: dto.cohortId || dto.cohort_id || null,
        sectionId: dto.sectionId || dto.section_id || null,
        currentSemester: dto.currentSemester || dto.current_semester ? parseInt(dto.currentSemester || dto.current_semester, 10) : 1,
        parentName: dto.parentName || dto.parent_name || null,
        parentPhone: dto.parentPhone || dto.parent_phone || null,
        parentEmail: dto.parentEmail || dto.parent_email || null,
        gender: dto.gender || null,
        dob: dto.dob ? new Date(dto.dob) : null,
        bloodGroup: dto.bloodGroup || dto.blood_group || null,
        address: dto.address || null,
        status: dto.status || 'Active',
      },
      include: {
        program: true,
        cohort: true,
        section: true,
      },
    });
  }

  async bulkImport(tenantId: string, students: any[]) {
    const results = [];
    for (const s of students) {
      try {
        const rollNumber = s.rollNumber || s.roll_number;
        const firstName = s.firstName || s.first_name;
        if (!rollNumber || !firstName) continue;

        const existing = await this.prisma.studentProfile.findUnique({
          where: {
            tenantId_rollNumber: { tenantId, rollNumber }
          }
        });
        if (existing) {
          results.push({ rollNumber, success: true, id: existing.id, status: 'existing' });
          continue;
        }

        const created = await this.create(tenantId, s);
        results.push({ rollNumber, success: true, id: created.id, status: 'created' });
      } catch (err: any) {
        results.push({ rollNumber: s.rollNumber || s.roll_number, success: false, error: err.message });
      }
    }
    return {
      total: students.length,
      imported: results.filter(r => r.success && r.status === 'created').length,
      existing: results.filter(r => r.success && r.status === 'existing').length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }

  async update(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Student #${id} not found.`);
    }

    return this.prisma.studentProfile.update({
      where: { id },
      data: {
        firstName: dto.firstName ?? dto.first_name ?? existing.firstName,
        lastName: dto.lastName ?? dto.last_name ?? existing.lastName,
        email: dto.email !== undefined ? dto.email : existing.email,
        phone: dto.phone !== undefined ? dto.phone : existing.phone,
        programId: dto.programId !== undefined ? dto.programId : existing.programId,
        cohortId: dto.cohortId !== undefined ? dto.cohortId : existing.cohortId,
        sectionId: dto.sectionId !== undefined ? dto.sectionId : existing.sectionId,
        currentSemester: dto.currentSemester !== undefined ? parseInt(dto.currentSemester, 10) : existing.currentSemester,
        parentName: dto.parentName ?? dto.parent_name ?? existing.parentName,
        parentPhone: dto.parentPhone ?? dto.parent_phone ?? existing.parentPhone,
        parentEmail: dto.parentEmail ?? dto.parent_email ?? existing.parentEmail,
        gender: dto.gender ?? existing.gender,
        dob: dto.dob !== undefined ? (dto.dob ? new Date(dto.dob) : null) : existing.dob,
        bloodGroup: dto.bloodGroup ?? dto.blood_group ?? existing.bloodGroup,
        address: dto.address !== undefined ? dto.address : existing.address,
        status: dto.status ?? existing.status,
      },
      include: {
        program: true,
        cohort: true,
        section: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Student #${id} not found.`);
    }

    return this.prisma.studentProfile.delete({
      where: { id },
    });
  }

  async bulkPromote(tenantId: string, dto: { studentIds: string[]; targetCohortId?: string; targetSemester?: number }) {
    if (!dto.studentIds || !Array.isArray(dto.studentIds) || dto.studentIds.length === 0) {
      throw new BadRequestException('studentIds array is required and must not be empty.');
    }

    const updateData: any = {};
    if (dto.targetCohortId) {
      updateData.cohortId = dto.targetCohortId;
    }
    if (dto.targetSemester) {
      updateData.currentSemester = parseInt(String(dto.targetSemester), 10);
    }

    const result = await this.prisma.studentProfile.updateMany({
      where: {
        tenantId,
        id: { in: dto.studentIds },
      },
      data: updateData,
    });

    return {
      promotedCount: result.count,
      targetSemester: dto.targetSemester,
      targetCohortId: dto.targetCohortId,
    };
  }

  // --- PHASE 13: STUDENT SELF-SERVICE PORTAL & DIGITAL ID ---

  async findStudentOrNull(tenantId: string, studentId?: string) {
    if (studentId) {
      return this.prisma.studentProfile.findFirst({
        where: { id: studentId, tenantId },
        include: { user: true, program: true, cohort: true, section: true },
      });
    }
    return this.prisma.studentProfile.findFirst({
      where: { tenantId },
      include: { user: true, program: true, cohort: true, section: true },
      orderBy: { rollNumber: 'asc' },
    });
  }

  async getCertificateRequests(tenantId: string, studentId?: string) {
    return this.prisma.studentCertificateRequest.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCertificateRequest(tenantId: string, dto: any) {
    const student = await this.findStudentOrNull(tenantId, dto.studentId);
    if (!student) {
      throw new NotFoundException('Student profile not found within your institution.');
    }

    if (!dto.certificateType && !dto.certificate_type) {
      throw new BadRequestException('Certificate type is required.');
    }

    return this.prisma.studentCertificateRequest.create({
      data: {
        tenantId,
        studentId: student.id,
        certificateType: dto.certificateType || dto.certificate_type,
        reason: dto.reason || 'Official institutional verification',
        paymentStatus: dto.paymentStatus || dto.payment_status || 'Free',
        status: 'Under Review',
        downloadUrl: null,
      },
    });
  }

  async getComplaints(tenantId: string, studentId?: string) {
    return this.prisma.studentComplaint.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComplaint(tenantId: string, dto: any) {
    const student = await this.findStudentOrNull(tenantId, dto.studentId);
    if (!student) {
      throw new NotFoundException('Student profile not found within your institution.');
    }

    if (!dto.subject || !dto.description) {
      throw new BadRequestException('Subject and Description are required.');
    }

    return this.prisma.studentComplaint.create({
      data: {
        tenantId,
        studentId: student.id,
        category: dto.category || 'Academic',
        subject: dto.subject,
        description: dto.description,
        status: 'In Progress',
        resolutionRemarks: null,
      },
    });
  }

  async updateComplaint(tenantId: string, id: string, dto: any) {
    const complaint = await this.prisma.studentComplaint.findFirst({ where: { id, tenantId } });
    if (!complaint) throw new NotFoundException('Complaint not found.');
    return this.prisma.studentComplaint.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.resolutionRemarks !== undefined && { resolutionRemarks: dto.resolutionRemarks }),
      },
    });
  }

  async getFeedbacks(tenantId: string, studentId?: string) {
    return this.prisma.studentFeedback.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFeedback(tenantId: string, dto: any) {
    const targetStudentId = dto.studentId;
    if (!targetStudentId) {
      throw new BadRequestException('Student ID is required to submit feedback.');
    }

    return this.prisma.studentFeedback.create({
      data: {
        tenantId,
        studentId: targetStudentId,
        subjectId: dto.subjectId || null,
        subjectName: dto.subjectName || dto.subject || 'Subject Feedback',
        facultyName: dto.facultyName || dto.faculty || 'Faculty Member',
        rating: parseInt(String(dto.rating || 5), 10),
        comments: dto.comments || '',
        isAnonymous: dto.isAnonymous !== undefined ? Boolean(dto.isAnonymous) : true,
      },
    });
  }

  async getAcademicNotices(tenantId: string) {
    return this.prisma.academicNotice.findMany({
      where: { tenantId },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async createAcademicNotice(tenantId: string, dto: any) {
    return this.prisma.academicNotice.create({
      data: {
        tenantId,
        title: dto.title,
        category: dto.category || 'All Students',
        tag: dto.tag || 'Official',
        tagColor: dto.tagColor || 'var(--primary)',
        description: dto.description || '',
      },
    });
  }

  async getExamRegistrations(tenantId: string, studentId?: string) {
    return this.prisma.studentExamRegistration.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExamRegistration(tenantId: string, dto: any) {
    const targetStudentId = dto.studentId;
    if (!targetStudentId) {
      throw new BadRequestException('Student ID is required to register for an exam.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const hallTicketNumber = dto.hallTicketNumber || `HT-2026-REG-${randomSuffix}`;

    return this.prisma.studentExamRegistration.create({
      data: {
        tenantId,
        studentId: targetStudentId,
        examId: dto.examId || null,
        examName: dto.examName || dto.exam_name || 'Semester Regular/Backlog Examination',
        examType: dto.examType || dto.type || 'Regular Theory & Practical',
        hallTicketNumber,
        feeStatus: dto.feeStatus || dto.fee_status || 'Paid',
        status: 'Approved',
      },
    });
  }

  async getSelfServiceSummary(tenantId: string, studentId?: string) {
    const student = await this.findStudentOrNull(tenantId, studentId);
    if (!student) {
      return {
        availableServices: 6,
        processedRequests: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        activeExamsCount: 0,
        studentProfile: null,
      };
    }

    const certRequests = await this.getCertificateRequests(tenantId, student.id);
    const complaints = await this.getComplaints(tenantId, student.id);
    const examRegistrations = await this.getExamRegistrations(tenantId, student.id);

    const processedCerts = certRequests.filter(c => c.status === 'Issued' || c.status === 'Approved').length;
    const pendingTickets = complaints.filter(c => c.status === 'In Progress' || c.status === 'Pending').length;
    const resolvedTickets = complaints.filter(c => c.status === 'Resolved').length;

    const studentName = (student as any).user?.name 
      || `${(student as any).firstName || ''} ${(student as any).lastName || ''}`.trim() 
      || student.rollNumber;

    return {
      availableServices: 6,
      processedRequests: processedCerts,
      pendingTickets,
      resolvedTickets,
      activeExamsCount: examRegistrations.length,
      studentProfile: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: studentName,
        program: student.program ? student.program.name : 'N/A',
        cohort: student.cohort ? student.cohort.name : 'N/A',
        section: student.section ? student.section.name : 'N/A',
        currentSemester: student.currentSemester || 1,
      },
    };
  }

  async getDigitalId(tenantId: string, studentId?: string) {
    const targetStudent = await this.findStudentOrNull(tenantId, studentId);
    if (!targetStudent) {
      throw new NotFoundException('Student profile not found.');
    }

    const studentName = (targetStudent as any).user?.name 
      || `${(targetStudent as any).firstName || ''} ${(targetStudent as any).lastName || ''}`.trim() 
      || targetStudent.rollNumber;

    return {
      id: targetStudent.id,
      cardId: `ID-${targetStudent.rollNumber}`,
      rollNumber: targetStudent.rollNumber,
      name: studentName,
      email: targetStudent.email || `${targetStudent.rollNumber.toLowerCase()}@campus.edu`,
      phone: targetStudent.phone || 'N/A',
      bloodGroup: (targetStudent as any).bloodGroup || 'N/A',
      dob: (targetStudent as any).dob || 'N/A',
      academicYear: '2026 - 2027',
      program: targetStudent.program ? targetStudent.program.name : 'Academic Program',
      cohort: targetStudent.cohort ? targetStudent.cohort.name : 'Current Cohort',
      section: targetStudent.section ? targetStudent.section.name : 'Section',
      currentSemester: targetStudent.currentSemester || 1,
      validFrom: '2026-08-01',
      validUntil: '2030-07-31',
      libraryMemberId: `LIB-${targetStudent.rollNumber}`,
      busPassId: `PASS-${targetStudent.rollNumber}`,
      hostelRoom: (targetStudent as any).hostelRoom || 'Day Scholar',
      barcode: `*UNILMS-STD-${targetStudent.rollNumber}*`,
      qrVerificationUrl: `/credentials/student/${targetStudent.id}`,
      emergencyContact: 'Campus Health & Security Desk',
      registrarSignature: 'Academic Registrar',
      status: 'VERIFIED & ACTIVE',
    };
  }
}
