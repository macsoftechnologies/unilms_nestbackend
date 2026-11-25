import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FrontOfficeService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD TELEMETRY STATS
  // ==========================================
  async getStats(tenantId: string) {
    const [visitors, postal, calls, enquiries] = await Promise.all([
      this.prisma.visitorPass.findMany({ where: { tenantId } }),
      this.prisma.postalRecord.findMany({ where: { tenantId } }),
      this.prisma.frontOfficeCallLog.findMany({ where: { tenantId } }),
      this.prisma.frontOfficeEnquiry.findMany({ where: { tenantId } })
    ]);

    const activeVisitors = visitors.filter(v => v.status === 'inside').length;
    const checkedOutVisitors = visitors.filter(v => v.status === 'out').length;

    const inwardPostal = postal.filter(p => p.type === 'INWARD').length;
    const outwardPostal = postal.filter(p => p.type === 'OUTWARD').length;

    const incomingCalls = calls.filter(c => c.callType === 'INCOMING').length;
    const outgoingCalls = calls.filter(c => c.callType === 'OUTGOING').length;

    const newEnquiries = enquiries.filter(e => e.status === 'New').length;
    const convertedEnquiries = enquiries.filter(e => e.status === 'Converted').length;

    return {
      totalVisitorsToday: visitors.length,
      currentlyInside: activeVisitors,
      checkedOut: checkedOutVisitors,
      totalPostalPackets: postal.length,
      inwardPostal,
      outwardPostal,
      totalCallsLogged: calls.length,
      incomingCalls,
      outgoingCalls,
      totalEnquiries: enquiries.length,
      newEnquiries,
      convertedEnquiries,
      recentVisitors: visitors.slice(0, 5),
      recentCalls: calls.slice(0, 5)
    };
  }

  // ==========================================
  // 1. VISITOR GATEPASSES CRUD
  // ==========================================
  async findVisitors(tenantId: string, status?: string) {
    return this.prisma.visitorPass.findMany({
      where: {
        tenantId,
        ...(status && status !== 'All' ? { status } : {})
      },
      orderBy: { inTime: 'desc' }
    });
  }

  async findVisitorById(tenantId: string, id: string) {
    const v = await this.prisma.visitorPass.findFirst({
      where: { id, tenantId }
    });
    if (!v) throw new NotFoundException('Visitor pass record not found.');
    return v;
  }

  async createVisitor(tenantId: string, dto: any) {
    const count = await this.prisma.visitorPass.count({ where: { tenantId } });
    const passNumber = dto.passNumber || `GP-${new Date().getFullYear()}-${String(count + 101).padStart(3, '0')}`;

    return this.prisma.visitorPass.create({
      data: {
        tenantId,
        passNumber,
        visitorName: dto.visitorName || dto.visitor_name,
        phone: dto.phone,
        visitorType: dto.visitorType || dto.visitor_type || 'Guest',
        purpose: dto.purpose,
        personToMeet: dto.personToMeet || dto.person_to_meet,
        department: dto.department || null,
        idProof: dto.idProof || dto.id_proof || null,
        inTime: dto.inTime ? new Date(dto.inTime) : new Date(),
        status: 'inside'
      }
    });
  }

  async updateVisitor(tenantId: string, id: string, dto: any) {
    const existing = await this.findVisitorById(tenantId, id);
    return this.prisma.visitorPass.update({
      where: { id: existing.id },
      data: {
        ...(dto.visitorName || dto.visitor_name ? { visitorName: dto.visitorName || dto.visitor_name } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.visitorType || dto.visitor_type ? { visitorType: dto.visitorType || dto.visitor_type } : {}),
        ...(dto.purpose ? { purpose: dto.purpose } : {}),
        ...(dto.personToMeet || dto.person_to_meet ? { personToMeet: dto.personToMeet || dto.person_to_meet } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.idProof !== undefined ? { idProof: dto.idProof } : {}),
        ...(dto.status ? { status: dto.status } : {})
      }
    });
  }

  async checkoutVisitor(tenantId: string, id: string) {
    const existing = await this.findVisitorById(tenantId, id);
    return this.prisma.visitorPass.update({
      where: { id: existing.id },
      data: {
        status: 'out',
        outTime: new Date()
      }
    });
  }

  async deleteVisitor(tenantId: string, id: string) {
    const existing = await this.findVisitorById(tenantId, id);
    return this.prisma.visitorPass.delete({
      where: { id: existing.id }
    });
  }

  // ==========================================
  // 2. POSTAL & COURIER DISPATCHES CRUD
  // ==========================================
  async findPostal(tenantId: string, type?: string) {
    return this.prisma.postalRecord.findMany({
      where: {
        tenantId,
        ...(type && type !== 'All' ? { type } : {})
      },
      orderBy: { date: 'desc' }
    });
  }

  async createPostal(tenantId: string, dto: any) {
    return this.prisma.postalRecord.create({
      data: {
        tenantId,
        type: dto.type || 'INWARD',
        trackingNumber: dto.trackingNumber || dto.tracking_no || null,
        sender: dto.sender,
        recipient: dto.recipient,
        department: dto.department || null,
        notes: dto.notes || null,
        date: dto.date ? new Date(dto.date) : new Date(),
        status: dto.status || 'RECEIVED'
      }
    });
  }

  async updatePostal(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.postalRecord.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Postal record not found');

    return this.prisma.postalRecord.update({
      where: { id: existing.id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.trackingNumber || dto.tracking_no !== undefined ? { trackingNumber: dto.trackingNumber || dto.tracking_no } : {}),
        ...(dto.sender ? { sender: dto.sender } : {}),
        ...(dto.recipient ? { recipient: dto.recipient } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status ? { status: dto.status } : {})
      }
    });
  }

  async deletePostal(tenantId: string, id: string) {
    const existing = await this.prisma.postalRecord.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Postal record not found');

    return this.prisma.postalRecord.delete({
      where: { id: existing.id }
    });
  }

  // ==========================================
  // 3. TELEPHONE CALL LOGS CRUD
  // ==========================================
  async findCalls(tenantId: string) {
    return this.prisma.frontOfficeCallLog.findMany({
      where: { tenantId },
      orderBy: { callDate: 'desc' }
    });
  }

  async createCall(tenantId: string, dto: any) {
    return this.prisma.frontOfficeCallLog.create({
      data: {
        tenantId,
        callerName: dto.callerName || dto.caller_name,
        phone: dto.phone,
        callType: dto.callType || dto.call_type || 'INCOMING',
        purpose: dto.purpose,
        duration: dto.duration || null,
        notes: dto.notes || null,
        callDate: dto.callDate ? new Date(dto.callDate) : new Date()
      }
    });
  }

  async updateCall(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.frontOfficeCallLog.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Call log record not found');

    return this.prisma.frontOfficeCallLog.update({
      where: { id: existing.id },
      data: {
        ...(dto.callerName || dto.caller_name ? { callerName: dto.callerName || dto.caller_name } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.callType || dto.call_type ? { callType: dto.callType || dto.call_type } : {}),
        ...(dto.purpose ? { purpose: dto.purpose } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {})
      }
    });
  }

  async deleteCall(tenantId: string, id: string) {
    const existing = await this.prisma.frontOfficeCallLog.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Call log record not found');

    return this.prisma.frontOfficeCallLog.delete({
      where: { id: existing.id }
    });
  }

  // ==========================================
  // 4. ADMISSION & PUBLIC ENQUIRIES CRUD
  // ==========================================
  async findEnquiries(tenantId: string, query?: any) {
    return this.prisma.frontOfficeEnquiry.findMany({
      where: {
        tenantId,
        ...(query?.status && query.status !== 'All' ? { status: query.status } : {}),
        ...(query?.source && query.source !== 'All' ? { enquirySource: query.source } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createEnquiry(tenantId: string, dto: any) {
    const count = await this.prisma.frontOfficeEnquiry.count({ where: { tenantId } });
    const enquiryNumber = dto.enquiryNumber || `ENQ-${new Date().getFullYear()}-${String(count + 201).padStart(3, '0')}`;

    return this.prisma.frontOfficeEnquiry.create({
      data: {
        tenantId,
        enquiryNumber,
        studentName: dto.studentName || dto.student_name,
        parentName: dto.parentName || dto.parent_name || null,
        mobile: dto.mobile,
        email: dto.email || null,
        program: dto.program || dto.program_id || 'General Enquiry',
        enquirySource: dto.enquirySource || dto.enquiry_source || 'Walk-In',
        assignedCounsellor: dto.assignedCounsellor || dto.assigned_counsellor || null,
        status: dto.status || 'New',
        remarks: dto.remarks || null,
        followups: dto.followups || []
      }
    });
  }

  async updateEnquiry(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.frontOfficeEnquiry.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Enquiry record not found');

    return this.prisma.frontOfficeEnquiry.update({
      where: { id: existing.id },
      data: {
        ...(dto.studentName || dto.student_name ? { studentName: dto.studentName || dto.student_name } : {}),
        ...(dto.parentName || dto.parent_name !== undefined ? { parentName: dto.parentName || dto.parent_name } : {}),
        ...(dto.mobile ? { mobile: dto.mobile } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.program || dto.program_id ? { program: dto.program || dto.program_id } : {}),
        ...(dto.enquirySource || dto.enquiry_source ? { enquirySource: dto.enquirySource || dto.enquiry_source } : {}),
        ...(dto.assignedCounsellor || dto.assigned_counsellor !== undefined ? { assignedCounsellor: dto.assignedCounsellor || dto.assigned_counsellor } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks } : {}),
        ...(dto.followups !== undefined ? { followups: dto.followups } : {})
      }
    });
  }

  async addFollowup(tenantId: string, id: string, dto: { notes: string; counsellor?: string }) {
    const enquiry = await this.prisma.frontOfficeEnquiry.findFirst({
      where: { id, tenantId }
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    const existingFollowups = Array.isArray(enquiry.followups) ? (enquiry.followups as any[]) : [];
    const newFollowup = {
      date: new Date().toISOString().split('T')[0],
      notes: dto.notes,
      counsellor: dto.counsellor || enquiry.assignedCounsellor || 'Staff'
    };

    return this.prisma.frontOfficeEnquiry.update({
      where: { id: enquiry.id },
      data: {
        followups: [newFollowup, ...existingFollowups],
        status: enquiry.status === 'New' ? 'Contacted' : enquiry.status
      }
    });
  }

  async convertToLead(tenantId: string, id: string) {
    const enquiry = await this.prisma.frontOfficeEnquiry.findFirst({
      where: { id, tenantId }
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    // 1. Create Lead in Module 02 Admissions
    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        fullName: enquiry.studentName,
        phone: enquiry.mobile,
        email: enquiry.email || null,
        source: enquiry.enquirySource || 'Walk-In',
        programName: enquiry.program,
        status: 'new',
        assignedTo: enquiry.assignedCounsellor || null,
        notes: `Converted from Front Office Enquiry (${enquiry.enquiryNumber}). Parent: ${enquiry.parentName || 'N/A'}. Remarks: ${enquiry.remarks || 'None'}`
      }
    });

    // 2. Mark Enquiry as Converted
    const updated = await this.prisma.frontOfficeEnquiry.update({
      where: { id: enquiry.id },
      data: { status: 'Converted' }
    });

    return { enquiry: updated, lead };
  }

  async deleteEnquiry(tenantId: string, id: string) {
    const existing = await this.prisma.frontOfficeEnquiry.findFirst({
      where: { id, tenantId }
    });
    if (!existing) throw new NotFoundException('Enquiry record not found');

    return this.prisma.frontOfficeEnquiry.delete({
      where: { id: existing.id }
    });
  }
}
