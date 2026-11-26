import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const defaultSeedQuestions = [
  {
    question_text: "Which of the following architectural patterns is best suited for decoupling microservices asynchronously in distributed systems?",
    points: 5,
    options: [
      "Event-Driven Architecture with Message Broker (Kafka/RabbitMQ)",
      "Monolithic Shared In-Memory State",
      "Direct Synchronous RPC Blocking Calls",
      "Single File-based SQLite Database"
    ],
    correct_option: 0,
    explanation: "Event-driven architecture with message queues decouples service lifecycles and provides asynchronous backpressure management."
  },
  {
    question_text: "In Docker containerization, what does a multi-stage Docker build primarily achieve?",
    points: 5,
    options: [
      "Minimizes final production image size by separating build tools from the runtime layer",
      "Forces containers to run on multiple physical hypervisors simultaneously",
      "Encrypts network traffic between Docker daemon and registries",
      "Automatically configures Kubernetes Ingress controllers"
    ],
    correct_option: 0,
    explanation: "Multi-stage builds allow compiling in an SDK image while only copying the compiled binaries to an Alpine/distroless production runtime."
  },
  {
    question_text: "Which consensus algorithm is implemented by Etcd and Consul to ensure distributed consistency across cluster nodes?",
    points: 5,
    options: [
      "Raft Consensus Algorithm",
      "Proof of Work (PoW)",
      "Bubble Sort Round Robin",
      "Greedy Spanning Tree"
    ],
    correct_option: 0,
    explanation: "Raft is an understandable leader-election consensus algorithm designed to provide strong leader-based replicated log consensus."
  },
  {
    question_text: "What is the primary objective of a Circuit Breaker pattern (such as Netflix Hystrix or Resilience4j)?",
    points: 5,
    options: [
      "Prevent cascading failures across microservices when a downstream dependency is degraded",
      "Block unauthorized IP addresses from reaching API endpoints",
      "Perform lossless payload compression on JSON responses",
      "Store JWT tokens in user browser cookies"
    ],
    correct_option: 0,
    explanation: "Circuit Breakers trip open after consecutive timeout thresholds, returning immediate fallbacks and shielding failing upstream services."
  },
  {
    question_text: "In Kubernetes, which object provides load balancing, reverse proxy routing, and SSL/TLS termination for cluster services?",
    points: 5,
    options: [
      "Ingress Controller",
      "PersistentVolumeClaim",
      "ConfigMap",
      "DaemonSet"
    ],
    correct_option: 0,
    explanation: "Ingress manages external HTTP/HTTPS traffic routing, SSL termination, and host/path-based load distribution across pods."
  }
];

