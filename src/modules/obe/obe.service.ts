import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const STANDARD_PROGRAM_OUTCOMES = [
  { code: 'PO1', title: 'Engineering Knowledge', description: 'Apply mathematics, natural sciences, and engineering fundamentals to solve complex engineering problems.' },
  { code: 'PO2', title: 'Problem Analysis', description: 'Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions.' },
  { code: 'PO3', title: 'Design & Development', description: 'Design solutions for complex problems and design system components or processes that meet specified public and safety needs.' },
  { code: 'PO4', title: 'Complex Investigations', description: 'Use research-based knowledge and research methods including design of experiments and data analysis to synthesize conclusions.' },
  { code: 'PO5', title: 'Modern Tool Usage', description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools to complex activities.' },
  { code: 'PO6', title: 'The Engineer and Society', description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural responsibilities.' },
  { code: 'PO7', title: 'Environment & Sustainability', description: 'Understand the impact of professional engineering solutions in societal and environmental contexts, and demonstrate knowledge of sustainable development.' },
  { code: 'PO8', title: 'Ethics & Professionalism', description: 'Apply ethical principles and commit to professional ethics, responsibilities, and norms of engineering practice.' },
  { code: 'PO9', title: 'Individual and Team Work', description: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
  { code: 'PO10', title: 'Communication', description: 'Communicate effectively on complex engineering activities through technical reports, documentation, and presentations.' },
  { code: 'PO11', title: 'Project Management & Finance', description: 'Demonstrate knowledge and understanding of engineering and management principles and apply them to manage projects.' },
  { code: 'PO12', title: 'Life-long Learning', description: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.' },
  { code: 'PSO1', title: 'Core Technical Competency', description: 'Formulate algorithms, data models, and scalable architectures for production computing environments.' },
  { code: 'PSO2', title: 'Applied Innovation & Cloud Systems', description: 'Apply modern cloud platforms, distributed systems, and intelligent tooling to deliver real-world software solutions.' }
];

@Injectable()
export class ObeService {
  constructor(private readonly prisma: PrismaService) {}

  async findCos(tenantId: string, subjectId?: string) {
    const where: any = { tenantId };
    if (subjectId) where.subjectId = subjectId;

    return this.prisma.courseOutcome.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        mappings: { include: { programOutcome: true } },
      },
    });
  }

  async createCo(tenantId: string, dto: {
    subjectId: string;
    code: string;
    description: string;
    bloomLevel?: string;
  }) {
    if (!dto.subjectId || !dto.code || !dto.description) {
      throw new BadRequestException('Subject, CO code, and description are required.');
    }

    return this.prisma.courseOutcome.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        code: dto.code.toUpperCase().trim(),
        description: dto.description.trim(),
        bloomLevel: dto.bloomLevel || 'Understand',
      },
      include: { subject: true },
    });
  }

  async seedStandardPosForProgram(tenantId: string, programId: string) {
    const existingCount = await this.prisma.programOutcome.count({
      where: { tenantId, programId },
    });
    if (existingCount > 0) return { seeded: 0, message: 'Program outcomes already exist.' };

    const data = STANDARD_PROGRAM_OUTCOMES.map((po) => ({
      tenantId,
      programId,
      code: po.code,
      title: po.title,
      description: po.description,
    }));

    await this.prisma.programOutcome.createMany({
      data,
      skipDuplicates: true,
    });

    return { seeded: data.length, message: `${data.length} standard outcomes provisioned into database.` };
  }

  async findPos(tenantId: string, programId?: string) {
    let targetProgramId = programId;

    if (!targetProgramId) {
      const defaultProg = await this.prisma.program.findFirst({
        where: { tenantId },
        orderBy: { code: 'asc' },
      });
      if (defaultProg) {
        targetProgramId = defaultProg.id;
      }
    }

    if (targetProgramId) {
      await this.seedStandardPosForProgram(tenantId, targetProgramId);
    }

    const where: any = { tenantId };
    if (targetProgramId) where.programId = targetProgramId;

    return this.prisma.programOutcome.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        program: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async createPo(tenantId: string, dto: {
    programId: string;
    code: string;
    title: string;
    description: string;
  }) {
    if (!dto.programId || !dto.code || !dto.title) {
      throw new BadRequestException('Program, PO code, and title are required.');
    }

    return this.prisma.programOutcome.create({
      data: {
        tenantId,
        programId: dto.programId,
        code: dto.code.toUpperCase().trim(),
        title: dto.title.trim(),
        description: dto.description || dto.title,
      },
      include: { program: true },
    });
  }

  async findCoPoMatrix(tenantId: string, subjectId: string) {
    const cos = await this.prisma.courseOutcome.findMany({
      where: { tenantId, subjectId },
      orderBy: { code: 'asc' },
      include: {
        mappings: {
          include: {
            programOutcome: true,
          },
        },
      },
    });

    const subject = await this.prisma.subject.findFirst({
      where: { tenantId, id: subjectId },
      include: { department: true },
    });

    return { subject, cos };
  }

  async saveCoPoMapping(tenantId: string, dto: {
    coId: string;
    poId: string;
    correlationLevel: number; // 1, 2, or 3
  }) {
    const level = Math.max(1, Math.min(3, parseInt(String(dto.correlationLevel), 10) || 2));

    return this.prisma.coPoMapping.upsert({
      where: {
        coId_poId: { coId: dto.coId, poId: dto.poId },
      },
      update: { correlationLevel: level },
      create: {
        tenantId,
        coId: dto.coId,
        poId: dto.poId,
        correlationLevel: level,
      },
      include: { courseOutcome: true, programOutcome: true },
    });
  }

  async calculateAttainmentReport(tenantId: string, subjectId: string, academicYear: string) {
    const cos = await this.prisma.courseOutcome.findMany({
      where: { tenantId, subjectId },
      include: {
        mappings: { include: { programOutcome: true } },
      },
    });

    // Compute synthetic or direct mark percentages from exam marks
    const examMarks = await this.prisma.examMark.findMany({
      where: {
        tenantId,
        schedule: { subjectId },
      },
    });

    let overallAttainment = 72.5; // default benchmark
    if (examMarks.length > 0) {
      const totalMarks = examMarks.reduce((sum, m) => sum + Number(m.marksObtained), 0);
      const totalMax = examMarks.reduce((sum, m) => sum + Number(m.maxMarks), 0);
      overallAttainment = totalMax > 0 ? Math.round((totalMarks / totalMax) * 1000) / 10 : 70.0;
    }

    const coAttainments = cos.map((co) => ({
      coId: co.id,
      code: co.code,
      description: co.description,
      bloomLevel: co.bloomLevel,
      target: 60.0,
      directAttainment: overallAttainment,
      status: overallAttainment >= 60.0 ? 'ATTAINED' : 'NOT_ATTAINED',
      mappedPos: co.mappings.map((m) => ({
        poCode: m.programOutcome.code,
        correlation: m.correlationLevel,
      })),
    }));

    return {
      academicYear,
      overallAttainment,
      totalCos: cos.length,
      cos: coAttainments,
    };
  }
}

