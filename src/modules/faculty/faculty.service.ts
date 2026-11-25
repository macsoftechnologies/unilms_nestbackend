import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================
  // 0. AUTO-SEEDING & DATA RESILIENCE
  // ========================================================
  async ensureSeeded(tenantId: string) {
    return;
    // 1. Ensure staff profiles exist
    let staffList = await this.prisma.staffProfile.findMany({
      where: { tenantId },
    });

    if (staffList.length === 0) {
      const dept = await this.prisma.department.findFirst({ where: { tenantId } });
      const deptId = dept?.id || null;

      const seededStaff = [
        {
          tenantId,
          employeeCode: 'EMP-0101',
          firstName: 'Dr. Ramesh',
          lastName: 'Gupta',
          email: 'ramesh.gupta@unilms.edu',
          phone: '+91 98450 11223',
          designation: 'Professor & HOD',
          staffType: 'Teaching',
          qualification: 'Ph.D. in Computer Science (IIT Bombay)',
          experienceYears: 18,
          departmentId: deptId,
          status: 'active',
        },
        {
          tenantId,
          employeeCode: 'EMP-0112',
          firstName: 'Dr. Sunita',
          lastName: 'Deshmukh',
          email: 'sunita.deshmukh@unilms.edu',
          phone: '+91 98450 44556',
          designation: 'Associate Professor',
          staffType: 'Teaching',
          qualification: 'Ph.D. in Distributed Systems',
          experienceYears: 12,
          departmentId: deptId,
          status: 'active',
        },
        {
          tenantId,
          employeeCode: 'EMP-0145',
          firstName: 'Prof. Vikram',
          lastName: 'Verma',
          email: 'vikram.verma@unilms.edu',
          phone: '+91 98450 77889',
          designation: 'Assistant Professor',
          staffType: 'Teaching',
          qualification: 'M.Tech CSE (NIT Trichy)',
          experienceYears: 7,
          departmentId: deptId,
          status: 'active',
        },
        {
          tenantId,
          employeeCode: 'EMP-0188',
          firstName: 'Ms. Pooja',
          lastName: 'Nair',
          email: 'pooja.nair@unilms.edu',
          phone: '+91 98450 99001',
          designation: 'Assistant Professor',
          staffType: 'Teaching',
          qualification: 'M.Tech Software Engineering',
          experienceYears: 5,
          departmentId: deptId,
          status: 'active',
        },
      ];

      for (const s of seededStaff) {
        await this.prisma.staffProfile.create({ data: s });
      }

      staffList = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    }

    // 2. Ensure subjects exist and allocate
    const subjects = await this.prisma.subject.findMany({ where: { tenantId } });
    const allocCount = await this.prisma.facultySubjectAllocation.count({ where: { tenantId } });

    if (allocCount < 3 && subjects.length > 0 && staffList.length > 0) {
      for (let i = 0; i < Math.min(subjects.length, 4); i++) {
        const staff = staffList[i % staffList.length];
        const sub = subjects[i];

        await this.prisma.facultySubjectAllocation.upsert({
          where: {
            tenantId_staffId_subjectId_academicYear: {
              tenantId,
              staffId: staff.id,
              subjectId: sub.id,
              academicYear: '2026-2027',
            },
          },
          create: {
            tenantId,
            staffId: staff.id,
            subjectId: sub.id,
            cohortName: 'B.Tech CSE - Semester 4 (2026)',
            semesterName: 'Semester 4',
            academicYear: '2026-2027',
            isClassTeacher: i === 0,
            status: 'ACTIVE',
          },
          update: {},
        });
      }
    }

    // 3. Ensure Lesson Plans exist
    const lessonPlanCount = await this.prisma.lessonPlan.count({ where: { tenantId } });
    if (lessonPlanCount === 0 && subjects.length > 0 && staffList.length > 0) {
      const primarySubject = subjects[0];
      const primaryStaff = staffList[0];

      const syllabusUnits = [
        {
          unitNumber: 1,
          unitTitle: 'Unit 1: Algorithmic Foundations & Asymptotic Complexity',
          topicTitle: 'Big-O, Big-Omega, Big-Theta notation, Recurrence relations & Master Theorem',
          plannedSessions: 8,
          completedSessions: 8,
          status: 'COMPLETED',
        },
        {
          unitNumber: 2,
          unitTitle: 'Unit 2: Linear Data Structures & Memory Optimization',
          topicTitle: 'Dynamic Arrays, Singly/Doubly Linked Lists, Circular Deques, Memory Pool Management',
          plannedSessions: 10,
          completedSessions: 10,
          status: 'COMPLETED',
        },
        {
          unitNumber: 3,
          unitTitle: 'Unit 3: Hierarchical Trees & Balanced Search Indexes',
          topicTitle: 'Binary Trees, AVL Self-Balancing Rotations, Red-Black Trees, B+ Tree Indexes',
          plannedSessions: 12,
          completedSessions: 7,
          status: 'IN_PROGRESS',
        },
        {
          unitNumber: 4,
          unitTitle: 'Unit 4: Graph Traversals & Network Flow Algorithms',
          topicTitle: 'BFS, DFS, Dijkstra Shortest Path, Bellman-Ford, Kruskal & Prim MST',
          plannedSessions: 10,
          completedSessions: 0,
          status: 'PLANNED',
        },
        {
          unitNumber: 5,
          unitTitle: 'Unit 5: Advanced Dynamic Programming & NP-Completeness',
          topicTitle: '0/1 Knapsack, Longest Common Subsequence, Matrix Chain, P vs NP, Reduction Proofs',
          plannedSessions: 10,
          completedSessions: 0,
          status: 'PLANNED',
        },
      ];

      for (const unit of syllabusUnits) {
        await this.prisma.lessonPlan.create({
          data: {
            tenantId,
            subjectId: primarySubject.id,
            staffId: primaryStaff.id,
            ...unit,
          },
        });
      }
    }

    // 4. Ensure recent Class Sessions exist
    const sessionCount = await this.prisma.classSession.count({ where: { tenantId } });
    if (sessionCount === 0 && subjects.length > 0 && staffList.length > 0) {
      const primarySubject = subjects[0];
      const primaryStaff = staffList[0];
      const students = await this.prisma.studentProfile.findMany({ where: { tenantId }, take: 10 });

      const sampleSessions = [
        {
          periodNumber: 1,
          topicTaught: 'AVL Tree Balancing & Double Rotations Implementation',
          daysAgo: 1,
        },
        {
          periodNumber: 3,
          topicTaught: 'Red-Black Tree Insertion Invariants & Color Flipping',
          daysAgo: 2,
        },
        {
          periodNumber: 2,
          topicTaught: 'Binary Search Tree Deletion & In-Order Predecessors',
          daysAgo: 3,
        },
      ];

      for (const s of sampleSessions) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - s.daysAgo);

        const totalStudents = students.length || 6;
        const presentStudents = Math.max(1, totalStudents - 1);

        const session = await this.prisma.classSession.create({
          data: {
            tenantId,
            staffId: primaryStaff.id,
            subjectId: primarySubject.id,
            cohortName: 'B.Tech CSE - Semester 4 (2026)',
            sessionDate,
            periodNumber: s.periodNumber,
            topicTaught: s.topicTaught,
            totalStudents,
            presentStudents,
            status: 'COMPLETED',
          },
        });

        // Create student period attendances
        for (let idx = 0; idx < students.length; idx++) {
          await this.prisma.periodAttendance.create({
            data: {
              tenantId,
              sessionId: session.id,
              studentId: students[idx].id,
              status: idx === 0 ? 'PRESENT' : (idx === totalStudents - 1 ? 'ABSENT' : 'PRESENT'),
            },
          });
        }
      }
    }

    // 5. Ensure Leave Applications exist
    const leaveCount = await this.prisma.leaveApplication.count({ where: { tenantId } });
    if (leaveCount === 0 && staffList.length > 0) {
      const sampleLeaves = [
        {
          staffId: staffList[0].id,
          leaveType: 'Casual Leave (CL)',
          startDate: new Date('2026-11-25'),
          endDate: new Date('2026-11-26'),
          daysCount: 2,
          reason: 'Attending regional technical education summit',
          status: 'pending',
        },
        {
          staffId: staffList[1]?.id || staffList[0].id,
          leaveType: 'Duty Leave (DL)',
          startDate: new Date('2026-11-18'),
          endDate: new Date('2026-11-20'),
          daysCount: 3,
          reason: 'Keynote Speaker at IEEE International Conference',
          status: 'approved',
          approvedBy: 'Dr. Ramesh Gupta (HOD)',
        },
        {
          staffId: staffList[2]?.id || staffList[0].id,
          leaveType: 'Medical Leave (ML)',
          startDate: new Date('2026-11-10'),
          endDate: new Date('2026-11-11'),
          daysCount: 2,
          reason: 'Viral fever recuperation (Medical certificate submitted)',
          status: 'approved',
          approvedBy: 'Campus Medical Superintendent',
        },
      ];

      for (const l of sampleLeaves) {
        await this.prisma.leaveApplication.create({
          data: {
            tenantId,
            ...l,
          },
        });
      }
    }
  }

  // ========================================================
  // 1. OVERVIEW TELEMETRY & STATS
  // ========================================================
  async getStats(tenantId: string, staffId?: string) {
    await this.ensureSeeded(tenantId);

    const whereAlloc: any = { tenantId };
    const whereSession: any = { tenantId };
    const wherePlan: any = { tenantId };
    const whereLeave: any = { tenantId };

    if (staffId) {
      whereAlloc.staffId = staffId;
      whereSession.staffId = staffId;
      wherePlan.staffId = staffId;
      whereLeave.staffId = staffId;
    }

    const [
      totalAllocations,
      totalSessions,
      lessonPlans,
      pendingLeaves,
      totalStaff,
      defaulters,
      recentSessions,
    ] = await Promise.all([
      this.prisma.facultySubjectAllocation.count({ where: whereAlloc }),
      this.prisma.classSession.count({ where: whereSession }),
      this.prisma.lessonPlan.findMany({ where: wherePlan }),
      this.prisma.leaveApplication.count({ where: { ...whereLeave, status: 'pending' } }),
      this.prisma.staffProfile.count({
        where: {
          tenantId,
          OR: [
            { staffType: { in: ['Faculty', 'FACULTY', 'Teaching', 'TEACHING'] } },
            { designation: { contains: 'Prof', mode: 'insensitive' } },
          ],
        },
      }),
      this.getCohortDefaulters(tenantId),
      this.prisma.classSession.findMany({
        where: whereSession,
        include: {
          staff: true,
          subject: true,
        },
        orderBy: { sessionDate: 'desc' },
        take: 5,
      }),
    ]);

    const plannedSessionsTotal = lessonPlans.reduce((acc, p) => acc + (p.plannedSessions || 0), 0);
    const completedSessionsTotal = lessonPlans.reduce((acc, p) => acc + (p.completedSessions || 0), 0);
    const syllabusDeliveryPct =
      plannedSessionsTotal > 0
        ? Number(((completedSessionsTotal / plannedSessionsTotal) * 100).toFixed(1))
        : 65.5;

    const defaultersCount = defaulters.filter((d) => d.isDefaulter).length;

    return {
      totalAllocations,
      totalSessions,
      completedSessionsTotal,
      plannedSessionsTotal,
      syllabusDeliveryPct,
      pendingLeaves,
      totalFaculty: totalStaff || 4,
      defaultersCount,
      recentSessions,
      timestamp: new Date().toISOString(),
    };
  }

  // ========================================================
  // 1B. DYNAMIC MULTI-ROLE FACULTY PRIVILEGES
  // ========================================================
  async getPrivileges(tenantId: string, emailOrStaffId?: string) {
    await this.ensureSeeded(tenantId);

    let staff = null;
    if (emailOrStaffId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailOrStaffId);
      const orFilters: any[] = [
        { email: { equals: emailOrStaffId, mode: 'insensitive' } },
        { employeeCode: { equals: emailOrStaffId, mode: 'insensitive' } },
      ];
      if (isUUID) {
        orFilters.push({ id: emailOrStaffId });
      }

      staff = await this.prisma.staffProfile.findFirst({
        where: {
          tenantId,
          OR: orFilters,
        },
        include: {
          department: true,
        },
      });
    }

    if (!staff && !emailOrStaffId) {
      staff = await this.prisma.staffProfile.findFirst({
        where: {
          tenantId,
          OR: [
            { staffType: { in: ['Faculty', 'FACULTY', 'Teaching', 'TEACHING'] } },
            { designation: { contains: 'Prof', mode: 'insensitive' } },
          ],
        },
        include: {
          department: true,
        },
      });
    }

    if (!staff) {
      return {
        isFaculty: true,
        isClassTeacher: false,
        isHOD: false,
        designation: 'Faculty Member',
        department: 'Computer Science & Engineering',
        assignedSections: [],
        staff: null,
      };
    }

    // Check if HOD: designation contains HOD/Head or department head
    const designationLower = (staff.designation || '').toLowerCase();
    const isHOD = Boolean(
      designationLower.includes('hod') ||
      designationLower.includes('head') ||
      (staff.department && (staff.department as any).headId === staff.id)
    );

    // Check if Class Teacher on any allocation in this tenant
    const ctAllocations = await this.prisma.facultySubjectAllocation.findMany({
      where: {
        tenantId,
        staffId: staff.id,
        isClassTeacher: true,
      },
      include: {
        subject: true,
      },
    });

    const isClassTeacher = ctAllocations.length > 0;
    const assignedSections = ctAllocations
      .map((a) => a.cohortName || a.sectionId)
      .filter(Boolean) as string[];

    return {
      isFaculty: true,
      isClassTeacher,
      isHOD,
      staffId: staff.id,
      employeeCode: staff.employeeCode,
      name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      email: staff.email,
      designation: staff.designation || 'Assistant Professor',
      department: staff.department?.name || 'Computer Science & Engineering',
      departmentCode: staff.department?.code || 'CSE',
      assignedSections,
    };
  }

  // ========================================================
  // 2. SUBJECT ALLOCATIONS
  // ========================================================
  async findAllocations(tenantId: string, query?: { staffId?: string; subjectId?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (query?.staffId) where.staffId = query.staffId;
    if (query?.subjectId) where.subjectId = query.subjectId;

    return this.prisma.facultySubjectAllocation.findMany({
      where,
      include: {
        staff: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAllocation(tenantId: string, data: any) {
    return this.prisma.facultySubjectAllocation.create({
      data: {
        tenantId,
        staffId: data.staffId,
        subjectId: data.subjectId,
        cohortId: data.cohortId || null,
        sectionId: data.sectionId || null,
        semesterId: data.semesterId || null,
        cohortName: data.cohortName || 'B.Tech CSE - Semester 4',
        semesterName: data.semesterName || 'Semester 4',
        academicYear: data.academicYear || '2026-2027',
        isClassTeacher: Boolean(data.isClassTeacher),
        status: data.status || 'ACTIVE',
      },
      include: {
        staff: true,
        subject: true,
      },
    });
  }

  async deleteAllocation(tenantId: string, id: string) {
    const item = await this.prisma.facultySubjectAllocation.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException('Allocation not found.');

    return this.prisma.facultySubjectAllocation.delete({
      where: { id },
    });
  }

  // ========================================================
  // 3. CLASS SESSIONS & PERIOD ATTENDANCE
  // ========================================================
  async findSessions(tenantId: string, query?: { staffId?: string; subjectId?: string; cohortName?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (query?.staffId) where.staffId = query.staffId;
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.cohortName) where.cohortName = { contains: query.cohortName, mode: 'insensitive' };

    return this.prisma.classSession.findMany({
      where,
      include: {
        staff: true,
        subject: true,
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { sessionDate: 'desc' },
    });
  }

  async getSessionById(tenantId: string, id: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id, tenantId },
      include: {
        staff: true,
        subject: true,
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Class session not found.');
    return session;
  }

  async createSession(tenantId: string, data: any) {
    const attendances = Array.isArray(data.attendances) ? data.attendances : [];
    const presentCount = attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'Present').length;
    const totalCount = attendances.length;

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.classSession.create({
        data: {
          tenantId,
          allocationId: data.allocationId || null,
          staffId: data.staffId,
          subjectId: data.subjectId,
          cohortName: data.cohortName || 'B.Tech CSE - Semester 4',
          sessionDate: data.sessionDate ? new Date(data.sessionDate) : new Date(),
          periodNumber: Number(data.periodNumber) || 1,
          topicTaught: data.topicTaught || 'General Lecture',
          totalStudents: totalCount,
          presentStudents: presentCount,
          status: data.status || 'COMPLETED',
        },
      });

      if (attendances.length > 0) {
        for (const att of attendances) {
          if (att.studentId) {
            await tx.periodAttendance.create({
              data: {
                tenantId,
                sessionId: session.id,
                studentId: att.studentId,
                status: (att.status || 'PRESENT').toUpperCase(),
                remarks: att.remarks || null,
              },
            });
          }
        }
      }

      return tx.classSession.findUnique({
        where: { id: session.id },
        include: {
          staff: true,
          subject: true,
          attendances: {
            include: { student: true },
          },
        },
      });
    });
  }

  // ========================================================
  // 4. CONTINUOUS ASSESSMENTS & MARKS
  // ========================================================
  async findAssessments(tenantId: string, query?: { subjectId?: string; cohortName?: string }) {
    const where: any = { tenantId };
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.cohortName) where.cohortName = { contains: query.cohortName, mode: 'insensitive' };

    return this.prisma.continuousAssessment.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: { marks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAssessment(tenantId: string, data: any) {
    return this.prisma.continuousAssessment.create({
      data: {
        tenantId,
        subjectId: data.subjectId,
        name: data.name,
        cohortName: data.cohortName || 'General',
        examType: data.examType || 'Internal Assessment',
        maxMarks: Number(data.maxMarks) || 25.0,
        weightage: Number(data.weightage) || 20.0,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : new Date(),
        status: data.status || 'ACTIVE',
      },
      include: {
        subject: true,
      },
    });
  }

  async getAssessmentMarks(tenantId: string, assessmentId: string, studentId?: string) {
    const assessment = await this.prisma.continuousAssessment.findFirst({
      where: { id: assessmentId, tenantId },
      include: {
        subject: true,
        marks: {
          where: studentId ? { studentId } : undefined,
          include: {
            student: true,
          },
        },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found.');
    return assessment;
  }

  async saveAssessmentMarks(tenantId: string, assessmentId: string, marks: any[]) {
    const assessment = await this.prisma.continuousAssessment.findFirst({
      where: { id: assessmentId, tenantId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found.');

    const operations = marks.map((m) =>
      this.prisma.continuousAssessmentMark.upsert({
        where: {
          tenantId_assessmentId_studentId: {
            tenantId,
            assessmentId,
            studentId: m.studentId,
          },
        },
        create: {
          tenantId,
          assessmentId,
          studentId: m.studentId,
          score: Number(m.score) || 0,
          remarks: m.remarks || null,
        },
        update: {
          score: Number(m.score) || 0,
          remarks: m.remarks || null,
        },
      }),
    );

    await this.prisma.$transaction(operations);
    return this.getAssessmentMarks(tenantId, assessmentId);
  }

  async deleteAssessment(tenantId: string, id: string) {
    const assessment = await this.prisma.continuousAssessment.findFirst({
      where: { id, tenantId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found.');
    await this.prisma.continuousAssessmentMark.deleteMany({
      where: { assessmentId: id, tenantId },
    });
    await this.prisma.continuousAssessment.delete({ where: { id } });
    return { success: true, message: 'Assessment deleted successfully.' };
  }

  // ========================================================
  // 5. LESSON PLANS / TOPIC DELIVERY
  // ========================================================
  async findLessonPlans(tenantId: string, query?: { subjectId?: string; staffId?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.staffId) where.staffId = query.staffId;

    return this.prisma.lessonPlan.findMany({
      where,
      include: {
        subject: true,
        staff: true,
      },
      orderBy: [{ unitNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createLessonPlan(tenantId: string, data: any) {
    return this.prisma.lessonPlan.create({
      data: {
        tenantId,
        subjectId: data.subjectId,
        staffId: data.staffId,
        unitNumber: Number(data.unitNumber) || 1,
        unitTitle: data.unitTitle || null,
        topicTitle: data.topicTitle,
        plannedSessions: Number(data.plannedSessions) || 1,
        completedSessions: Number(data.completedSessions) || 0,
        status: data.status || 'PLANNED',
      },
      include: {
        subject: true,
        staff: true,
      },
    });
  }

  async updateLessonPlan(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.lessonPlan.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Lesson plan not found.');

    return this.prisma.lessonPlan.update({
      where: { id },
      data: {
        completedSessions: data.completedSessions !== undefined ? Number(data.completedSessions) : existing.completedSessions,
        status: data.status || existing.status,
        completionDate: data.status === 'COMPLETED' ? new Date() : existing.completionDate,
      },
      include: {
        subject: true,
        staff: true,
      },
    });
  }

  async deleteLessonPlan(tenantId: string, id: string) {
    const existing = await this.prisma.lessonPlan.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Lesson plan not found.');

    return this.prisma.lessonPlan.delete({
      where: { id },
    });
  }

  // ========================================================
  // 6. CLASS TEACHER MONITOR & DEFAULTERS
  // ========================================================
  async getCohortDefaulters(tenantId: string, cohortName?: string) {
    const whereStudent: any = { tenantId };
    if (cohortName && cohortName !== 'all') {
      whereStudent.cohort = {
        name: { contains: cohortName, mode: 'insensitive' },
      };
    }

    const students = await this.prisma.studentProfile.findMany({
      where: whereStudent,
      include: {
        periodAttendances: true,
        continuousAssessmentMarks: {
          include: {
            assessment: {
              include: { subject: true },
            },
          },
        },
      },
      take: 50,
    });

    return students.map((s) => {
      const totalAtt = s.periodAttendances.length;
      const presentAtt = s.periodAttendances.filter((a) => a.status === 'PRESENT').length;
      const attendancePct = totalAtt > 0 ? Number(((presentAtt / totalAtt) * 100).toFixed(1)) : 88.0;

      const scores: Record<string, number> = {};
      s.continuousAssessmentMarks.forEach((m) => {
        const subCode = m.assessment?.subject?.code || 'SUB';
        scores[subCode] = Number(m.score);
      });

      return {
        id: s.id,
        roll_number: s.rollNumber,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        email: s.email,
        attendance_pct: attendancePct,
        present: presentAtt,
        total: totalAtt,
        isDefaulter: attendancePct < 75.0,
        scores,
      };
    });
  }

  // ========================================================
  // 7. FACULTY TIMETABLE
  // ========================================================
  async getTimetable(tenantId: string, query?: { staffId?: string; day?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (query?.staffId) where.staffId = query.staffId;
    if (query?.day && query.day !== 'All') where.day = query.day;

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        period: true,
        subject: true,
        cohort: true,
        section: true,
        staff: true,
      },
      orderBy: [{ day: 'asc' }, { period: { periodNumber: 'asc' } }],
    });

    return slots.map((s) => ({
      id: s.id,
      day: s.day,
      periodNumber: s.period.periodNumber,
      time: `${s.period.startTime} - ${s.period.endTime}`,
      period_name: s.period.name,
      room: s.room || 'LH-101',
      subject_code: s.subject.code,
      subject_name: s.subject.name,
      cohort_name: s.cohort?.name || '',
      staff_name: s.staff ? `${s.staff.firstName} ${s.staff.lastName || ''}`.trim() : 'Faculty',
    }));
  }

  // ========================================================
  // 8. FACULTY LEAVES
  // ========================================================
  async findLeaves(tenantId: string, query?: { staffId?: string; status?: string; search?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = { tenantId };
    if (query?.staffId) where.staffId = query.staffId;
    if (query?.status && query.status !== 'All') where.status = query.status.toLowerCase();

    const leaves = await this.prisma.leaveApplication.findMany({
      where,
      include: {
        staff: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leaves.map((l) => ({
      id: l.id,
      full_name: `${l.staff.firstName} ${l.staff.lastName || ''}`.trim(),
      employee_code: l.staff.employeeCode,
      department: l.staff.department?.name || 'Computer Science & Engineering',
      leave_type: l.leaveType,
      start_date: l.startDate.toISOString().split('T')[0],
      end_date: l.endDate.toISOString().split('T')[0],
      days: l.daysCount,
      reason: l.reason,
      status: l.status.charAt(0).toUpperCase() + l.status.slice(1),
      remarks: l.approvedBy || (l.status === 'pending' ? 'Awaiting HOD approval' : 'Processed'),
      createdAt: l.createdAt,
    }));
  }

  async applyLeave(tenantId: string, data: any) {
    let staffId = data.staffId;
    if (!staffId) {
      const firstStaff = await this.prisma.staffProfile.findFirst({ where: { tenantId } });
      staffId = firstStaff?.id;
    }

    const start = new Date(data.start_date || data.startDate || new Date());
    const end = new Date(data.end_date || data.endDate || start);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const daysCount = Number(data.days) || Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    return this.prisma.leaveApplication.create({
      data: {
        tenantId,
        staffId,
        leaveType: data.leave_type || data.leaveType || 'Casual Leave (CL)',
        startDate: start,
        endDate: end,
        daysCount,
        reason: data.reason || 'Personal reasons',
        status: data.status || 'pending',
        approvedBy: data.approvedBy || null,
      },
      include: {
        staff: true,
      },
    });
  }

  async updateLeaveStatus(tenantId: string, id: string, status: string, approvedBy?: string) {
    const leave = await this.prisma.leaveApplication.findFirst({
      where: { id, tenantId },
    });
    if (!leave) throw new NotFoundException('Leave application not found.');

    return this.prisma.leaveApplication.update({
      where: { id },
      data: {
        status: status.toLowerCase(),
        approvedBy: approvedBy || 'Dr. Ramesh Gupta (HOD)',
      },
      include: {
        staff: true,
      },
    });
  }

  async deleteLeave(tenantId: string, id: string) {
    const leave = await this.prisma.leaveApplication.findFirst({
      where: { id, tenantId },
    });
    if (!leave) throw new NotFoundException('Leave application not found.');

    return this.prisma.leaveApplication.delete({
      where: { id },
    });
  }

  // ========================================================
  // 9. FACULTY PROFILES & DIRECTORY
  // ========================================================
  async findProfiles(tenantId: string, query?: { departmentId?: string; search?: string }) {
    await this.ensureSeeded(tenantId);

    const where: any = {
      tenantId,
      OR: [
        { staffType: { in: ['Faculty', 'FACULTY', 'Teaching', 'TEACHING'] } },
        { designation: { contains: 'Prof', mode: 'insensitive' } },
        { designation: { contains: 'Lecturer', mode: 'insensitive' } },
        { designation: { contains: 'Director', mode: 'insensitive' } },
      ],
    };
    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.search) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { employeeCode: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const profiles = await this.prisma.staffProfile.findMany({
      where,
      include: {
        department: true,
        facultySubjectAllocations: {
          include: { subject: true },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    return profiles.map((p) => ({
      id: p.id,
      code: p.employeeCode,
      name: `${p.firstName} ${p.lastName || ''}`.trim(),
      email: p.email,
      phone: p.phone || '+91 98450 00000',
      designation: p.designation,
      department: p.department?.name || 'Computer Science & Engineering',
      departmentId: p.departmentId,
      qualification: p.qualification || 'M.Tech / Ph.D.',
      experienceYears: p.experienceYears,
      status: p.status === 'active' ? 'Active' : 'On Leave',
      allocatedCourses: p.facultySubjectAllocations.map((a) => a.subject.code),
      joiningDate: p.joiningDate ? p.joiningDate.toISOString().split('T')[0] : '2023-08-01',
    }));
  }

  async createProfile(tenantId: string, data: any) {
    const nameParts = (data.name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Prof.';
    const lastName = nameParts.slice(1).join(' ') || '';

    return this.prisma.staffProfile.create({
      data: {
        tenantId,
        employeeCode: data.code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName,
        lastName,
        email: data.email || `${firstName.toLowerCase()}@unilms.edu`,
        phone: data.phone || null,
        designation: data.designation || 'Assistant Professor',
        staffType: 'Teaching',
        departmentId: data.departmentId || null,
        qualification: data.qualification || 'M.Tech',
        experienceYears: Number(data.experienceYears) || 3,
        status: (data.status || 'Active').toLowerCase(),
      },
    });
  }

  async updateProfile(tenantId: string, id: string, data: any) {
    const profile = await this.prisma.staffProfile.findFirst({
      where: { id, tenantId },
    });
    if (!profile) throw new NotFoundException('Profile not found.');

    const nameParts = data.name ? data.name.trim().split(' ') : null;

    return this.prisma.staffProfile.update({
      where: { id },
      data: {
        firstName: nameParts ? nameParts[0] : profile.firstName,
        lastName: nameParts ? nameParts.slice(1).join(' ') : profile.lastName,
        email: data.email || profile.email,
        phone: data.phone !== undefined ? data.phone : profile.phone,
        designation: data.designation || profile.designation,
        qualification: data.qualification || profile.qualification,
        experienceYears: data.experienceYears !== undefined ? Number(data.experienceYears) : profile.experienceYears,
        status: data.status ? data.status.toLowerCase() : profile.status,
      },
    });
  }

  async deleteProfile(tenantId: string, id: string) {
    const profile = await this.prisma.staffProfile.findFirst({
      where: { id, tenantId },
    });
    if (!profile) throw new NotFoundException('Profile not found.');

    return this.prisma.staffProfile.delete({
      where: { id },
    });
  }
}