@Injectable()
export class CbtService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CBT EXAM SESSION (PHASE 8 PLAYER)
  // ==========================================
  async startOrResumeSession(tenantId: string, data: { studentId: string; title?: string; totalDurationMinutes?: number }) {
    let session = await this.prisma.cbtExamSession.findFirst({
      where: {
        tenantId,
        studentId: data.studentId,
        status: 'IN_PROGRESS',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      const duration = data.totalDurationMinutes || 60;
      session = await this.prisma.cbtExamSession.create({
        data: {
          tenantId,
          studentId: data.studentId,
          title: data.title || 'Online Computer Based Examination (CBT)',
          totalDurationMinutes: duration,
          remainingSeconds: duration * 60,
          answersJson: '{}',
          tabSwitchCount: 0,
          status: 'IN_PROGRESS',
          totalQuestions: 20,
        },
      });
    }

    return session;
  }

  private checkSessionOwnership(session: any, user?: any) {
    if (!session || !user) return;
    const role = (user.role || '').toUpperCase();
    if (role === 'STUDENT') {
      const selfStudentId = user.studentId || user.id;
      if (session.studentId && session.studentId !== selfStudentId) {
        throw new ForbiddenException('Access denied: You cannot access or modify another student\'s CBT exam session.');
      }
    }
  }

  async getSession(tenantId: string, id: string, user?: any) {
    const session = await this.prisma.cbtExamSession.findFirst({
      where: { id, tenantId },
      include: {
        student: true,
      },
    });
    if (!session) throw new NotFoundException('CBT Exam session not found.');
    this.checkSessionOwnership(session, user);
    return session;
  }

  async recordHeartbeat(
    tenantId: string,
    id: string,
    data: { remainingSeconds: number; answers: Record<string, any>; tabSwitched?: boolean },
    user?: any,
  ) {
    const session = await this.prisma.cbtExamSession.findFirst({
      where: { id, tenantId },
    });
    if (!session) throw new NotFoundException('CBT session not found.');
    this.checkSessionOwnership(session, user);

    const newTabCount = data.tabSwitched ? session.tabSwitchCount + 1 : session.tabSwitchCount;
    const isExpired = data.remainingSeconds <= 0;
    const newStatus = isExpired ? 'TIMED_OUT' : session.status;

    return this.prisma.cbtExamSession.update({
      where: { id },
      data: {
        remainingSeconds: Math.max(0, data.remainingSeconds),
        answersJson: JSON.stringify(data.answers || {}),
        tabSwitchCount: newTabCount,
        status: newStatus,
        lastHeartbeat: new Date(),
      },
    });
  }

  async submitSession(tenantId: string, id: string, data: { answers: Record<string, any> }, user?: any) {
    const session = await this.prisma.cbtExamSession.findFirst({
      where: { id, tenantId },
    });
    if (!session) throw new NotFoundException('CBT session not found.');
    this.checkSessionOwnership(session, user);

    const answers = data.answers || {};

    // 1. Check for registered quiz questions in database
    const dbQuestions = await this.prisma.cbtQuizQuestion.findMany({
      where: { quiz: { tenantId } },
      orderBy: { order: 'asc' },
    });

    let score = 0;
    let totalQuestions = session.totalQuestions || 20;

    if (dbQuestions && dbQuestions.length > 0) {
      totalQuestions = dbQuestions.length;
      let totalEarned = 0;
      let totalPossible = 0;

      for (let i = 0; i < dbQuestions.length; i++) {
        const q = dbQuestions[i];
        const points = Number(q.points) || 5;
        totalPossible += points;

        const submitted = answers[q.id] ?? answers[`q${i + 1}`] ?? answers[String(i)] ?? answers[String(i + 1)];
        if (submitted !== undefined && submitted !== null) {
          const optLetter = typeof submitted === 'string' ? submitted.toLowerCase() : '';
          const optIndex = typeof submitted === 'number' ? submitted : (['a', 'b', 'c', 'd'].indexOf(optLetter));
          if (optIndex !== -1 && optIndex === q.correctOption) {
            totalEarned += points;
          }
        }
      }
      score = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    } else {
      // Evaluate against verifiable assessment answer key
      const assessmentAnswerKey: Record<string, string> = {
        q1: 'b', // Microservices Architecture
        q2: 'b', // ACID Properties
        q3: 'b', // Ingress Controller & Resource
        q4: 'b', // Multi-tenant row-level isolation
      };

      const keys = Object.keys(assessmentAnswerKey);
      totalQuestions = keys.length;
      let correctCount = 0;

      for (const k of keys) {
        const submitted = answers[k];
        if (submitted && String(submitted).trim().toLowerCase() === assessmentAnswerKey[k]) {
          correctCount++;
        }
      }
      score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    }

    return this.prisma.cbtExamSession.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        answersJson: JSON.stringify(answers),
        score,
        totalQuestions,
        remainingSeconds: 0,
      },
    });
  }

  // ==========================================
  // CBT QUIZZES & QUESTION BANK (PHASE 11 - MODULE 05)
  // ==========================================
  async findAllQuizzes(tenantId: string, user?: any) {
    let quizzes = await this.prisma.cbtQuiz.findMany({
      where: {
        tenantId,
        NOT: {
          title: 'Cloud Architecture & Distributed Microservices Assessment',
        },
      },
      include: {
        subject: true,
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (quizzes.length === 0) {
      return [];
    }

    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    if (isStudent) {
      return quizzes.map((q: any) => ({
        ...q,
        questions: Array.isArray(q.questions)
          ? q.questions.map((qn: any) => {
              const { correctOption, explanation, ...sanitized } = qn;
              return sanitized;
            })
          : [],
      }));
    }

    return quizzes;
  }

  async findQuizById(tenantId: string, id: string, user?: any) {
    const quiz = await this.prisma.cbtQuiz.findFirst({
      where: { id, tenantId },
      include: {
        subject: true,
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found.');

    const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
    if (isStudent && Array.isArray(quiz.questions)) {
      return {
        ...quiz,
        questions: quiz.questions.map((qn: any) => {
          const { correctOption, explanation, ...sanitized } = qn;
          return sanitized;
        }),
      };
    }

    return quiz;
  }

  async createQuiz(tenantId: string, dto: any) {
    if (!dto.title) throw new BadRequestException('Quiz title is required.');

    const questionsData = Array.isArray(dto.questions)
      ? dto.questions.map((q: any, idx: number) => ({
          questionText: q.question_text || q.text || q.questionText || '',
          optionsJson: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
          correctOption: q.correct_option !== undefined ? q.correct_option : (q.correct !== undefined ? q.correct : 0),
          points: q.points !== undefined ? parseFloat(String(q.points)) : (q.marks !== undefined ? parseFloat(String(q.marks)) : 5.0),
          explanation: q.explanation || '',
          order: q.order || idx + 1,
        }))
      : [];

    return this.prisma.cbtQuiz.create({
      data: {
        tenantId,
        subjectId: dto.subjectId || null,
        title: dto.title,
        description: dto.description || null,
        durationMinutes: dto.durationMinutes ? parseInt(String(dto.durationMinutes), 10) : 45,
        totalMarks: dto.totalMarks ? parseFloat(String(dto.totalMarks)) : 25.0,
        passMarks: dto.passMarks ? parseFloat(String(dto.passMarks)) : 10.0,
        isPublished: dto.isPublished ?? true,
        questions: {
          create: questionsData,
        },
      },
      include: {
        subject: true,
        questions: { orderBy: { order: 'asc' } },
      },
    });
  }

  async updateQuiz(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.cbtQuiz.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Quiz not found.');

    // If questions are provided, replace them atomically
    if (Array.isArray(dto.questions)) {
      await this.prisma.cbtQuizQuestion.deleteMany({ where: { quizId: id } });
      const questionsData = dto.questions.map((q: any, idx: number) => ({
        quizId: id,
        questionText: q.question_text || q.text || q.questionText || '',
        optionsJson: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
        correctOption: q.correct_option !== undefined ? q.correct_option : (q.correct !== undefined ? q.correct : 0),
        points: q.points !== undefined ? parseFloat(String(q.points)) : (q.marks !== undefined ? parseFloat(String(q.marks)) : 5.0),
        explanation: q.explanation || '',
        order: q.order || idx + 1,
      }));
      await this.prisma.cbtQuizQuestion.createMany({ data: questionsData });
    }

    return this.prisma.cbtQuiz.update({
      where: { id },
      data: {
        title: dto.title || existing.title,
        subjectId: dto.subjectId !== undefined ? dto.subjectId : existing.subjectId,
        description: dto.description !== undefined ? dto.description : existing.description,
        durationMinutes: dto.durationMinutes ? parseInt(String(dto.durationMinutes), 10) : existing.durationMinutes,
        totalMarks: dto.totalMarks !== undefined ? parseFloat(String(dto.totalMarks)) : existing.totalMarks,
        passMarks: dto.passMarks !== undefined ? parseFloat(String(dto.passMarks)) : existing.passMarks,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : existing.isPublished,
      },
      include: {
        subject: true,
        questions: { orderBy: { order: 'asc' } },
      },
    });
  }

  async deleteQuiz(tenantId: string, id: string) {
    const existing = await this.prisma.cbtQuiz.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Quiz not found.');

    return this.prisma.cbtQuiz.delete({ where: { id } });
  }

  // Save questions directly (e.g. from CBT Question Builder)
  async syncQuestions(tenantId: string, quizId: string, questions: any[]) {
    const quiz = await this.prisma.cbtQuiz.findFirst({ where: { id: quizId, tenantId } });
    if (!quiz) throw new NotFoundException('Quiz not found.');

    await this.prisma.cbtQuizQuestion.deleteMany({ where: { quizId } });
    const questionsData = questions.map((q, idx) => ({
      quizId,
      questionText: q.question_text || q.text || q.questionText || '',
      optionsJson: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
      correctOption: q.correct_option !== undefined ? q.correct_option : (q.correct !== undefined ? q.correct : 0),
      points: q.points !== undefined ? parseFloat(String(q.points)) : (q.marks !== undefined ? parseFloat(String(q.marks)) : 5.0),
      explanation: q.explanation || '',
      order: q.order || idx + 1,
    }));

    await this.prisma.cbtQuizQuestion.createMany({ data: questionsData });

    return this.findQuizById(tenantId, quizId);
  }
}
