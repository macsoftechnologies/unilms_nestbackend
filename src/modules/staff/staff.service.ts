import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(tenantId: string, query?: { search?: string; departmentId?: string; staffType?: string; status?: string }) {
    // Auto-seed if empty
    const count = await this.prisma.staffProfile.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialStaff(tenantId);
    }

    const where: any = { tenantId };

    if (query?.departmentId && query.departmentId !== 'ALL') {
      where.departmentId = query.departmentId;
    }
    if (query?.staffType && query.staffType !== 'ALL') {
      where.staffType = query.staffType;
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.search) {
      where.OR = [
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.staffProfile.findMany({
      where,
      orderBy: { employeeCode: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        user: { select: { id: true, email: true, role: true, status: true } },
        leaveApplications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        payslips: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        duties: {
          orderBy: { createdAt: 'desc' },
        },
        certificates: {
          orderBy: { createdAt: 'desc' },
        },
        checklists: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member #${id} not found.`);
    }

    return staff;
  }

  async create(tenantId: string, dto: any) {
    const employeeCode = dto.employeeCode || dto.employee_code;
    const firstName = dto.firstName || dto.first_name;
    const lastName = dto.lastName || dto.last_name || null;
    const email = dto.email;
    const designation = dto.designation || 'Assistant Professor';

    if (!employeeCode || !firstName || !email) {
      throw new BadRequestException('Employee code, first name, and email are required.');
    }

    const existing = await this.prisma.staffProfile.findUnique({
      where: {
        tenantId_employeeCode: {
          tenantId,
          employeeCode,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Staff member with Employee Code '${employeeCode}' already exists.`);
    }

    const existingEmail = await this.prisma.staffProfile.findFirst({
      where: {
        tenantId,
        email: email.toLowerCase(),
      },
    });

    if (existingEmail) {
      throw new ConflictException(`Staff member with Official Email '${email}' already exists in your organization (${existingEmail.firstName} ${existingEmail.lastName || ''} - ${existingEmail.employeeCode}).`);
    }

    // Provision auth user only if explicitly requested; HR onboarding defaults to profile-only
    let userId: string | null = null;
    if (dto.createAuthAccount === true) {
      try {
        const passwordHash = await bcrypt.hash(dto.password || 'password123', 10);
        let userRole: Role = Role.FACULTY;
        if (dto.staffType === 'Administrative' || dto.staffType === 'Non-Teaching') {
          userRole = Role.CAMPUS_ADMIN;
        }

        const existingUser = await this.prisma.user.findFirst({
          where: { tenantId, email: email.toLowerCase() },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const user = await this.prisma.user.create({
            data: {
              tenantId,
              role: userRole,
              name: `${firstName} ${lastName || ''}`.trim(),
              email: email.toLowerCase(),
              passwordHash,
              phone: dto.phone || null,
              employeeCode,
              department: dto.departmentName || null,
              designation,
            },
          });
          userId = user.id;

          // Automatically assign standard Access Group based on Staff Type & Designation
          let defaultGroup = 'Faculty / Teaching Staff';
          if (dto.staffType === 'Administrative' || dto.staffType === 'Non-Teaching') {
            const des = (designation || '').toLowerCase();
            if (des.includes('hr')) defaultGroup = 'HR Operations Executive';
            else if (des.includes('account') || des.includes('fee')) defaultGroup = 'Accounts Officer / Fee Cashier';
            else if (des.includes('admiss')) defaultGroup = 'Admissions Counselor';
            else if (des.includes('exam')) defaultGroup = 'Examinations Assistant';
            else if (des.includes('hostel') || des.includes('warden')) defaultGroup = 'Hostel Warden';
            else if (des.includes('transport')) defaultGroup = 'Transport Supervisor';
            else if (des.includes('librar')) defaultGroup = 'Librarian / Library Assistant';
            else if (des.includes('placement')) defaultGroup = 'Training & Placement Officer (TPO)';
            else defaultGroup = 'Front Office / Reception Desk';
          }

          const settingKey = `${tenantId}:user_access_group:${user.id}`;
          await this.prisma.platformSetting.upsert({
            where: { key: settingKey },
            create: { key: settingKey, value: [defaultGroup] },
            update: { value: [defaultGroup] },
          });
        }
      } catch (e) {
        // Fallback: Continue profile creation even if auth record creation hit conflict
      }
    }

    return this.prisma.staffProfile.create({
      data: {
        tenantId,
        userId,
        departmentId: dto.departmentId || dto.department_id || null,
        employeeCode,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: dto.phone || null,
        designation,
        staffType: dto.staffType || dto.staff_type || 'Teaching',
        joiningDate: dto.joiningDate || dto.joining_date ? new Date(dto.joiningDate || dto.joining_date) : null,
        qualification: dto.qualification || null,
        experienceYears: dto.experienceYears ? parseInt(dto.experienceYears, 10) : 0,
        panNumber: dto.panNumber || dto.pan_number || null,
        bankAccount: dto.bankAccount || dto.bank_account || null,
        bankIfsc: dto.bankIfsc || dto.bank_ifsc || null,
        basicSalary: dto.basicSalary || dto.basic_salary ? parseFloat(dto.basicSalary || dto.basic_salary) : 45000,
        status: dto.status || 'active',
      },
      include: {
        department: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.staffProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Staff member #${id} not found.`);
    }

    if (dto.email && dto.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await this.prisma.staffProfile.findFirst({
        where: {
          tenantId,
          email: dto.email.toLowerCase(),
          id: { not: id },
        },
      });
      if (emailConflict) {
        throw new ConflictException(`Official Email '${dto.email}' is already registered to another staff member (${emailConflict.firstName} ${emailConflict.lastName || ''} - ${emailConflict.employeeCode}).`);
      }
    }

    return this.prisma.staffProfile.update({
      where: { id },
      data: {
        firstName: dto.firstName ?? dto.first_name ?? existing.firstName,
        lastName: dto.lastName ?? dto.last_name ?? existing.lastName,
        email: dto.email ? dto.email.toLowerCase() : existing.email,
        phone: dto.phone !== undefined ? dto.phone : existing.phone,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : existing.departmentId,
        designation: dto.designation ?? existing.designation,
        staffType: dto.staffType ?? dto.staff_type ?? existing.staffType,
        joiningDate: dto.joiningDate !== undefined ? (dto.joiningDate ? new Date(dto.joiningDate) : null) : existing.joiningDate,
        qualification: dto.qualification ?? existing.qualification,
        experienceYears: dto.experienceYears !== undefined ? parseInt(dto.experienceYears, 10) : existing.experienceYears,
        panNumber: dto.panNumber ?? existing.panNumber,
        bankAccount: dto.bankAccount ?? existing.bankAccount,
        bankIfsc: dto.bankIfsc ?? existing.bankIfsc,
        basicSalary: dto.basicSalary !== undefined ? parseFloat(dto.basicSalary) : existing.basicSalary,
        status: dto.status ?? existing.status,
      },
      include: {
        department: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.staffProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Staff member #${id} not found.`);
    }

    return this.prisma.staffProfile.delete({
      where: { id },
    });
  }

  // ==========================================
  // STAFF DUTIES & WORKLOAD
  // ==========================================
  async findAllDuties(tenantId: string, query?: { staffId?: string; status?: string }) {
    const count = await this.prisma.staffDuty.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialDuties(tenantId);
    }

    const where: any = { tenantId };
    if (query?.staffId && query.staffId !== 'All') {
      where.staffId = query.staffId;
    }
    if (query?.status && query.status !== 'All') {
      where.status = query.status;
    }

    return this.prisma.staffDuty.findMany({
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

  async createDuty(tenantId: string, dto: any) {
    if (!dto.staffId && !dto.staff_id) {
      throw new BadRequestException('Staff ID is required.');
    }
    if (!dto.taskName && !dto.task_name) {
      throw new BadRequestException('Task name is required.');
    }

    const staffId = dto.staffId || dto.staff_id;
    const taskName = (dto.taskName || dto.task_name).trim();
    const assignedBy = dto.assignedBy || dto.assigned_by || 'Dean Academics';
    const dueDate = dto.dueDate || dto.due_date ? new Date(dto.dueDate || dto.due_date) : null;
    const status = dto.status || 'Pending';
    const remarks = dto.remarks || null;

    return this.prisma.staffDuty.create({
      data: {
        tenantId,
        staffId,
        taskName,
        assignedBy,
        dueDate,
        status,
        remarks,
      },
      include: {
        staff: true,
      },
    });
  }

  async updateDuty(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.staffDuty.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Duty #${id} not found.`);
    }

    return this.prisma.staffDuty.update({
      where: { id },
      data: {
        staffId: dto.staffId ?? dto.staff_id ?? existing.staffId,
        taskName: dto.taskName ?? dto.task_name ?? existing.taskName,
        assignedBy: dto.assignedBy ?? dto.assigned_by ?? existing.assignedBy,
        dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : existing.dueDate,
        status: dto.status ?? existing.status,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
      },
      include: {
        staff: true,
      },
    });
  }

  async deleteDuty(tenantId: string, id: string) {
    const existing = await this.prisma.staffDuty.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Duty #${id} not found.`);
    }

    return this.prisma.staffDuty.delete({
      where: { id },
    });
  }

  // ==========================================
  // STAFF CERTIFICATES
  // ==========================================
  async findAllCertificates(tenantId: string, query?: { staffId?: string; certificateType?: string }) {
    const count = await this.prisma.staffCertificate.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialCertificates(tenantId);
    }

    const where: any = { tenantId };
    if (query?.staffId && query.staffId !== 'All') {
      where.staffId = query.staffId;
    }
    if (query?.certificateType && query.certificateType !== 'All') {
      where.certificateType = query.certificateType;
    }

    return this.prisma.staffCertificate.findMany({
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

  async createCertificate(tenantId: string, dto: any) {
    const staffId = dto.staffId || dto.staff_id;
    if (!staffId) {
      throw new BadRequestException('Staff ID is required.');
    }
    const certificateType = dto.certificateType || dto.certificate_type || 'Experience Certificate';
    const issueDate = dto.issueDate || dto.issue_date ? new Date(dto.issueDate || dto.issue_date) : new Date();
    const signatory = dto.signatory || 'Registrar & Authorized Signatory';
    const remarks = dto.remarks || null;

    return this.prisma.staffCertificate.create({
      data: {
        tenantId,
        staffId,
        certificateType,
        issueDate,
        signatory,
        status: 'Issued',
        remarks,
      },
      include: {
        staff: true,
      },
    });
  }

  async deleteCertificate(tenantId: string, id: string) {
    const existing = await this.prisma.staffCertificate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Certificate #${id} not found.`);
    }

    return this.prisma.staffCertificate.delete({
      where: { id },
    });
  }

  // ==========================================
  // STAFF CHECKLISTS
  // ==========================================
  async findAllChecklists(tenantId: string, query?: { staffId?: string; checklistType?: string; status?: string }) {
    const count = await this.prisma.staffChecklist.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialChecklists(tenantId);
    }

    const where: any = { tenantId };
    if (query?.staffId && query.staffId !== 'All') {
      where.staffId = query.staffId;
    }
    if (query?.checklistType && query.checklistType !== 'All') {
      where.checklistType = query.checklistType;
    }

    return this.prisma.staffChecklist.findMany({
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

  async createChecklist(tenantId: string, dto: any) {
    const staffId = dto.staffId || dto.staff_id;
    const itemName = dto.itemName || dto.item_name;
    if (!staffId || !itemName) {
      throw new BadRequestException('Staff ID and Item description are required.');
    }

    return this.prisma.staffChecklist.create({
      data: {
        tenantId,
        staffId,
        checklistType: dto.checklistType || dto.checklist_type || 'Joining',
        itemName: itemName.trim(),
        isCompleted: Boolean(dto.isCompleted ?? dto.is_completed),
        completedAt: dto.isCompleted || dto.is_completed ? new Date() : null,
      },
      include: {
        staff: true,
      },
    });
  }

  async updateChecklist(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.staffChecklist.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Checklist item #${id} not found.`);
    }

    const isCompleted = dto.isCompleted !== undefined ? Boolean(dto.isCompleted) : (dto.is_completed !== undefined ? Boolean(dto.is_completed) : existing.isCompleted);

    return this.prisma.staffChecklist.update({
      where: { id },
      data: {
        staffId: dto.staffId ?? dto.staff_id ?? existing.staffId,
        checklistType: dto.checklistType ?? dto.checklist_type ?? existing.checklistType,
        itemName: dto.itemName ?? dto.item_name ?? existing.itemName,
        isCompleted,
        completedAt: isCompleted ? (existing.completedAt || new Date()) : null,
      },
      include: {
        staff: true,
      },
    });
  }

  async deleteChecklist(tenantId: string, id: string) {
    const existing = await this.prisma.staffChecklist.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Checklist item #${id} not found.`);
    }

    return this.prisma.staffChecklist.delete({
      where: { id },
    });
  }

  // ==========================================
  // SEED HELPERS
  // ==========================================
  private async seedInitialStaff(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    const depts = await this.prisma.department.findMany({ where: { tenantId } });
    const cseDept = depts.find(d => d.code === 'CSE') || depts[0];
    const eceDept = depts.find(d => d.code === 'ECE') || depts[0];
    const aiDept = depts.find(d => d.code === 'AI') || depts[0];
    const domsDept = depts.find(d => d.code === 'DOMS') || depts[0];

    const initialStaff = [
      {
        employeeCode: 'EMP-101',
        firstName: 'Dr. Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@apex.edu',
        phone: '+91 98450 12341',
        designation: 'Professor & Head of Department',
        staffType: 'Faculty',
        departmentId: cseDept?.id || null,
        qualification: 'Ph.D. in Distributed Cloud Systems',
        experienceYears: 16,
        joiningDate: new Date('2020-07-01'),
        basicSalary: 98000,
        status: 'active',
      },
      {
        employeeCode: 'EMP-102',
        firstName: 'Dr. Ananya',
        lastName: 'Sharma',
        email: 'ananya.sharma@apex.edu',
        phone: '+91 98450 12342',
        designation: 'Associate Professor',
        staffType: 'Faculty',
        departmentId: aiDept?.id || null,
        qualification: 'Ph.D. in Deep Learning & Neural Architectures',
        experienceYears: 11,
        joiningDate: new Date('2021-08-15'),
        basicSalary: 84000,
        status: 'active',
      },
      {
        employeeCode: 'EMP-103',
        firstName: 'Prof. Vikram',
        lastName: 'Malhotra',
        email: 'vikram.malhotra@apex.edu',
        phone: '+91 98450 12343',
        designation: 'Assistant Professor',
        staffType: 'Faculty',
        departmentId: eceDept?.id || null,
        qualification: 'M.Tech in VLSI & Embedded Systems',
        experienceYears: 7,
        joiningDate: new Date('2022-09-01'),
        basicSalary: 67000,
        status: 'active',
      },
      {
        employeeCode: 'EMP-104',
        firstName: 'Smt. Sunita',
        lastName: 'Rao',
        email: 'sunita.rao@apex.edu',
        phone: '+91 98450 12344',
        designation: 'Associate Professor',
        staffType: 'Faculty',
        departmentId: domsDept?.id || null,
        qualification: 'MBA, M.Phil in Strategic Management',
        experienceYears: 13,
        joiningDate: new Date('2021-02-10'),
        basicSalary: 74000,
        status: 'active',
      },
      {
        employeeCode: 'EMP-105',
        firstName: 'Sri. Suresh',
        lastName: 'Nair',
        email: 'suresh.nair@apex.edu',
        phone: '+91 98450 12345',
        designation: 'Administrative Officer',
        staffType: 'Administrative',
        departmentId: cseDept?.id || null,
        qualification: 'B.Com, M.A. Public Administration',
        experienceYears: 9,
        joiningDate: new Date('2021-11-01'),
        basicSalary: 52000,
        status: 'active',
      },
    ];

    for (const s of initialStaff) {
      await this.prisma.staffProfile.create({
        data: {
          tenantId,
          ...s,
        },
      });
    }
  }

  private async seedInitialDuties(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    const staff = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    if (staff.length === 0) return;

    const s1 = staff[0];
    const s2 = staff[1] || staff[0];
    const s3 = staff[2] || staff[0];
    const s4 = staff[3] || staff[0];

    await this.prisma.staffDuty.createMany({
      data: [
        {
          tenantId,
          staffId: s1.id,
          taskName: 'End-Sem Question Paper Setting - CS401 Distributed Systems',
          assignedBy: 'Dean Academics & Controller of Examinations',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'In Progress',
          remarks: 'Strict syllabus coverage according to OBE Bloom Taxonomy',
        },
        {
          tenantId,
          staffId: s2.id,
          taskName: 'AI Lab GPU Cluster & Workstation Annual Audit',
          assignedBy: 'Head of Department',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          remarks: 'Verify physical asset tags and license compliance for 16 workstations',
        },
        {
          tenantId,
          staffId: s3.id,
          taskName: 'NBA Criterion 5 Faculty Contribution Dossier & Portfolio',
          assignedBy: 'IQAC Coordinator',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'Completed',
          remarks: 'All 3 years publication metrics compiled and attested',
        },
        {
          tenantId,
          staffId: s4.id,
          taskName: 'Organize 5-Day Faculty Development Program (FDP)',
          assignedBy: 'Director of Academics',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          status: 'In Progress',
          remarks: 'AICTE sponsored workshop on Agile Project Leadership',
        },
      ],
    });
  }

  private async seedInitialCertificates(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    const staff = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    if (staff.length === 0) return;

    const s1 = staff[0];
    const s2 = staff[1] || staff[0];
    const s3 = staff[2] || staff[0];

    await this.prisma.staffCertificate.createMany({
      data: [
        {
          tenantId,
          staffId: s1.id,
          certificateType: 'Experience Certificate',
          issueDate: new Date('2026-02-15'),
          signatory: 'Registrar & Authorized Signatory',
          status: 'Issued',
          remarks: 'Certified 5+ years of distinguished academic service at Apex University',
        },
        {
          tenantId,
          staffId: s2.id,
          certificateType: 'NOC for Higher Studies',
          issueDate: new Date('2026-04-10'),
          signatory: 'Dean Academics & Research',
          status: 'Issued',
          remarks: 'Permission granted for Post-Doctoral Fellowship at IISc Bangalore',
        },
        {
          tenantId,
          staffId: s3.id,
          certificateType: 'Salary Certificate',
          issueDate: new Date('2026-06-01'),
          signatory: 'Finance Comptroller & Accounts Officer',
          status: 'Issued',
          remarks: 'Official salary attestation for bank loan verification',
        },
      ],
    });
  }

  private async seedInitialChecklists(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    const staff = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    if (staff.length === 0) return;

    const s1 = staff[0];
    const s2 = staff[1] || staff[0];

    await this.prisma.staffChecklist.createMany({
      data: [
        {
          tenantId,
          staffId: s1.id,
          checklistType: 'Joining',
          itemName: 'Faculty Identity Badge & Biometric RFID Access Card Issued',
          isCompleted: true,
          completedAt: new Date('2020-07-02'),
        },
        {
          tenantId,
          staffId: s1.id,
          checklistType: 'Joining',
          itemName: 'Institutional Email & UniLMS Portal Admin Login Activated',
          isCompleted: true,
          completedAt: new Date('2020-07-02'),
        },
        {
          tenantId,
          staffId: s1.id,
          checklistType: 'Annual Review',
          itemName: 'Performance Appraisal & Student Feedback Dossier Approved by IQAC',
          isCompleted: true,
          completedAt: new Date('2026-06-15'),
        },
        {
          tenantId,
          staffId: s2.id,
          checklistType: 'Joining',
          itemName: 'Central Library Clearance & Research Repository Access Granted',
          isCompleted: true,
          completedAt: new Date('2021-08-16'),
        },
        {
          tenantId,
          staffId: s2.id,
          checklistType: 'Annual Review',
          itemName: 'Scopus Indexed Research Publications & Patent Disclosure Filed',
          isCompleted: false,
        },
      ],
    });
  }
}
