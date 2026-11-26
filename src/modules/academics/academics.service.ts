import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { seedStandardAccessGroups } from '../../common/constants/standard-access-groups';
import { STANDARD_PROGRAM_OUTCOMES } from '../obe/obe.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) { }

  // --- DEPARTMENTS ---
  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { programs: true, subjects: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createDepartment(tenantId: string, dto: any) {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.prisma.department.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new ConflictException(`Department with code "${code}" already exists in this institution.`);
    }

    return this.prisma.department.create({
      data: {
        tenantId,
        code,
        name: dto.name,
        headOfDepartment: dto.headOfDepartment || null,
        status: dto.status || 'active',
      },
    });
  }

  async updateDepartment(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Department not found in this institution');
    return this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        headOfDepartment: dto.headOfDepartment,
        status: dto.status,
      },
    });
  }

  async deleteDepartment(tenantId: string, id: string) {
    const existing = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Department not found in this institution');
    return this.prisma.department.delete({
      where: { id },
    });
  }

  // --- PROGRAMS ---
  async getPrograms(tenantId: string) {
    return this.prisma.program.findMany({
      where: { tenantId },
      include: {
        department: true,
        cohorts: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async createProgram(tenantId: string, dto: any) {
    const code = dto.code.trim();
    const existing = await this.prisma.program.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new ConflictException(`Program with code "${code}" already exists.`);
    }

    const program = await this.prisma.program.create({
      data: {
        tenantId,
        departmentId: dto.departmentId,
        code,
        name: dto.name,
        type: dto.type || 'UG',
        durationYears: dto.durationYears ? Number(dto.durationYears) : 4,
        pos: dto.pos || null,
        status: 'active',
      },
      include: { department: true },
    });

    // Auto-seed standard accreditation POs & PSOs into PostgreSQL database for this new program
    try {
      const outcomesData = STANDARD_PROGRAM_OUTCOMES.map((po) => ({
        tenantId,
        programId: program.id,
        code: po.code,
        title: po.title,
        description: po.description,
      }));
      await this.prisma.programOutcome.createMany({
        data: outcomesData,
        skipDuplicates: true,
      });
    } catch (seedErr) {
      console.warn('Program standard PO auto-seed note:', seedErr);
    }

    return program;
  }

  async updateProgram(tenantId: string, id: string, dto: any) {
    const program = await this.prisma.program.findFirst({ where: { id, tenantId } });
    if (!program) throw new NotFoundException(`Program not found.`);
    return this.prisma.program.update({
      where: { id },
      data: {
        departmentId: dto.departmentId || program.departmentId,
        code: dto.code ? dto.code.toUpperCase().trim() : program.code,
        name: dto.name || program.name,
        type: dto.type || program.type,
        durationYears: dto.durationYears ? Number(dto.durationYears) : program.durationYears,
      },
      include: { department: true },
    });
  }

  async deleteProgram(tenantId: string, id: string) {
    const program = await this.prisma.program.findFirst({ where: { id, tenantId } });
    if (!program) throw new NotFoundException(`Program not found.`);
    await this.prisma.program.delete({ where: { id } });
    return { success: true, message: `Program "${program.name}" deleted successfully.` };
  }

  // --- ACADEMIC YEARS ---
  async getAcademicYears(tenantId: string) {
    return this.prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createAcademicYear(tenantId: string, dto: any) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name.trim() } },
    });
    if (existing) {
      throw new ConflictException(`Academic year "${dto.name}" already exists.`);
    }

    return this.prisma.academicYear.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status || 'active',
      },
    });
  }

  async updateAcademicYear(tenantId: string, id: string, dto: any) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, tenantId } });
    if (!year) throw new NotFoundException(`Academic Year not found.`);
    return this.prisma.academicYear.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : year.name,
        startDate: dto.startDate ? new Date(dto.startDate) : year.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : year.endDate,
        status: dto.status || year.status,
      },
    });
  }

  async deleteAcademicYear(tenantId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, tenantId } });
    if (!year) throw new NotFoundException(`Academic Year not found.`);
    await this.prisma.academicYear.delete({ where: { id } });
    return { success: true, message: `Academic Year "${year.name}" deleted successfully.` };
  }

  // --- SEMESTERS ---
  async getSemesters(tenantId: string) {
    return this.prisma.semester.findMany({
      where: { tenantId },
      orderBy: { sequence: 'asc' },
    });
  }

  async createSemester(tenantId: string, dto: any) {
    const sequence = Number(dto.sequence || dto.semesterNumber || 1);
    const existing = await this.prisma.semester.findUnique({
      where: { tenantId_sequence: { tenantId, sequence } },
    });
    if (existing) {
      throw new ConflictException(`Semester with sequence ${sequence} already exists.`);
    }

    return this.prisma.semester.create({
      data: {
        tenantId,
        sequence,
        name: dto.name || `Semester ${sequence}`,
        status: 'active',
      },
    });
  }

  async updateSemester(tenantId: string, id: string, dto: any) {
    const sem = await this.prisma.semester.findFirst({ where: { id, tenantId } });
    if (!sem) throw new NotFoundException(`Semester not found.`);
    return this.prisma.semester.update({
      where: { id },
      data: {
        name: dto.name || sem.name,
        sequence: dto.sequence !== undefined ? Number(dto.sequence) : sem.sequence,
        status: dto.status || sem.status,
      },
    });
  }

  async deleteSemester(tenantId: string, id: string) {
    const sem = await this.prisma.semester.findFirst({ where: { id, tenantId } });
    if (!sem) throw new NotFoundException(`Semester not found.`);
    await this.prisma.semester.delete({ where: { id } });
    return { success: true, message: `Semester "${sem.name}" deleted successfully.` };
  }

  // --- COHORTS & SECTIONS ---
  async getCohorts(tenantId: string) {
    return this.prisma.cohort.findMany({
      where: { tenantId },
      include: {
        program: {
          include: { department: true },
        },
        academicYear: true,
        sections: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCohort(tenantId: string, dto: any) {
    return this.prisma.cohort.create({
      data: {
        tenantId,
        programId: dto.programId,
        academicYearId: dto.academicYearId || null,
        name: dto.name,
        semesterName: dto.semesterName || 'Semester 1',
        status: 'active',
        sections: {
          create: dto.sections?.map((s: any) => ({
            tenantId,
            name: s.name,
            maxStudents: s.maxStudents ? Number(s.maxStudents) : 60,
          })) || [
              {
                tenantId,
                name: 'Section A',
                maxStudents: 60,
              },
            ],
        },
      },
      include: { sections: true, program: true },
    });
  }

  async updateCohort(tenantId: string, id: string, dto: any) {
    const cohort = await this.prisma.cohort.findFirst({ where: { id, tenantId } });
    if (!cohort) throw new NotFoundException(`Cohort not found.`);
    return this.prisma.cohort.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : cohort.name,
        programId: dto.programId !== undefined ? dto.programId : cohort.programId,
        academicYearId: dto.academicYearId !== undefined ? dto.academicYearId : cohort.academicYearId,
        semesterName: dto.semesterName !== undefined ? dto.semesterName : cohort.semesterName,
        status: dto.status !== undefined ? dto.status : cohort.status,
      },
      include: { sections: true, program: true, academicYear: true },
    });
  }

  async deleteCohort(tenantId: string, id: string) {
    const cohort = await this.prisma.cohort.findFirst({ where: { id, tenantId } });
    if (!cohort) throw new NotFoundException(`Cohort not found.`);
    await this.prisma.cohort.delete({ where: { id } });
    return { success: true, message: `Cohort "${cohort.name}" deleted successfully.` };
  }

  // --- SECTIONS ---
  async getSections(tenantId: string) {
    return this.prisma.section.findMany({
      where: { tenantId },
      include: {
        cohort: {
          include: {
            program: {
              include: { department: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSection(tenantId: string, dto: any) {
    let cohortId = dto.cohortId;

    if (dto.programId && !cohortId) {
      let cohort = await this.prisma.cohort.findFirst({
        where: { tenantId, programId: dto.programId },
        orderBy: { createdAt: 'desc' },
      });
      if (!cohort) {
        const prog = await this.prisma.program.findUnique({ where: { id: dto.programId } });
        cohort = await this.prisma.cohort.create({
          data: {
            tenantId,
            programId: dto.programId,
            name: `${prog?.code || 'PROGRAM'} Central Roster`,
            status: 'active',
          },
        });
      }
      cohortId = cohort.id;
    }

    if (!cohortId) {
      const firstCohort = await this.prisma.cohort.findFirst({ where: { tenantId } });
      if (firstCohort) {
        cohortId = firstCohort.id;
      } else {
        const prog = await this.prisma.program.findFirst({ where: { tenantId } });
        if (prog) {
          const newCohort = await this.prisma.cohort.create({
            data: {
              tenantId,
              programId: prog.id,
              name: `${prog.code} Central Roster`,
            },
          });
          cohortId = newCohort.id;
        }
      }
    }

    if (!cohortId) {
      throw new ConflictException('A Cohort must exist before creating Sections. Please create a Cohort first.');
    }

    const sectionName = (dto.name || '').trim();
    if (!sectionName) {
      throw new ConflictException('Section name cannot be empty.');
    }

    // Check for duplicate section name within the same cohort
    const existingSection = await this.prisma.section.findFirst({
      where: {
        tenantId,
        cohortId,
        name: { equals: sectionName, mode: 'insensitive' },
      },
    });
    if (existingSection) {
      throw new ConflictException(`A section named "${sectionName}" already exists for this Cohort.`);
    }

    return this.prisma.section.create({
      data: {
        tenantId,
        cohortId,
        name: sectionName,
        maxStudents: dto.maxStudents ? Number(dto.maxStudents) : (dto.capacity ? Number(dto.capacity) : 60),
        status: 'active',
      },
      include: {
        cohort: {
          include: {
            program: true,
          },
        },
      },
    });
  }

  async updateSection(tenantId: string, id: string, dto: any) {
    const sec = await this.prisma.section.findFirst({ where: { id, tenantId } });
    if (!sec) throw new NotFoundException(`Section not found.`);

    const targetCohortId = dto.cohortId || sec.cohortId;
    const sectionName = (dto.name !== undefined ? dto.name : sec.name).trim();

    if (sectionName) {
      const duplicate = await this.prisma.section.findFirst({
        where: {
          tenantId,
          cohortId: targetCohortId,
          name: { equals: sectionName, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(`A section named "${sectionName}" already exists for this Cohort.`);
      }
    }

    return this.prisma.section.update({
      where: { id },
      data: {
        cohortId: targetCohortId,
        name: sectionName || sec.name,
        maxStudents: dto.maxStudents ? Number(dto.maxStudents) : (dto.capacity ? Number(dto.capacity) : sec.maxStudents),
        status: dto.status || sec.status,
      },
      include: { cohort: true },
    });
  }

  async deleteSection(tenantId: string, id: string) {
    const sec = await this.prisma.section.findFirst({ where: { id, tenantId } });
    if (!sec) throw new NotFoundException(`Section not found.`);
    await this.prisma.section.delete({ where: { id } });
    return { success: true, message: `Section "${sec.name}" deleted successfully.` };
  }

  // --- SUBJECTS ---
  async getSubjects(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }

  async createSubject(tenantId: string, dto: any) {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.prisma.subject.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new ConflictException(`Subject with code "${code}" already exists in this institution.`);
    }

    return this.prisma.subject.create({
      data: {
        tenantId,
        departmentId: dto.departmentId || null,
        code,
        name: dto.name,
        shortName: dto.shortName || null,
        credits: dto.credits ? Number(dto.credits) : 3.0,
        type: dto.type || 'Theory',
        sessions: dto.sessions ? Number(dto.sessions) : 45,
        status: 'active',
      },
      include: { department: true },
    });
  }

  async updateSubject(tenantId: string, id: string, dto: any) {
    const sub = await this.prisma.subject.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException(`Subject not found.`);
    return this.prisma.subject.update({
      where: { id },
      data: {
        departmentId: dto.departmentId || sub.departmentId,
        code: dto.code ? dto.code.toUpperCase().trim() : sub.code,
        name: dto.name || sub.name,
        credits: dto.credits ? Number(dto.credits) : sub.credits,
        type: dto.type || sub.type,
      },
      include: { department: true },
    });
  }

  async deleteSubject(tenantId: string, id: string) {
    const sub = await this.prisma.subject.findFirst({ where: { id, tenantId } });
    if (!sub) throw new NotFoundException(`Subject not found.`);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true, message: `Subject "${sub.name}" deleted successfully.` };
  }

  // --- ACCESS GROUPS (RBAC) ---
  async getAccessGroups(tenantId: string) {
    await seedStandardAccessGroups(this.prisma, tenantId);
    return this.prisma.accessGroup.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAccessGroup(tenantId: string, dto: any) {
    return this.prisma.accessGroup.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || '',
        permissionsCount: dto.permissionsCount ? Number(dto.permissionsCount) : (dto.permissions_count ? Number(dto.permissions_count) : 0),
        createdBy: dto.createdBy || 'Campus Admin',
      },
    });
  }

  async updateAccessGroup(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.accessGroup.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Access group not found');
    return this.prisma.accessGroup.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : existing.name,
        description: dto.description !== undefined ? dto.description : existing.description,
        permissionsCount: dto.permissionsCount !== undefined ? Number(dto.permissionsCount) : (dto.permissions_count !== undefined ? Number(dto.permissions_count) : existing.permissionsCount),
      },
    });
  }

  async deleteAccessGroup(tenantId: string, id: string) {
    const existing = await this.prisma.accessGroup.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Access group not found');
    await this.prisma.accessGroup.delete({ where: { id } });
    return { success: true, message: 'Access group deleted successfully' };
  }

  // --- REGULATIONS ---
  async getRegulations(tenantId: string) {
    return this.prisma.regulation.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createRegulation(tenantId: string, dto: any) {
    const code = (dto.code || '').toUpperCase().trim();
    if (!code) throw new BadRequestException('Regulation code is required.');

    const existing = await this.prisma.regulation.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new ConflictException(`Regulation with code "${code}" already exists.`);
    }

    return this.prisma.regulation.create({
      data: {
        tenantId,
        code,
        name: dto.name || code,
        startYear: dto.startYear ? Number(dto.startYear) : 2026,
        totalCredits: dto.totalCredits ? Number(dto.totalCredits) : 160,
        passPercentage: dto.passPercentage ? Number(dto.passPercentage) : 40.0,
        description: dto.description || '',
        status: dto.status || 'active',
      },
    });
  }

  async updateRegulation(tenantId: string, id: string, dto: any) {
    const reg = await this.prisma.regulation.findFirst({ where: { id, tenantId } });
    if (!reg) throw new NotFoundException('Regulation not found.');

    const code = dto.code ? dto.code.toUpperCase().trim() : reg.code;
    if (code !== reg.code) {
      const duplicate = await this.prisma.regulation.findFirst({
        where: { tenantId, code, id: { not: id } },
      });
      if (duplicate) throw new ConflictException(`Regulation with code "${code}" already exists.`);
    }

    return this.prisma.regulation.update({
      where: { id },
      data: {
        code,
        name: dto.name || reg.name,
        startYear: dto.startYear ? Number(dto.startYear) : reg.startYear,
        totalCredits: dto.totalCredits ? Number(dto.totalCredits) : reg.totalCredits,
        passPercentage: dto.passPercentage ? Number(dto.passPercentage) : reg.passPercentage,
        description: dto.description !== undefined ? dto.description : reg.description,
        status: dto.status || reg.status,
      },
    });
  }

  async deleteRegulation(tenantId: string, id: string) {
    const reg = await this.prisma.regulation.findFirst({ where: { id, tenantId } });
    if (!reg) throw new NotFoundException('Regulation not found.');
    await this.prisma.regulation.delete({ where: { id } });
    return { success: true, message: `Regulation "${reg.name}" deleted successfully.` };
  }

  // --- TIMETABLE & PERIODS ---
  async getTimetablePeriods(tenantId: string) {
    const count = await this.prisma.timetablePeriod.count({ where: { tenantId } });
    if (count === 0) {
      const defaultPeriods = [
        { name: 'Period 1', periodNumber: 1, startTime: '09:00 AM', endTime: '09:50 AM', isBreak: false },
        { name: 'Period 2', periodNumber: 2, startTime: '09:50 AM', endTime: '10:40 AM', isBreak: false },
        { name: 'Morning Interval / Tea Break', periodNumber: 3, startTime: '10:40 AM', endTime: '10:55 AM', isBreak: true },
        { name: 'Period 3', periodNumber: 4, startTime: '10:55 AM', endTime: '11:45 AM', isBreak: false },
        { name: 'Period 4', periodNumber: 5, startTime: '11:45 AM', endTime: '12:35 PM', isBreak: false },
        { name: 'Lunch Break & Recess', periodNumber: 6, startTime: '12:35 PM', endTime: '01:25 PM', isBreak: true },
        { name: 'Period 5', periodNumber: 7, startTime: '01:25 PM', endTime: '02:15 PM', isBreak: false },
        { name: 'Period 6', periodNumber: 8, startTime: '02:15 PM', endTime: '03:05 PM', isBreak: false },
        { name: 'Period 7', periodNumber: 9, startTime: '03:05 PM', endTime: '03:55 PM', isBreak: false },
      ];
      await this.prisma.timetablePeriod.createMany({
        data: defaultPeriods.map((p) => ({ ...p, tenantId })),
      });
    }

    return this.prisma.timetablePeriod.findMany({
      where: { tenantId },
      orderBy: { periodNumber: 'asc' },
    });
  }

  async createTimetablePeriod(tenantId: string, dto: any) {
    return this.prisma.timetablePeriod.create({
      data: {
        tenantId,
        name: dto.name || dto.period_name || 'Period',
        periodNumber: dto.periodNumber ? Number(dto.periodNumber) : 1,
        startTime: dto.startTime || dto.start_time || '09:00 AM',
        endTime: dto.endTime || dto.end_time || '09:50 AM',
        isBreak: Boolean(dto.isBreak ?? dto.is_break),
      },
    });
  }

  async deleteTimetablePeriod(tenantId: string, id: string) {
    const p = await this.prisma.timetablePeriod.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Period not found.');
    await this.prisma.timetablePeriod.delete({ where: { id } });
    return { success: true, message: `Period "${p.name}" deleted.` };
  }

  async getTimetableSlots(tenantId: string, query?: { sectionId?: string; cohortId?: string }) {
    const count = await this.prisma.timetableSlot.count({ where: { tenantId } });
    if (count === 0) {
      // Ensure periods exist first
      await this.getTimetablePeriods(tenantId);
      const [periods, cohort, section, subject, staff] = await Promise.all([
        this.prisma.timetablePeriod.findMany({ where: { tenantId }, orderBy: { periodNumber: 'asc' } }),
        this.prisma.cohort.findFirst({ where: { tenantId } }),
        this.prisma.section.findFirst({ where: { tenantId } }),
        this.prisma.subject.findFirst({ where: { tenantId } }),
        this.prisma.staffProfile.findFirst({ where: { tenantId } }),
      ]);

      const teachingPeriods = periods.filter((p) => !p.isBreak);
      if (teachingPeriods.length > 0 && subject) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const slotsToCreate = [];
        for (let i = 0; i < days.length; i++) {
          const day = days[i];
          const p1 = teachingPeriods[i % teachingPeriods.length];
          const p2 = teachingPeriods[(i + 2) % teachingPeriods.length];
          slotsToCreate.push({
            tenantId,
            day,
            periodId: p1.id,
            cohortId: cohort?.id || null,
            sectionId: section?.id || null,
            subjectId: subject.id,
            staffId: staff?.id || null,
            room: `Lecture Hall ${101 + i}`,
          });
          if (p2 && p2.id !== p1.id) {
            slotsToCreate.push({
              tenantId,
              day,
              periodId: p2.id,
              cohortId: cohort?.id || null,
              sectionId: section?.id || null,
              subjectId: subject.id,
              staffId: staff?.id || null,
              room: `Lab Room ${201 + i}`,
            });
          }
        }
        await this.prisma.timetableSlot.createMany({ data: slotsToCreate });
      }
    }

    const where: any = { tenantId };
    if (query?.sectionId) where.sectionId = query.sectionId;
    if (query?.cohortId) where.cohortId = query.cohortId;

    return this.prisma.timetableSlot.findMany({
      where,
      include: {
        period: true,
        subject: true,
        staff: true,
        section: true,
        cohort: true,
      },
      orderBy: [{ day: 'asc' }],
    });
  }

  async saveTimetableSlot(tenantId: string, dto: any) {
    if (dto.id) {
      return this.prisma.timetableSlot.update({
        where: { id: dto.id },
        data: {
          day: dto.day,
          periodId: dto.periodId,
          cohortId: dto.cohortId || null,
          sectionId: dto.sectionId || null,
          subjectId: dto.subjectId,
          staffId: dto.staffId || null,
          room: dto.room || null,
        },
        include: { period: true, subject: true, staff: true, section: true },
      });
    }

    return this.prisma.timetableSlot.create({
      data: {
        tenantId,
        day: dto.day,
        periodId: dto.periodId,
        cohortId: dto.cohortId || null,
        sectionId: dto.sectionId || null,
        subjectId: dto.subjectId,
        staffId: dto.staffId || null,
        room: dto.room || null,
      },
      include: { period: true, subject: true, staff: true, section: true },
    });
  }

  async deleteTimetableSlot(tenantId: string, id: string) {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { id, tenantId } });
    if (!slot) throw new NotFoundException('Timetable slot not found.');
    await this.prisma.timetableSlot.delete({ where: { id } });
    return { success: true };
  }

  // --- STUDY MATERIALS ---
  async getStudyMaterials(tenantId: string, query?: { subjectId?: string }) {
    const where: any = { tenantId };
    if (query?.subjectId) where.subjectId = query.subjectId;
    return this.prisma.studyMaterial.findMany({
      where,
      include: { subject: true, cohort: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStudyMaterial(tenantId: string, dto: any) {
    return this.prisma.studyMaterial.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        cohortId: dto.cohortId || null,
        title: dto.title,
        description: dto.description || '',
        type: dto.type || 'PDF',
        fileUrl: dto.fileUrl || dto.url || '',
        fileName: dto.fileName || dto.file_name || '',
        uploadedBy: dto.uploadedBy || 'Academic Faculty',
        status: dto.status || 'active',
      },
      include: { subject: true },
    });
  }

  async deleteStudyMaterial(tenantId: string, id: string) {
    const mat = await this.prisma.studyMaterial.findFirst({ where: { id, tenantId } });
    if (!mat) throw new NotFoundException('Material not found.');
    await this.prisma.studyMaterial.delete({ where: { id } });
    return { success: true };
  }

  async updateStudyMaterial(tenantId: string, id: string, dto: any) {
    const mat = await this.prisma.studyMaterial.findFirst({ where: { id, tenantId } });
    if (!mat) throw new NotFoundException('Material not found.');
    return this.prisma.studyMaterial.update({
      where: { id },
      data: {
        ...(dto.subjectId && { subjectId: dto.subjectId }),
        ...(dto.cohortId !== undefined && { cohortId: dto.cohortId }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl || dto.url }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName || dto.file_name }),
        ...(dto.status && { status: dto.status }),
      },
      include: { subject: true },
    });
  }

  // --- CONTINUOUS ASSESSMENTS & ASSIGNMENTS ---
  async getAssessments(tenantId: string, query?: { subjectId?: string; cohortName?: string }) {
    const where: any = { tenantId };
    if (query?.subjectId && query.subjectId !== 'ALL') where.subjectId = query.subjectId;
    if (query?.cohortName && query.cohortName !== 'ALL') where.cohortName = query.cohortName;

    return this.prisma.continuousAssessment.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true, departmentId: true } },
        _count: { select: { marks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAssessment(tenantId: string, dto: any) {
    return this.prisma.continuousAssessment.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        name: dto.name || dto.title || 'Course Assignment',
        cohortName: dto.cohortName || dto.cohort_name || 'General Batch',
        examType: dto.examType || dto.type || 'Assignment',
        maxMarks: dto.maxMarks ? parseFloat(String(dto.maxMarks)) : 50.0,
        weightage: dto.weightage ? parseFloat(String(dto.weightage)) : 20.0,
        assessmentDate: dto.assessmentDate || dto.dueDate ? new Date(dto.assessmentDate || dto.dueDate) : new Date(),
        status: dto.status || 'ACTIVE',
      },
      include: { subject: true },
    });
  }

  async updateAssessment(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.continuousAssessment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Assessment not found.');

    return this.prisma.continuousAssessment.update({
      where: { id },
      data: {
        name: dto.name || dto.title || existing.name,
        cohortName: dto.cohortName || dto.cohort_name || existing.cohortName,
        examType: dto.examType || dto.type || existing.examType,
        maxMarks: dto.maxMarks ? parseFloat(String(dto.maxMarks)) : existing.maxMarks,
        weightage: dto.weightage ? parseFloat(String(dto.weightage)) : existing.weightage,
        assessmentDate: dto.assessmentDate || dto.dueDate ? new Date(dto.assessmentDate || dto.dueDate) : existing.assessmentDate,
        status: dto.status || existing.status,
      },
      include: { subject: true },
    });
  }

  async deleteAssessment(tenantId: string, id: string) {
    const existing = await this.prisma.continuousAssessment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Assessment not found.');
    await this.prisma.continuousAssessment.delete({ where: { id } });
    return { success: true, message: `Assessment "${existing.name}" deleted.` };
  }

  async getAssessmentMarks(tenantId: string, assessmentId: string, studentId?: string) {
    return this.prisma.continuousAssessmentMark.findMany({
      where: {
        tenantId,
        assessmentId,
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            firstName: true,
            lastName: true,
            program: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });
  }

  async saveAssessmentMarks(tenantId: string, assessmentId: string, marks: Array<{
    studentId: string;
    score: number;
    remarks?: string;
  }>) {
    const ops = marks.map((m) => {
      const scoreVal = Number(m.score) || 0;
      return this.prisma.continuousAssessmentMark.upsert({
        where: {
          tenantId_assessmentId_studentId: {
            tenantId,
            assessmentId,
            studentId: m.studentId,
          },
        },
        update: {
          score: scoreVal,
          remarks: m.remarks || null,
        },
        create: {
          tenantId,
          assessmentId,
          studentId: m.studentId,
          score: scoreVal,
          remarks: m.remarks || null,
        },
      });
    });

    await this.prisma.$transaction(ops);
    return { success: true, count: marks.length };
  }

  async submitAssessment(tenantId: string, assessmentId: string, studentId: string, dto: any, userRole?: string) {
    let isDbAssessment = false;
    try {
      const assessment = await this.prisma.continuousAssessment.findFirst({
        where: { id: assessmentId, tenantId },
      });
      isDbAssessment = !!assessment;
    } catch {}

    const isStudent = (userRole || '').toUpperCase() === 'STUDENT';
    const submissionRemarks = dto.remarks || (dto.essayText ? `Submitted essay (${dto.essayText.length} chars). ${dto.fileName || ''}` : `Uploaded deliverable: ${dto.fileName || 'Archive'}`);

    if (isDbAssessment) {
      const existing = await this.prisma.continuousAssessmentMark.findUnique({
        where: {
          tenantId_assessmentId_studentId: {
            tenantId,
            assessmentId,
            studentId,
          },
        },
      });

      // Students cannot self-grade; marks are assigned by faculty
      const assignedScore = isStudent ? (existing?.score ?? null) : (dto.score !== undefined ? Number(dto.score) : null);

      return this.prisma.continuousAssessmentMark.upsert({
        where: {
          tenantId_assessmentId_studentId: {
            tenantId,
            assessmentId,
            studentId,
          },
        },
        update: {
          score: assignedScore,
          remarks: submissionRemarks,
        },
        create: {
          tenantId,
          assessmentId,
          studentId,
          score: assignedScore,
          remarks: submissionRemarks,
        },
      });
    }

    const key = `${tenantId}:assessment_submission:${studentId}:${assessmentId}`;
    const payload = {
      tenantId,
      studentId,
      assessmentId,
      submittedAt: new Date().toISOString(),
      fileName: dto.fileName || null,
      essayText: dto.essayText || null,
      remarks: submissionRemarks,
      score: isStudent ? null : (dto.score !== undefined ? Number(dto.score) : null),
      status: 'Submitted',
    };

    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value: payload },
      create: { key, value: payload },
    });

    return {
      success: true,
      submission: payload,
    };
  }

  async getStudentSubmission(tenantId: string, assessmentId: string, studentId: string) {
    try {
      const mark = await this.prisma.continuousAssessmentMark.findFirst({
        where: { tenantId, assessmentId, studentId },
      });
      if (mark) return mark;
    } catch {}

    const key = `${tenantId}:assessment_submission:${studentId}:${assessmentId}`;
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }
}
