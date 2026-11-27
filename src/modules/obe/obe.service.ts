import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const STANDARD_ENGINEERING_OUTCOMES = [
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

export const STANDARD_MANAGEMENT_OUTCOMES = [
  { code: 'PO1', title: 'Business Domain Knowledge', description: 'Apply fundamental concepts, principles, and theories of management, economics, finance, marketing, and organizational dynamics to solve enterprise challenges.' },
  { code: 'PO2', title: 'Critical Thinking & Business Analytics', description: 'Evaluate complex business scenarios and formulate data-driven decisions using quantitative methods, business intelligence, and analytical acumen.' },
  { code: 'PO3', title: 'Leadership & Team Dynamics', description: 'Demonstrate collaborative competencies, emotional intelligence, and leadership agility in managing multi-disciplinary and culturally diverse teams.' },
  { code: 'PO4', title: 'Strategic & Global Perspective', description: 'Analyze changing socio-economic environments and formulate competitive business strategies across domestic and international markets.' },
  { code: 'PO5', title: 'Business Communication & Negotiation', description: 'Communicate complex managerial concepts persuasively through professional corporate reports, executive presentations, and cross-functional negotiations.' },
  { code: 'PO6', title: 'Ethics, Governance & CSR', description: 'Practice ethical decision-making, adhere to corporate governance principles, and champion social responsibility and environmental sustainability in business.' },
  { code: 'PO7', title: 'Innovation & Entrepreneurship', description: 'Identify emerging market opportunities, conceptualize scalable business models, and foster corporate intrapreneurship and new venture creation.' },
  { code: 'PO8', title: 'Life-long Learning & Executive Agility', description: 'Commit to continuous professional development, executive learning, and adaptability in rapidly evolving global industry landscapes.' },
  { code: 'PSO1', title: 'Financial & Strategic Acumen', description: 'Formulate capital budgeting decisions, corporate valuations, investment portfolios, risk hedges, and regulatory compliance strategies.' },
  { code: 'PSO2', title: 'Digital Transformation & Supply Chain Operations', description: 'Leverage enterprise cloud ecosystems (ERP/CRM), digital marketing, and lean logistics to optimize end-to-end organizational operations.' }
];

export const STANDARD_PHARMACY_OUTCOMES = [
  { code: 'PO1', title: 'Pharmacy Knowledge', description: 'Possess knowledge and comprehension of core pharmaceutical sciences, pharmacology, medicinal chemistry, and pharmaceutics.' },
  { code: 'PO2', title: 'Planning Abilities & Formulation Design', description: 'Design, formulate, and manufacture drug delivery systems meeting quality and regulatory specifications.' },
  { code: 'PO3', title: 'Problem Analysis', description: 'Utilize analytical thinking to evaluate dosage calculations, drug incompatibilities, and drug interactions.' },
  { code: 'PO4', title: 'Modern Tool Usage', description: 'Select and apply modern analytical instrumentation (HPLC, GC-MS, spectroscopy) for pharmaceutical quality testing.' },
  { code: 'PO5', title: 'Leadership & Teamwork', description: 'Demonstrate team leadership in pharmacy operations, clinical trial teams, and industrial production units.' },
  { code: 'PO6', title: 'Professional Identity', description: 'Understand, analyze, and communicate the value of the pharmacy profession in healthcare delivery systems.' },
  { code: 'PO7', title: 'Pharmaceutical Ethics', description: 'Honor human dignity and apply ethical principles in dispensing, clinical research, and pharmacy practice.' },
  { code: 'PO8', title: 'Communication Skills', description: 'Counsel patients and liaise with healthcare professionals regarding drug regimens and therapeutic outcomes.' },
  { code: 'PO9', title: 'The Pharmacist and Society', description: 'Apply contextual reasoning to assess public health issues, pharmacovigilance, and patient safety.' },
  { code: 'PO10', title: 'Environment & Sustainability', description: 'Understand the impact of pharmaceutical manufacturing waste and practice green chemistry principles.' },
  { code: 'PO11', title: 'Life-long Learning', description: 'Keep abreast of advances in clinical therapeutics, biopharmaceutics, and global regulatory compliance.' },
  { code: 'PSO1', title: 'Hospital & Clinical Pharmacy Care', description: 'Deliver evidence-based clinical pharmacy care, pharmacotherapy reviews, and therapeutic drug monitoring.' },
  { code: 'PSO2', title: 'Drug Regulatory Affairs & Industrial QC', description: 'Prepare regulatory dossiers (CTD/eCTD) and oversee cGMP compliance in industrial formulation units.' }
];

export const STANDARD_GENERAL_OUTCOMES = [
  { code: 'PO1', title: 'Disciplinary Knowledge', description: 'Demonstrate comprehensive knowledge and coherent understanding of the chosen academic discipline.' },
  { code: 'PO2', title: 'Critical Thinking & Inquiry', description: 'Apply critical evaluation, rational skepticism, and evidence-based argument to complex issues.' },
  { code: 'PO3', title: 'Analytical & Quantitative Reasoning', description: 'Interpret empirical data, scientific literature, and quantitative trends to substantiate conclusions.' },
  { code: 'PO4', title: 'Digital Literacy & Communication', description: 'Present complex information effectively across digital media, formal reports, and public discourse.' },
  { code: 'PO5', title: 'Ethics & Social Values', description: 'Uphold integrity, cultural empathy, and civic responsibility in scholarly and community endeavors.' },
  { code: 'PO6', title: 'Self-Directed & Life-long Learning', description: 'Demonstrate the capacity for independent research and lifelong intellectual development.' },
  { code: 'PSO1', title: 'Applied Domain Investigation', description: 'Execute rigorous domain-specific research methodologies to address societal and market needs.' },
  { code: 'PSO2', title: 'Professional Practical Skill', description: 'Apply practical skills, specialized software, and professional practices for career readiness.' }
];

export const STANDARD_PROGRAM_OUTCOMES = STANDARD_ENGINEERING_OUTCOMES;

export function getStandardOutcomesForProgram(program?: {
  code?: string;
  name?: string;
  type?: string;
  department?: { code?: string; name?: string };
}) {
  if (!program) return STANDARD_ENGINEERING_OUTCOMES;
  const text = `${program.code || ''} ${program.name || ''} ${program.type || ''} ${program.department?.name || ''} ${program.department?.code || ''}`.toUpperCase();

  if (text.includes('MBA') || text.includes('PGDM') || text.includes('MANAGEMENT') || text.includes('BBA') || text.includes('BUSINESS')) {
    return STANDARD_MANAGEMENT_OUTCOMES;
  }
  if (text.includes('PHARM') || text.includes('PHARMA') || text.includes('CLINICAL PHARM')) {
    return STANDARD_PHARMACY_OUTCOMES;
  }
  if (text.includes('B.COM') || text.includes('BCOM') || text.includes('M.COM') || text.includes('MCOM') || text.includes('B.A') || text.includes('ARTS') || text.includes('COMMERCE')) {
    return STANDARD_GENERAL_OUTCOMES;
  }
  return STANDARD_ENGINEERING_OUTCOMES;
}

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

  async seedStandardPosForProgram(tenantId: string, programId: string, force: boolean = false) {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, tenantId },
      include: { department: true },
    });
    if (!program) return { seeded: 0, message: 'Program not found in this institution.' };

    const existingCount = await this.prisma.programOutcome.count({
      where: { tenantId, programId },
    });
    if (existingCount > 0 && !force) return { seeded: 0, message: 'Program outcomes already exist.' };

    if (force && existingCount > 0) {
      await this.prisma.programOutcome.deleteMany({
        where: { tenantId, programId },
      });
    }

    const template = getStandardOutcomesForProgram(program);
    const data = template.map((po) => ({
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

    return { seeded: data.length, message: `${data.length} standard accredited outcomes provisioned for ${program.name}.` };
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
      const prog = await this.prisma.program.findFirst({
        where: { id: targetProgramId, tenantId },
        include: { department: true },
      });
      if (prog) {
        const isManagement = /MBA|PGDM|MANAGEMENT|BBA|BUSINESS/i.test(`${prog.code} ${prog.name} ${prog.department?.name || ''}`);
        if (isManagement) {
          const hasEngineeringSeed = await this.prisma.programOutcome.findFirst({
            where: { tenantId, programId: targetProgramId, title: 'Engineering Knowledge' },
          });
          if (hasEngineeringSeed) {
            await this.seedStandardPosForProgram(tenantId, targetProgramId, true);
          }
        }
      }
      await this.seedStandardPosForProgram(tenantId, targetProgramId);
    }

    const where: any = { tenantId };
    if (targetProgramId) where.programId = targetProgramId;

    const outcomes = await this.prisma.programOutcome.findMany({
      where,
      include: {
        program: { select: { id: true, name: true, code: true } },
      },
    });

    return outcomes.map(o => ({
      ...o,
      type: o.code.toUpperCase().startsWith('PSO') ? 'PSO' : 'PO'
    })).sort((a, b) => {
      const aPrefix = a.code.toUpperCase().startsWith('PSO') ? 'PSO' : 'PO';
      const bPrefix = b.code.toUpperCase().startsWith('PSO') ? 'PSO' : 'PO';
      if (aPrefix !== bPrefix) return aPrefix === 'PO' ? -1 : 1;
      const aNum = parseInt(a.code.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.code.replace(/\D/g, ''), 10) || 0;
      return aNum - bNum;
    });
  }

  async createPo(tenantId: string, dto: {
    programId: string;
    code: string;
    title?: string;
    description: string;
  }) {
    if (!dto.programId || !dto.code) {
      throw new BadRequestException('Program and PO code are required.');
    }

    return this.prisma.programOutcome.create({
      data: {
        tenantId,
        programId: dto.programId,
        code: dto.code.toUpperCase().trim(),
        title: (dto.title || dto.description || dto.code).slice(0, 255),
        description: dto.description || dto.title || dto.code,
      },
      include: { program: true },
    });
  }

  async updatePo(tenantId: string, id: string, dto: {
    code?: string;
    title?: string;
    description?: string;
  }) {
    const existing = await this.prisma.programOutcome.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Program outcome not found in this institution.');

    return this.prisma.programOutcome.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        title: dto.title ? dto.title.trim() : (dto.code ? dto.code.toUpperCase().trim() : undefined),
        description: dto.description ? dto.description.trim() : undefined,
      },
      include: { program: true },
    });
  }

  async deletePo(tenantId: string, id: string) {
    const existing = await this.prisma.programOutcome.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Program outcome not found in this institution.');

    await this.prisma.programOutcome.delete({ where: { id } });
    return { success: true, message: `Program outcome ${existing.code} deleted successfully.` };
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

