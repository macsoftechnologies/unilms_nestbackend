import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HostelService {
  constructor(private readonly prisma: PrismaService) {}

  // --- HOSTEL BLOCKS ---
  async findHostels(tenantId: string) {
    return this.prisma.hostel.findMany({
      where: { tenantId },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            capacity: true,
            occupied: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createHostel(tenantId: string, dto: any) {
    return this.prisma.hostel.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type || 'BOYS',
        location: dto.location || 'Campus Quadrangle',
        wardenName: dto.wardenName || dto.warden_name || 'Hostel Warden',
        wardenContact: dto.wardenContact || dto.warden_contact || '+91 98450 11001',
        capacity: Number(dto.capacity || 0),
      },
    });
  }

  async updateHostel(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.hostel.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Hostel block not found in this institution');

    return this.prisma.hostel.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.wardenName || dto.warden_name ? { wardenName: dto.wardenName || dto.warden_name } : {}),
        ...(dto.wardenContact || dto.warden_contact ? { wardenContact: dto.wardenContact || dto.warden_contact } : {}),
        ...(dto.capacity ? { capacity: Number(dto.capacity) } : {}),
      },
    });
  }

  async deleteHostel(tenantId: string, id: string) {
    const existing = await this.prisma.hostel.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Hostel block not found in this institution');
    return this.prisma.hostel.delete({ where: { id } });
  }

  // --- ROOMS ---
  async findRooms(tenantId: string, hostelId?: string) {
    return this.prisma.hostelRoom.findMany({
      where: {
        tenantId,
        ...(hostelId && hostelId !== 'all' ? { hostelId } : {}),
      },
      include: {
        hostel: { select: { id: true, name: true, type: true } },
        allocations: {
          where: { status: 'ACTIVE' },
          include: { student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, phone: true } } },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async createRoom(tenantId: string, dto: any) {
    const room = await this.prisma.hostelRoom.create({
      data: {
        tenantId,
        hostelId: dto.hostelId || dto.hostel_id,
        roomNumber: dto.roomNumber || dto.room_number,
        floor: dto.floor || '1st Floor',
        roomType: dto.roomType || dto.room_type || 'Double Sharing (AC)',
        capacity: Number(dto.capacity || 2),
        occupied: 0,
        status: 'AVAILABLE',
      },
      include: { hostel: true },
    });

    await this.prisma.hostel.update({
      where: { id: room.hostelId },
      data: { capacity: { increment: room.capacity } },
    });

    return room;
  }

  async updateRoom(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.hostelRoom.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Hostel room not found in this institution');

    return this.prisma.hostelRoom.update({
      where: { id },
      data: {
        ...(dto.roomNumber || dto.room_number ? { roomNumber: dto.roomNumber || dto.room_number } : {}),
        ...(dto.floor ? { floor: dto.floor } : {}),
        ...(dto.roomType || dto.room_type ? { roomType: dto.roomType || dto.room_type } : {}),
        ...(dto.capacity ? { capacity: Number(dto.capacity) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deleteRoom(tenantId: string, id: string) {
    const existing = await this.prisma.hostelRoom.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Hostel room not found in this institution');
    return this.prisma.hostelRoom.delete({ where: { id } });
  }

  // --- ALLOCATIONS ---
  async findAllocations(tenantId: string, roomId?: string, studentId?: string) {
    return this.prisma.hostelAllocation.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...(roomId ? { roomId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            email: true,
            phone: true,
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAllocation(tenantId: string, dto: any) {
    const studentId = dto.studentId || dto.student_id;
    const roomId = dto.roomId || dto.room_id;

    const room = await this.prisma.hostelRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) {
      throw new NotFoundException('Hostel room not found in this institution.');
    }

    const existing = await this.prisma.hostelAllocation.findFirst({
      where: { tenantId, studentId, status: 'ACTIVE' },
    });

    if (existing) {
      await this.prisma.hostelAllocation.update({
        where: { id: existing.id },
        data: { status: 'TRANSFERRED' },
      });
      await this.prisma.hostelRoom.update({
        where: { id: existing.roomId },
        data: { occupied: { decrement: 1 } },
      });
    }

    const allocation = await this.prisma.hostelAllocation.create({
      data: {
        tenantId,
        roomId,
        studentId,
        bedNumber: dto.bedNumber || dto.bed_number || 'Bed 1',
        allocatedTill: dto.allocatedTill ? new Date(dto.allocatedTill) : new Date('2027-05-31'),
        status: 'ACTIVE',
      },
      include: { room: true, student: true },
    });

    const nextOccupied = room.occupied + 1;
    await this.prisma.hostelRoom.update({
      where: { id: roomId },
      data: {
        occupied: nextOccupied,
        status: nextOccupied >= room.capacity ? 'OCCUPIED' : 'AVAILABLE',
      },
    });

    return allocation;
  }

  async deleteAllocation(tenantId: string, id: string) {
    const allocation = await this.prisma.hostelAllocation.findFirst({
      where: { id, tenantId },
    });

    if (allocation) {
      await this.prisma.hostelAllocation.update({
        where: { id },
        data: { status: 'VACATED', allocatedTill: new Date() },
      });

      await this.prisma.hostelRoom.update({
        where: { id: allocation.roomId },
        data: {
          occupied: { decrement: 1 },
          status: 'AVAILABLE',
        },
      });
    }

    return { success: true };
  }

  // --- OUTINGS & GATEPASSES ---
  async findOutings(tenantId: string, status?: string, studentId?: string) {
    return this.prisma.hostelOuting.findMany({
      where: {
        tenantId,
        ...(status && status !== 'all' ? { status } : {}),
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, phone: true } },
      },
      orderBy: { outTime: 'desc' },
    });
  }

  async createOuting(tenantId: string, dto: any) {
    const studentId = dto.studentId || dto.student_id;

    return this.prisma.hostelOuting.create({
      data: {
        tenantId,
        studentId,
        purpose: dto.purpose || dto.reason || 'General Campus Outing',
        outTime: dto.outTime || dto.out_time ? new Date(dto.outTime || dto.out_time) : new Date(),
        parentApproved: dto.parentApproved === true,
        status: dto.status || 'PENDING',
      },
      include: { student: true },
    });
  }

  async updateOutingStatus(tenantId: string, id: string, status: string) {
    const existing = await this.prisma.hostelOuting.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Outing record not found in this institution');

    return this.prisma.hostelOuting.update({
      where: { id },
      data: {
        status,
        ...(status === 'RETURNED' ? { inTime: new Date() } : {}),
      },
      include: { student: true },
    });
  }

  async deleteOuting(tenantId: string, id: string) {
    const existing = await this.prisma.hostelOuting.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Outing record not found in this institution');
    return this.prisma.hostelOuting.delete({ where: { id } });
  }
}
