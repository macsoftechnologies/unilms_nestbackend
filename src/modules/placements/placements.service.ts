import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve student (prefer Aditya Sharma 2026-UG-53)
  private async getAnchorStudent(tenantId: string) {
    let student = await this.prisma.studentProfile.findFirst({
      where: {
        tenantId,
        OR: [
          { rollNumber: '2026-UG-53' },
          { firstName: 'Aditya' }
        ]
      }
    });
    if (!student) {
      student = await this.prisma.studentProfile.findFirst({ where: { tenantId } });
    }
    return student;
  }

  // ==========================================
  // 1. CORPORATE PARTNERS / COMPANIES
  // ==========================================
  async findAllCompanies(tenantId: string) {
    return this.prisma.placementCompany.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { drives: true, offers: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCompany(tenantId: string, dto: any) {
    if (!dto.name) throw new BadRequestException('Company name is required');
    return this.prisma.placementCompany.create({
      data: {
        tenantId,
        name: dto.name,
        industry: dto.industry || 'Technology & Engineering',
        tier: dto.tier || 'Tier 1',
        hrName: dto.hrName || dto.hr_contact || null,
        hrEmail: dto.hrEmail || dto.hr_email || null,
        hrPhone: dto.hrPhone || dto.hr_phone || null,
        website: dto.website || null,
        location: dto.location || 'Pan-India',
        mouSigned: dto.mouSigned ?? dto.mou_signed ?? true,
        status: dto.status || 'Active'
      }
    });
  }

  async updateCompany(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.placementCompany.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Partner company not found.');

    return this.prisma.placementCompany.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : existing.name,
        industry: dto.industry !== undefined ? dto.industry : existing.industry,
        tier: dto.tier !== undefined ? dto.tier : existing.tier,
        hrName: dto.hrName !== undefined ? dto.hrName : (dto.hr_contact !== undefined ? dto.hr_contact : existing.hrName),
        hrEmail: dto.hrEmail !== undefined ? dto.hrEmail : (dto.hr_email !== undefined ? dto.hr_email : existing.hrEmail),
        hrPhone: dto.hrPhone !== undefined ? dto.hrPhone : (dto.hr_phone !== undefined ? dto.hr_phone : existing.hrPhone),
        website: dto.website !== undefined ? dto.website : existing.website,
        location: dto.location !== undefined ? dto.location : existing.location,
        mouSigned: dto.mouSigned !== undefined ? dto.mouSigned : (dto.mou_signed !== undefined ? dto.mou_signed : existing.mouSigned),
        status: dto.status !== undefined ? dto.status : existing.status
      }
    });
  }

  async deleteCompany(tenantId: string, id: string) {
    const existing = await this.prisma.placementCompany.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Partner company not found.');

    return this.prisma.placementCompany.delete({ where: { id } });
  }

  // ==========================================
  // 2. RECRUITMENT DRIVES
  // ==========================================
  async findAllDrives(tenantId: string) {
    return this.prisma.placementDrive.findMany({
      where: { tenantId },
      include: {
        company: true,
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createDrive(tenantId: string, dto: any) {
    if (!dto.title || !dto.companyId) {
      throw new BadRequestException('Drive title and company are required');
    }

    const ctcNumeric = dto.ctcNumeric ? parseFloat(String(dto.ctcNumeric)) : (dto.ctc ? parseFloat(String(dto.ctc)) : 0);

    return this.prisma.placementDrive.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        title: dto.title,
        jobRole: dto.jobRole || dto.role || 'Software Engineer',
        ctcDetails: dto.ctcDetails || (ctcNumeric ? `₹${ctcNumeric} LPA` : 'Best in Industry'),
        ctcNumeric,
        driveDate: dto.driveDate ? new Date(dto.driveDate) : null,
        deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : null,
        requiredCgpa: dto.requiredCgpa ? parseFloat(String(dto.requiredCgpa)) : (dto.eligibility_cgpa ? parseFloat(String(dto.eligibility_cgpa)) : 6.5),
        maxBacklogs: dto.maxBacklogs !== undefined ? parseInt(String(dto.maxBacklogs), 10) : (dto.max_backlogs !== undefined ? parseInt(String(dto.max_backlogs), 10) : 0),
        location: dto.location || 'On-Campus',
        status: dto.status || 'Active',
        description: dto.description || null
      },
      include: { company: true }
    });
  }

  async updateDrive(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.placementDrive.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Placement drive not found.');

    return this.prisma.placementDrive.update({
      where: { id },
      data: {
        companyId: dto.companyId || existing.companyId,
        title: dto.title || existing.title,
        jobRole: dto.jobRole || dto.role || existing.jobRole,
        ctcDetails: dto.ctcDetails || existing.ctcDetails,
        ctcNumeric: dto.ctcNumeric !== undefined ? parseFloat(String(dto.ctcNumeric)) : existing.ctcNumeric,
        driveDate: dto.driveDate ? new Date(dto.driveDate) : existing.driveDate,
        deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : existing.deadlineDate,
        requiredCgpa: dto.requiredCgpa !== undefined ? parseFloat(String(dto.requiredCgpa)) : existing.requiredCgpa,
        maxBacklogs: dto.maxBacklogs !== undefined ? parseInt(String(dto.maxBacklogs), 10) : existing.maxBacklogs,
        location: dto.location !== undefined ? dto.location : existing.location,
        status: dto.status || existing.status,
        description: dto.description !== undefined ? dto.description : existing.description
      },
      include: { company: true }
    });
  }

  async deleteDrive(tenantId: string, id: string) {
    const existing = await this.prisma.placementDrive.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Placement drive not found.');

    return this.prisma.placementDrive.delete({ where: { id } });
  }

  // ==========================================
  // 3. CANDIDATE APPLICATIONS & STAGE TRACKER
  // ==========================================
  async findAllApplications(tenantId: string, driveId?: string, studentId?: string) {
    return this.prisma.placementApplication.findMany({
      where: {
        tenantId,
        ...(driveId ? { driveId } : {}),
        ...(studentId ? { studentId } : {})
      },
      include: {
        drive: {
          include: { company: true }
        },
        student: {
          include: { program: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createApplication(tenantId: string, dto: any) {
    if (!dto.driveId || !dto.studentId) {
      throw new BadRequestException('Drive ID and Student ID are required');
    }

    return this.prisma.placementApplication.create({
      data: {
        tenantId,
        driveId: dto.driveId,
        studentId: dto.studentId,
        currentRound: dto.currentRound || dto.current_round || 'Round 1: Online Assessment',
        status: dto.status || 'In Progress',
        resumeUrl: dto.resumeUrl || null,
        remarks: dto.remarks || null
      },
      include: {
        drive: { include: { company: true } },
        student: { include: { program: true } }
      }
    });
  }

  async updateApplicationStage(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.placementApplication.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Placement application not found.');

    return this.prisma.placementApplication.update({
      where: { id },
      data: {
        currentRound: dto.currentRound || dto.current_round || existing.currentRound,
        status: dto.status || existing.status,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks
      },
      include: {
        drive: { include: { company: true } },
        student: { include: { program: true } }
      }
    });
  }

  async deleteApplication(tenantId: string, id: string, studentId?: string) {
    const existing = await this.prisma.placementApplication.findFirst({
      where: {
        id,
        tenantId,
        ...(studentId ? { studentId } : {})
      }
    });
    if (!existing) throw new NotFoundException('Placement application not found or unauthorized.');

    return this.prisma.placementApplication.delete({ where: { id } });
  }

  // ==========================================
  // 4. PLACEMENT JOB OFFERS
  // ==========================================
  async findAllOffers(tenantId: string, studentId?: string) {
    return this.prisma.placementOffer.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {})
      },
      include: {
        company: true,
        student: {
          include: { program: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createOffer(tenantId: string, dto: any) {
    if (!dto.studentId || !dto.companyId || !dto.jobRole) {
      throw new BadRequestException('Student ID, Company ID and Job Role are required');
    }

    const ctc = dto.ctc ? parseFloat(String(dto.ctc)) : 10.0;

    return this.prisma.placementOffer.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        companyId: dto.companyId,
        jobRole: dto.jobRole,
        ctc,
        offerDate: dto.offerDate ? new Date(dto.offerDate) : new Date(),
        offerLetterRef: dto.offerLetterRef || dto.ref_no || `OFFER-${Date.now().toString().slice(-4)}`,
        status: dto.status || 'Accepted',
        department: dto.department || 'Computer Science & Engineering'
      },
      include: {
        company: true,
        student: { include: { program: true } }
      }
    });
  }

  async updateOffer(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.placementOffer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Placement offer not found.');

    return this.prisma.placementOffer.update({
      where: { id },
      data: {
        companyId: dto.companyId || existing.companyId,
        studentId: dto.studentId || existing.studentId,
        jobRole: dto.jobRole || existing.jobRole,
        ctc: dto.ctc !== undefined ? parseFloat(String(dto.ctc)) : existing.ctc,
        offerDate: dto.offerDate ? new Date(dto.offerDate) : existing.offerDate,
        offerLetterRef: dto.offerLetterRef || existing.offerLetterRef,
        status: dto.status || existing.status,
        department: dto.department || existing.department
      },
      include: {
        company: true,
        student: { include: { program: true } }
      }
    });
  }

  async deleteOffer(tenantId: string, id: string) {
    const existing = await this.prisma.placementOffer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Placement offer not found.');

    return this.prisma.placementOffer.delete({ where: { id } });
  }

  // ==========================================
  // 5. INTERNSHIP POSTINGS & MILESTONES
  // ==========================================
  async findAllInternships(tenantId: string) {
    return this.prisma.internshipPosting.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createInternship(tenantId: string, dto: any) {
    if (!dto.companyName && !dto.company_name) {
      throw new BadRequestException('Company name is required');
    }

    const milestones = dto.milestones || [
      dto.milestone_1 || dto.milestone1 || 'Mid-term Technical Presentation',
      dto.milestone_2 || dto.milestone2 || 'Final Production PR Merge & Review'
    ];

    return this.prisma.internshipPosting.create({
      data: {
        tenantId,
        companyName: dto.companyName || dto.company_name,
        roleTitle: dto.roleTitle || dto.role_title || 'Software Engineering Intern',
        workMode: dto.workMode || dto.work_mode || 'Hybrid',
        location: dto.location || 'Pan-India',
        stipendAmount: dto.stipendAmount ? parseFloat(String(dto.stipendAmount)) : (dto.stipend ? parseFloat(String(dto.stipend)) : 50000.0),
        totalSeats: dto.totalSeats !== undefined ? parseInt(String(dto.totalSeats), 10) : (dto.total_seats !== undefined ? parseInt(String(dto.total_seats), 10) : 5),
        availableSeats: dto.availableSeats !== undefined ? parseInt(String(dto.availableSeats), 10) : (dto.available_seats !== undefined ? parseInt(String(dto.available_seats), 10) : 5),
        startDate: dto.startDate ? new Date(dto.startDate) : (dto.start_date ? new Date(dto.start_date) : null),
        endDate: dto.endDate ? new Date(dto.endDate) : (dto.end_date ? new Date(dto.end_date) : null),
        milestonesJson: JSON.stringify(milestones),
        status: dto.status || 'Published'
      }
    });
  }

  async updateInternship(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.internshipPosting.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Internship posting not found.');

    let milestonesJson = existing.milestonesJson;
    if (dto.milestones) {
      milestonesJson = JSON.stringify(dto.milestones);
    } else if (dto.milestone_1 || dto.milestone1 || dto.milestone_2 || dto.milestone2) {
      const current = existing.milestonesJson ? JSON.parse(existing.milestonesJson) : [];
      const m1 = dto.milestone_1 || dto.milestone1 || current[0] || 'Milestone 1';
      const m2 = dto.milestone_2 || dto.milestone2 || current[1] || 'Milestone 2';
      milestonesJson = JSON.stringify([m1, m2]);
    }

    return this.prisma.internshipPosting.update({
      where: { id },
      data: {
        companyName: dto.companyName || dto.company_name || existing.companyName,
        roleTitle: dto.roleTitle || dto.role_title || existing.roleTitle,
        workMode: dto.workMode || dto.work_mode || existing.workMode,
        location: dto.location !== undefined ? dto.location : existing.location,
        stipendAmount: dto.stipendAmount !== undefined ? parseFloat(String(dto.stipendAmount)) : (dto.stipend !== undefined ? parseFloat(String(dto.stipend)) : existing.stipendAmount),
        totalSeats: dto.totalSeats !== undefined ? parseInt(String(dto.totalSeats), 10) : (dto.total_seats !== undefined ? parseInt(String(dto.total_seats), 10) : existing.totalSeats),
        availableSeats: dto.availableSeats !== undefined ? parseInt(String(dto.availableSeats), 10) : (dto.available_seats !== undefined ? parseInt(String(dto.available_seats), 10) : existing.availableSeats),
        startDate: dto.startDate ? new Date(dto.startDate) : (dto.start_date ? new Date(dto.start_date) : existing.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : (dto.end_date ? new Date(dto.end_date) : existing.endDate),
        milestonesJson,
        status: dto.status || existing.status
      }
    });
  }

  async deleteInternship(tenantId: string, id: string) {
    const existing = await this.prisma.internshipPosting.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Internship posting not found.');

    return this.prisma.internshipPosting.delete({ where: { id } });
  }
}
