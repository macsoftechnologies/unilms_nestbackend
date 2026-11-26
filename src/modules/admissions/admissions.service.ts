import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= LEADS CRM =================
  async findAllLeads(tenantId: string, query?: { search?: string; status?: string }) {
    const where: any = { tenantId };

    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { programName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        program: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async createLead(tenantId: string, dto: any) {
    if (!dto.fullName || !dto.phone) {
      throw new BadRequestException('Full name and phone number are required.');
    }

    return this.prisma.lead.create({
      data: {
        tenantId,
        fullName: dto.fullName || dto.full_name,
        phone: dto.phone,
        email: dto.email || null,
        city: dto.city || null,
        programId: dto.programId || dto.program_id || null,
        programName: dto.programName || dto.program_name || null,
        source: dto.source || 'Website',
        status: dto.status || 'New',
        assignedTo: dto.assignedTo || dto.assigned_name || null,
        followUpDate: dto.followUpDate || dto.follow_up_date ? new Date(dto.followUpDate || dto.follow_up_date) : null,
        notes: dto.notes || null,
      },
    });
  }

  async updateLead(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Lead #${id} not found.`);
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? dto.full_name ?? existing.fullName,
        phone: dto.phone ?? existing.phone,
        email: dto.email !== undefined ? dto.email : existing.email,
        city: dto.city !== undefined ? dto.city : existing.city,
        programId: dto.programId !== undefined ? dto.programId : existing.programId,
        programName: dto.programName !== undefined ? dto.programName : existing.programName,
        source: dto.source ?? existing.source,
        status: dto.status ?? existing.status,
        assignedTo: dto.assignedTo ?? dto.assigned_name ?? existing.assignedTo,
        followUpDate: dto.followUpDate !== undefined 
          ? (dto.followUpDate ? new Date(dto.followUpDate) : null) 
          : (dto.follow_up_date !== undefined ? (dto.follow_up_date ? new Date(dto.follow_up_date) : null) : existing.followUpDate),
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
      },
    });
  }

  async deleteLead(tenantId: string, id: string) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Lead #${id} not found.`);
    }

    return this.prisma.lead.delete({
      where: { id },
    });
  }

  // ================= APPLICATIONS =================
  async findAllApplications(tenantId: string, query?: { search?: string; status?: string; programId?: string }) {
    const where: any = { tenantId };

    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.programId && query.programId !== 'ALL') {
      where.programId = query.programId;
    }

    if (query?.search) {
      where.OR = [
        { applicationNumber: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        program: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async createApplication(tenantId: string, dto: any) {
    if (!dto.fullName || !dto.email || !dto.phone) {
      throw new BadRequestException('Full name, email, and phone number are required.');
    }

    // Generate unique application number if not provided
    const count = await this.prisma.application.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const appNum = dto.applicationNumber || dto.adm_number || `APP-${year}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.application.create({
      data: {
        tenantId,
        applicationNumber: appNum,
        fullName: dto.fullName || dto.full_name,
        email: dto.email,
        phone: dto.phone,
        programId: dto.programId || dto.program_id || null,
        programName: dto.programName || dto.program_name || null,
        admissionCategory: dto.admissionCategory || dto.admission_category || 'General',
        qualification: dto.qualification || null,
        board: dto.board || null,
        passingYear: dto.passingYear || dto.passing_year ? parseInt(dto.passingYear || dto.passing_year, 10) : null,
        marks: dto.marks ? parseFloat(String(dto.marks).replace('%', '')) : null,
        status: dto.status || 'Submitted',
      },
    });
  }

  async updateApplicationStatus(tenantId: string, id: string, status: string) {
    const existing = await this.prisma.application.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Application #${id} not found.`);
    }

    return this.prisma.application.update({
      where: { id },
      data: { status },
    });
  }

  async issueOfferLetter(tenantId: string, id: string, dto?: any) {
    const existing = await this.prisma.application.findFirst({
      where: { id, tenantId },
      include: { tenant: true, program: true },
    });
    if (!existing) {
      throw new NotFoundException(`Application #${id} not found.`);
    }

    const offerUrl = `/api/v1/admissions/offers/${existing.applicationNumber}.pdf`;

    return this.prisma.application.update({
      where: { id },
      data: {
        status: 'Offer Issued',
        offerLetterSent: true,
        offerLetterUrl: offerUrl,
      },
    });
  }

  async deleteApplication(tenantId: string, id: string) {
    const existing = await this.prisma.application.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Application #${id} not found.`);
    }
    return this.prisma.application.delete({
      where: { id },
    });
  }

  async enrollApplication(tenantId: string, id: string, dto?: any) {
    const app = await this.prisma.application.findFirst({
      where: { id, tenantId },
    });
    if (!app) {
      throw new NotFoundException(`Application #${id} not found.`);
    }

    const count = await this.prisma.studentProfile.count({ where: { tenantId } });
    const rollNumber = dto?.rollNumber || `2026-STU-${String(count + 1).padStart(3, '0')}`;

    const parts = (app.fullName || '').trim().split(' ');
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || null;

    // Automatically provision Auth User account for LMS student app & portal access
    let userId: string | null = null;
    try {
      const passwordHash = await bcrypt.hash(dto?.password || 'Password@123', 10);
      const studentEmail = dto?.email || app.email || `${rollNumber.toLowerCase()}@campus.edu`;
      const authUser = await this.prisma.user.create({
        data: {
          tenantId,
          role: Role.STUDENT,
          name: app.fullName || `${firstName} ${lastName || ''}`.trim(),
          email: studentEmail,
          passwordHash,
          phone: app.phone,
          rollNumber,
          program: app.programName || null,
          semester: '1',
        },
      });
      userId = authUser.id;
    } catch (err) {
      const existingUser = await this.prisma.user.findFirst({
        where: { tenantId, OR: [{ rollNumber }, { email: app.email }] },
      });
      if (existingUser) userId = existingUser.id;
    }

    const student = await this.prisma.studentProfile.create({
      data: {
        tenantId,
        userId,
        rollNumber,
        firstName,
        lastName,
        email: app.email,
        phone: app.phone,
        programId: app.programId,
        cohortId: dto?.cohortId || null,
        sectionId: dto?.sectionId || null,
        currentSemester: 1,
        status: 'Active',
      },
      include: {
        program: true,
        cohort: true,
        section: true,
      },
    });

    await this.prisma.application.update({
      where: { id },
      data: { status: 'Enrolled' },
    });

    return {
      success: true,
      student,
      message: `Enrolled ${app.fullName} as Roll No. ${rollNumber}`,
    };
  }

  async getDashboardStats(tenantId: string) {
    const [totalLeads, totalApplications, totalEnrolled, offersIssued, verifiedCount, programs] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId } }),
      this.prisma.studentProfile.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId, offerLetterSent: true } }),
      this.prisma.application.count({ where: { tenantId, status: { in: ['Approved', 'Offer Issued', 'Enrolled'] } } }),
      this.prisma.program.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: {
              studentProfiles: true,
              applications: true,
            },
          },
        },
      }),
    ]);

    const programIntake = programs.map((p) => {
      const intake = 60 * (p.durationYears || 4);
      const applied = p._count.applications;
      const enrolled = p._count.studentProfiles;
      const offered = Math.round(applied * 0.7);
      const fillRate = intake > 0 ? parseFloat(((enrolled / intake) * 100).toFixed(1)) : 0;
      return {
        id: p.id,
        program: p.name,
        code: p.code,
        intake,
        applied,
        enrolled,
        offered,
        fillRate,
        status: fillRate >= 80 ? 'Near Full' : 'Open Round',
      };
    });

    return {
      totalLeads,
      totalApplications,
      totalEnrolled,
      offersIssued,
      verifiedCount,
      tuitionRealized: totalEnrolled * 85000,
      seatOccupancy: totalEnrolled > 0 ? Math.min(100, Math.round((totalEnrolled / (programs.length * 60 || 1)) * 100)) : 0,
      programIntake,
    };
  }

  // ================= DOCUMENT VERIFICATION =================
  async getDocuments(tenantId: string, query?: { search?: string; status?: string }) {
    const apps = await this.prisma.application.findMany({
      where: { tenantId },
      include: {
        program: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const standardDocTypes = [
      '10th Standard Marksheet',
      '12th / Diploma Certificate',
      'Transfer Certificate',
      'Caste / Quota Certificate',
      'Aadhaar / National ID Proof',
    ];

    return apps.map((app) => {
      const allDocs = app.documents || [];
      const verifiedDocs = allDocs.filter((d) => d.status === 'Verified');
      const pendingDocs = standardDocTypes.filter(
        (type) => !allDocs.some((d) => d.documentType === type && d.status === 'Verified'),
      );

      let status = 'Pending Upload';
      if (allDocs.length === 0) {
        status = (app.status === 'Approved' || app.status === 'Enrolled') ? 'Verified' : 'Pending Upload';
      } else if (allDocs.some((d) => d.status === 'Action Required' || d.status === 'Rejected')) {
        status = 'Action Required';
      } else if (verifiedDocs.length >= standardDocTypes.length || app.status === 'Approved' || app.status === 'Enrolled') {
        status = 'Verified';
      } else if (verifiedDocs.length > 0) {
        status = 'Under Review';
      } else {
        status = 'Under Review';
      }

      const verifiedCount = (app.status === 'Enrolled' || app.status === 'Approved')
        ? Math.max(verifiedDocs.length, standardDocTypes.length)
        : verifiedDocs.length;

      return {
        id: app.id,
        applicationId: app.id,
        adm_number: app.applicationNumber,
        full_name: app.fullName,
        email: app.email,
        phone: app.phone,
        program: app.program?.name || app.programName || 'Degree Program',
        category: app.admissionCategory || 'General',
        required_count: standardDocTypes.length,
        uploaded_count: allDocs.length,
        verified_count: verifiedCount,
        pending_docs: (app.status === 'Enrolled' || app.status === 'Approved')
          ? []
          : (allDocs.length === 0 ? ['No documents uploaded yet (All 5 Required)'] : pendingDocs),
        status,
        submitted_date: app.createdAt.toISOString().split('T')[0],
        documents: app.documents,
      };
    });
  }

  async uploadDocument(
    tenantId: string,
    applicationId: string,
    dto: { documentType: string; documentName?: string; remarks?: string; status?: string },
  ) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found.`);
    }

    const existingDoc = await this.prisma.admissionDocument.findFirst({
      where: { tenantId, applicationId, documentType: dto.documentType },
    });

    if (existingDoc) {
      return this.prisma.admissionDocument.update({
        where: { id: existingDoc.id },
        data: {
          documentName: dto.documentName || existingDoc.documentName,
          status: dto.status || 'Under Review',
          remarks: dto.remarks || null,
        },
      });
    }

    return this.prisma.admissionDocument.create({
      data: {
        tenantId,
        applicationId,
        documentType: dto.documentType,
        documentName: dto.documentName || `${dto.documentType.replace(/\s+/g, '_')}.pdf`,
        status: dto.status || 'Under Review',
        remarks: dto.remarks || null,
      },
    });
  }

  async updateDocumentVerification(
    tenantId: string,
    applicationId: string,
    dto: { status: string; documentType?: string; remarks?: string; verifiedBy?: string },
  ) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found.`);
    }

    if (dto.documentType) {
      const existingDoc = await this.prisma.admissionDocument.findFirst({
        where: { tenantId, applicationId, documentType: dto.documentType },
      });
      if (existingDoc) {
        await this.prisma.admissionDocument.update({
          where: { id: existingDoc.id },
          data: {
            status: dto.status,
            remarks: dto.remarks || null,
            verifiedBy: dto.verifiedBy || 'Admissions Officer',
            verifiedAt: new Date(),
          },
        });
      } else {
        await this.prisma.admissionDocument.create({
          data: {
            tenantId,
            applicationId,
            documentType: dto.documentType,
            documentName: `${dto.documentType.replace(/\s+/g, '_')}.pdf`,
            status: dto.status,
            remarks: dto.remarks || null,
            verifiedBy: dto.verifiedBy || 'Admissions Officer',
            verifiedAt: new Date(),
          },
        });
      }
    } else if (dto.status === 'Verified') {
      // Bulk approve all standard documents
      const standardDocTypes = [
        '10th Standard Marksheet',
        '12th / Diploma Certificate',
        'Transfer Certificate',
        'Caste / Quota Certificate',
        'Aadhaar / National ID Proof',
      ];
      for (const docType of standardDocTypes) {
        const existingDoc = await this.prisma.admissionDocument.findFirst({
          where: { tenantId, applicationId, documentType: docType },
        });
        if (existingDoc) {
          await this.prisma.admissionDocument.update({
            where: { id: existingDoc.id },
            data: {
              status: 'Verified',
              verifiedBy: dto.verifiedBy || 'Admissions Officer',
              verifiedAt: new Date(),
            },
          });
        } else {
          await this.prisma.admissionDocument.create({
            data: {
              tenantId,
              applicationId,
              documentType: docType,
              documentName: `${docType.replace(/\s+/g, '_')}_Verified.pdf`,
              status: 'Verified',
              verifiedBy: dto.verifiedBy || 'Admissions Officer',
              verifiedAt: new Date(),
            },
          });
        }
      }
    }

    if (dto.status === 'Verified') {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { status: 'Approved' },
      });
    }

    return { success: true, message: `Document verification updated to ${dto.status}` };
  }

  // ================= ADMISSION QUOTAS & CATEGORIES =================
  async getCategories(tenantId: string) {
    let categories = await this.prisma.admissionCategory.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (categories.length === 0) {
      const defaults = [
        { name: 'General (Open Merit)', code: 'GEN', quotaPercentage: 40.5, description: 'Open merit category with no constitutional reservation requirement.' },
        { name: 'Other Backward Classes (Non-Creamy Layer)', code: 'OBC-NCL', quotaPercentage: 27.0, description: 'Requires central OBC-NCL certificate issued within the active financial year.' },
        { name: 'Scheduled Castes', code: 'SC', quotaPercentage: 15.0, description: 'Constitutional reservation category with tuition fee relaxation entitlement.' },
        { name: 'Economically Weaker Section', code: 'EWS', quotaPercentage: 10.0, description: 'Income and asset certificate verifying family gross income below prescribed threshold.' },
        { name: 'Scheduled Tribes', code: 'ST', quotaPercentage: 7.5, description: 'Scheduled Tribe reservation with specialized scholarship facilitation.' },
        { name: 'Management Quota', code: 'MQ', quotaPercentage: 15.0, description: 'Institutional direct admission discretionary quota governed by state fee committee.' },
        { name: 'Sports & Cultural Excellence', code: 'SPORTS', quotaPercentage: 5.0, description: 'State, National or University level medal winners in AIU accredited games.' },
      ];

      for (const cat of defaults) {
        await this.prisma.admissionCategory.upsert({
          where: { tenantId_code: { tenantId, code: cat.code } },
          create: { tenantId, ...cat },
          update: {},
        });
      }

      categories = await this.prisma.admissionCategory.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
    }

    const apps = await this.prisma.application.findMany({
      where: { tenantId },
      select: { admissionCategory: true },
    });

    const enrolledStudents = await this.prisma.studentProfile.count({ where: { tenantId } });

    return categories.map((cat) => {
      const matchingCount = apps.filter(
        (a) => (a.admissionCategory || '').toLowerCase() === cat.code.toLowerCase() ||
               (a.admissionCategory || '').toLowerCase() === cat.name.toLowerCase()
      ).length;

      return {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        quota_percentage: Number(cat.quotaPercentage),
        enrolled_count: matchingCount || (cat.code === 'GEN' ? enrolledStudents : 0),
        description: cat.description,
        status: cat.status,
      };
    });
  }

  async createCategory(tenantId: string, dto: any) {
    if (!dto.name || !dto.code) {
      throw new BadRequestException('Name and Code are required for category.');
    }
    return this.prisma.admissionCategory.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code.toUpperCase().trim(),
        quotaPercentage: dto.quota_percentage !== undefined ? dto.quota_percentage : (dto.quotaPercentage || 0),
        description: dto.description || null,
        status: dto.status || 'active',
      },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.admissionCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Admission category not found in this institution');
    return this.prisma.admissionCategory.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        quotaPercentage: dto.quota_percentage !== undefined ? dto.quota_percentage : dto.quotaPercentage,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await this.prisma.admissionCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Admission category not found in this institution');
    return this.prisma.admissionCategory.delete({ where: { id } });
  }

  // ================= SCHOLARSHIPS =================
  async getScholarships(tenantId: string, query?: any) {
    const list = await this.prisma.admissionScholarship.findMany({
      where: { tenantId },
      include: {
        studentProfile: {
          select: { rollNumber: true, firstName: true, lastName: true, program: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((s) => ({
      id: s.id,
      student_id: s.studentProfileId,
      student_name: s.studentName,
      roll_number: s.rollNumber || s.studentProfile?.rollNumber || '—',
      scholarship_name: s.scholarshipName,
      donor_name: s.donorName,
      amount: Number(s.amount),
      status: s.status,
      sanction_date: s.sanctionDate ? s.sanctionDate.toISOString().split('T')[0] : s.createdAt.toISOString().split('T')[0],
      remarks: s.remarks,
    }));
  }

  async createScholarship(tenantId: string, dto: any) {
    if (!dto.student_name && !dto.studentName) {
      throw new BadRequestException('Student name is required.');
    }
    return this.prisma.admissionScholarship.create({
      data: {
        tenantId,
        studentProfileId: dto.student_id || dto.studentProfileId || null,
        applicationId: dto.application_id || dto.applicationId || null,
        studentName: dto.student_name || dto.studentName,
        rollNumber: dto.roll_number || dto.rollNumber || null,
        scholarshipName: dto.scholarship_name || dto.scholarshipName || 'Merit Scholarship',
        donorName: dto.donor_name || dto.donorName || 'Institution Trust Fund',
        amount: dto.amount || 50000,
        status: dto.status || 'applied',
        sanctionDate: dto.sanction_date ? new Date(dto.sanction_date) : new Date(),
        remarks: dto.remarks || null,
      },
    });
  }

  async updateScholarship(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.admissionScholarship.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Scholarship not found in this institution');
    return this.prisma.admissionScholarship.update({
      where: { id },
      data: {
        status: dto.status,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        scholarshipName: dto.scholarship_name || dto.scholarshipName,
        donorName: dto.donor_name || dto.donorName,
        remarks: dto.remarks,
      },
    });
  }

  async deleteScholarship(tenantId: string, id: string) {
    const existing = await this.prisma.admissionScholarship.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Scholarship not found in this institution');
    return this.prisma.admissionScholarship.delete({ where: { id } });
  }

  // ================= PAYMENTS =================
  async getPayments(tenantId: string, query?: any) {
    const payments = await this.prisma.admissionPayment.findMany({
      where: { tenantId },
      include: {
        application: {
          select: { applicationNumber: true, programName: true, program: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      receipt_number: p.receiptNumber,
      adm_number: p.application?.applicationNumber || 'APP-2026-DIRECT',
      full_name: p.applicantName,
      program: p.application?.program?.name || p.application?.programName || 'Undergraduate Degree',
      amount: Number(p.amount),
      payment_mode: p.paymentMode,
      gateway_reference: p.gatewayReference || `TXN-${p.id.slice(0, 8)}`,
      payment_status: p.status,
      created_at: p.createdAt.toLocaleString('en-GB'),
      remarks: p.remarks,
    }));
  }

  async createPayment(tenantId: string, dto: any) {
    const count = await this.prisma.admissionPayment.count({ where: { tenantId } });
    const receiptNumber = dto.receipt_number || dto.receiptNumber || `RCP-2026-${String(count + 101).padStart(3, '0')}`;

    return this.prisma.admissionPayment.create({
      data: {
        tenantId,
        applicationId: dto.application_id || dto.applicationId || null,
        receiptNumber,
        applicantName: dto.full_name || dto.applicantName || 'Applicant',
        amount: dto.amount || 85000,
        paymentMode: dto.payment_mode || dto.paymentMode || 'UPI / QR',
        gatewayReference: dto.gateway_reference || dto.reference || `UPI/${Date.now()}`,
        status: dto.payment_status || dto.status || 'Completed',
        remarks: dto.remarks || null,
      },
    });
  }

  // ================= COLLEGE STRENGTH CENSUS =================
  async getCollegeStrength(tenantId: string) {
    const programs: any = await this.prisma.program.findMany({
      where: { tenantId },
      include: {
        department: true,
        studentProfiles: true,
        cohorts: {
          include: {
            sections: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return programs.map((p: any) => {
      const allSections = (p.cohorts || []).flatMap((c: any) => c.sections || []);
      const intake = allSections.length > 0
        ? allSections.reduce((sum: number, s: any) => sum + (s.capacity || 60), 0)
        : 60 * (p.durationYears || 4);

      const enrolled = (p.studentProfiles || []).length;
      const male = (p.studentProfiles || []).filter((s: any) => (s.gender || '').toLowerCase() === 'male').length;
      const female = enrolled - male;

      const y1 = (p.studentProfiles || []).filter((s: any) => s.currentSemester <= 2).length;
      const y2 = (p.studentProfiles || []).filter((s: any) => s.currentSemester >= 3 && s.currentSemester <= 4).length;
      const y3 = (p.studentProfiles || []).filter((s: any) => s.currentSemester >= 5 && s.currentSemester <= 6).length;
      const y4 = (p.studentProfiles || []).filter((s: any) => s.currentSemester >= 7).length;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        department: p.department?.name || 'Academic Department',
        intake,
        enrolled,
        male,
        female,
        year_distribution: {
          y1: y1 || (enrolled > 0 ? enrolled : 0),
          y2,
          y3,
          y4,
        },
      };
    });
  }

  // ================= DETAINED STUDENTS =================
  async getDetainedStudents(tenantId: string) {
    const detained = await this.prisma.studentProfile.findMany({
      where: {
        tenantId,
        status: { in: ['Detained', 'detained', 'Suspended', 'suspended'] },
      },
      include: {
        program: true,
        cohort: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return detained.map((s) => ({
      id: s.id,
      student_id: s.id,
      student_name: `${s.firstName} ${s.lastName || ''}`.trim(),
      roll_number: s.rollNumber,
      program: `${s.program?.name || 'Degree'} (${s.currentSemester}th Sem)`,
      date_detained: s.updatedAt.toISOString().split('T')[0],
      category: 'Attendance Shortfall',
      reason: s.address || 'Attendance fell below institutional minimum 75% threshold.',
      status: 'active',
    }));
  }

  async readmitStudent(tenantId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException(`Student #${studentId} not found.`);
    }

    return this.prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        status: 'Active',
      },
    });
  }

  // ================= ADMISSION CONVERSION FUNNEL =================
  async getFunnel(tenantId: string) {
    const [leadsCount, appsCount, offersCount, enrolledCount, paymentsCount] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId, offerLetterSent: true } }),
      this.prisma.studentProfile.count({ where: { tenantId } }),
      this.prisma.admissionPayment.count({ where: { tenantId } }),
    ]);

    const verifiedCount = Math.round(appsCount * 0.85);

    const stages = [
      {
        stage: 1,
        id: 'leads',
        code: 'STG-01',
        name: 'Inbound Leads & Enquiries',
        count: leadsCount,
        pctOfTotal: 100,
        dropCount: 0,
        dropPct: 0,
        velocity: '1.2 Days',
        accentColor: '#6366F1',
        gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
        description: 'Inquiries captured via campus walk-ins, digital campaigns, portals & school seminars',
      },
      {
        stage: 2,
        id: 'applications',
        code: 'STG-02',
        name: 'Applications Submitted',
        count: appsCount,
        pctOfTotal: leadsCount > 0 ? parseFloat(((appsCount / leadsCount) * 100).toFixed(1)) : 100,
        dropCount: Math.max(0, leadsCount - appsCount),
        dropPct: leadsCount > 0 ? parseFloat((((leadsCount - appsCount) / leadsCount) * 100).toFixed(1)) : 0,
        velocity: '4.8 Days',
        accentColor: '#3B82F6',
        gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        description: 'Fully completed online application dossiers submitted with 10+2 / diploma scorecards',
      },
      {
        stage: 3,
        id: 'verified',
        code: 'STG-03',
        name: 'Documents Verified & Eligible',
        count: verifiedCount,
        pctOfTotal: appsCount > 0 ? parseFloat(((verifiedCount / appsCount) * 100).toFixed(1)) : 0,
        dropCount: Math.max(0, appsCount - verifiedCount),
        dropPct: 15.0,
        velocity: '2.1 Days',
        accentColor: '#0EA5E9',
        gradient: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
        description: 'Passed statutory minimum eligibility criteria, domicile checks & certificate authentication',
      },
      {
        stage: 4,
        id: 'offers',
        code: 'STG-04',
        name: 'Provisional Offers Extended',
        count: offersCount,
        pctOfTotal: appsCount > 0 ? parseFloat(((offersCount / (appsCount || 1)) * 100).toFixed(1)) : 0,
        dropCount: Math.max(0, verifiedCount - offersCount),
        dropPct: 12.0,
        velocity: '1.5 Days',
        accentColor: '#10B981',
        gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        description: 'Formal admission offer letters dispatched with assigned branch seat and fee payment window',
      },
      {
        stage: 5,
        id: 'deposits',
        code: 'STG-05',
        name: 'Seat Confirmation Token Paid',
        count: paymentsCount || enrolledCount,
        pctOfTotal: offersCount > 0 ? parseFloat((((paymentsCount || enrolledCount) / (offersCount || 1)) * 100).toFixed(1)) : 0,
        dropCount: Math.max(0, offersCount - (paymentsCount || enrolledCount)),
        dropPct: 20.0,
        velocity: '5.4 Days',
        accentColor: '#F59E0B',
        gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        description: 'Committed applicants paid initial seat lock-in deposit',
      },
      {
        stage: 6,
        id: 'allocated',
        code: 'STG-06',
        name: 'Roll Number & Section Allocated',
        count: enrolledCount,
        pctOfTotal: (paymentsCount || enrolledCount) > 0 ? parseFloat(((enrolledCount / (paymentsCount || enrolledCount || 1)) * 100).toFixed(1)) : 0,
        dropCount: 0,
        dropPct: 0,
        velocity: '1.8 Days',
        accentColor: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
        description: 'Academic Section, Cohort Batch, Roll Number and Student ERP credentials generated',
      },
      {
        stage: 7,
        id: 'enrolled',
        code: 'STG-07',
        name: 'Formal Matriculation / Enrolled',
        count: enrolledCount,
        pctOfTotal: (paymentsCount || enrolledCount) > 0 ? parseFloat(((enrolledCount / (paymentsCount || enrolledCount || 1)) * 100).toFixed(1)) : 0,
        dropCount: 0,
        dropPct: 0,
        velocity: '0.5 Days',
        accentColor: '#EC4899',
        gradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)',
        description: 'Physical campus reporting completed and officially inducted into active academic classes',
      },
    ];

    return stages;
  }
}

