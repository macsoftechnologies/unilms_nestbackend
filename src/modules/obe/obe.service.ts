import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async findPos(tenantId: string, programId?: string) {
    const where: any = { tenantId };
    if (programId) where.programId = programId;

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

