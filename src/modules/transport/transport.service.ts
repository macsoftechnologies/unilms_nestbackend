import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. FLEET VEHICLES
  // ==========================================
  async findVehicles(tenantId: string) {
    return this.prisma.transportVehicle.findMany({
      where: { tenantId },
      include: {
        routes: { select: { id: true, routeNumber: true, routeName: true } },
        logs: { select: { id: true, amount: true, expenseHead: true } },
      },
      orderBy: { vehicleNo: 'asc' },
    });
  }

  async createVehicle(tenantId: string, dto: any) {
    return this.prisma.transportVehicle.create({
      data: {
        tenantId,
        vehicleNo: dto.vehicleNo || dto.vehicle_no,
        type: dto.type || 'Bus',
        capacity: Number(dto.capacity || 50),
        modelYear: dto.modelYear || dto.model_year || null,
        fuelType: dto.fuelType || dto.fuel_type || 'Diesel',
        driverName: dto.driverName || dto.driver_name || null,
        driverPhone: dto.driverPhone || dto.driver_phone || null,
        gpsTrackingId: dto.gpsTrackingId || dto.gps_tracking_id || `GPS-BUS-${Date.now().toString().slice(-4)}`,
        status: dto.status || 'In Service',
      },
    });
  }

  async updateVehicle(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.transportVehicle.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Vehicle not found in this institution');

    return this.prisma.transportVehicle.update({
      where: { id },
      data: {
        ...(dto.vehicleNo || dto.vehicle_no ? { vehicleNo: dto.vehicleNo || dto.vehicle_no } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.capacity !== undefined ? { capacity: Number(dto.capacity) } : {}),
        ...(dto.modelYear || dto.model_year ? { modelYear: dto.modelYear || dto.model_year } : {}),
        ...(dto.fuelType || dto.fuel_type ? { fuelType: dto.fuelType || dto.fuel_type } : {}),
        ...(dto.driverName !== undefined ? { driverName: dto.driverName } : {}),
        ...(dto.driverPhone !== undefined ? { driverPhone: dto.driverPhone } : {}),
        ...(dto.gpsTrackingId !== undefined ? { gpsTrackingId: dto.gpsTrackingId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deleteVehicle(tenantId: string, id: string) {
    const existing = await this.prisma.transportVehicle.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Vehicle not found in this institution');
    return this.prisma.transportVehicle.delete({ where: { id } });
  }

  // ==========================================
  // 2. BUS ROUTES
  // ==========================================
  async findRoutes(tenantId: string) {
    return this.prisma.transportRoute.findMany({
      where: { tenantId },
      include: {
        vehicle: true,
        stops: { orderBy: { sequence: 'asc' } },
        subscriptions: { select: { id: true, status: true } },
      },
      orderBy: { routeNumber: 'asc' },
    });
  }

  async createRoute(tenantId: string, dto: any) {
    return this.prisma.transportRoute.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId || dto.vehicle_id || null,
        routeNumber: dto.routeNumber || dto.route_number || dto.id || `R-${Date.now().toString().slice(-2)}`,
        routeName: dto.routeName || dto.name,
        startPoint: dto.startPoint || dto.start_point,
        endPoint: dto.endPoint || dto.end_point || 'Campus Main Terminal',
        departureMorning: dto.departureMorning || dto.departure_morning || '07:15 AM',
        departureEvening: dto.departureEvening || dto.departure_evening || '04:45 PM',
        totalKm: Number(dto.totalKm || dto.total_km || 25.0),
        status: dto.status || 'Active',
      },
      include: {
        vehicle: true,
        stops: true,
      },
    });
  }

  async updateRoute(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.transportRoute.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Route not found in this institution');

    return this.prisma.transportRoute.update({
      where: { id },
      data: {
        ...(dto.vehicleId || dto.vehicle_id ? { vehicleId: dto.vehicleId || dto.vehicle_id } : {}),
        ...(dto.routeNumber || dto.route_number || dto.id ? { routeNumber: dto.routeNumber || dto.route_number || dto.id } : {}),
        ...(dto.routeName || dto.name ? { routeName: dto.routeName || dto.name } : {}),
        ...(dto.startPoint || dto.start_point ? { startPoint: dto.startPoint || dto.start_point } : {}),
        ...(dto.endPoint || dto.end_point ? { endPoint: dto.endPoint || dto.end_point } : {}),
        ...(dto.departureMorning || dto.departure_morning ? { departureMorning: dto.departureMorning || dto.departure_morning } : {}),
        ...(dto.departureEvening || dto.departure_evening ? { departureEvening: dto.departureEvening || dto.departure_evening } : {}),
        ...(dto.totalKm !== undefined || dto.total_km !== undefined ? { totalKm: Number(dto.totalKm || dto.total_km) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: {
        vehicle: true,
        stops: true,
      },
    });
  }

  async deleteRoute(tenantId: string, id: string) {
    const existing = await this.prisma.transportRoute.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Route not found in this institution');
    return this.prisma.transportRoute.delete({ where: { id } });
  }

  // ==========================================
  // 3. BUS STOPS / HALTS
  // ==========================================
  async findStops(tenantId: string, routeId?: string) {
    return this.prisma.transportStop.findMany({
      where: {
        tenantId,
        ...(routeId ? { routeId } : {}),
      },
      include: {
        route: { select: { id: true, routeNumber: true, routeName: true } },
        subscriptions: { select: { id: true } },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async createStop(tenantId: string, dto: any) {
    return this.prisma.transportStop.create({
      data: {
        tenantId,
        routeId: dto.routeId || dto.route_id,
        stopName: dto.stopName || dto.name,
        pickupTime: dto.pickupTime || dto.morning_pickup || '07:30 AM',
        dropTime: dto.dropTime || dto.evening_drop || '04:30 PM',
        distanceKm: Number(dto.distanceKm || dto.distance_km || 5.0),
        stopFee: Number(dto.stopFee || dto.annual_fee || 15000),
        sequence: Number(dto.sequence || 1),
      },
      include: {
        route: true,
      },
    });
  }

  async updateStop(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.transportStop.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Stop not found in this institution');

    return this.prisma.transportStop.update({
      where: { id },
      data: {
        ...(dto.routeId || dto.route_id ? { routeId: dto.routeId || dto.route_id } : {}),
        ...(dto.stopName || dto.name ? { stopName: dto.stopName || dto.name } : {}),
        ...(dto.pickupTime || dto.morning_pickup ? { pickupTime: dto.pickupTime || dto.morning_pickup } : {}),
        ...(dto.dropTime || dto.evening_drop ? { dropTime: dto.dropTime || dto.evening_drop } : {}),
        ...(dto.distanceKm !== undefined || dto.distance_km !== undefined ? { distanceKm: Number(dto.distanceKm || dto.distance_km) } : {}),
        ...(dto.stopFee !== undefined || dto.annual_fee !== undefined ? { stopFee: Number(dto.stopFee || dto.annual_fee) } : {}),
        ...(dto.sequence !== undefined ? { sequence: Number(dto.sequence) } : {}),
      },
      include: {
        route: true,
      },
    });
  }

  async deleteStop(tenantId: string, id: string) {
    const existing = await this.prisma.transportStop.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Stop not found in this institution');
    return this.prisma.transportStop.delete({ where: { id } });
  }

  // ==========================================
  // 4. STUDENT BUS SUBSCRIPTIONS / PASSES
  // ==========================================
  async findSubscriptions(tenantId: string, routeId?: string, studentId?: string) {
    return this.prisma.transportSubscription.findMany({
      where: {
        tenantId,
        ...(routeId ? { routeId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            phone: true,
            email: true,
            program: { select: { name: true } },
          },
        },
        route: { select: { id: true, routeNumber: true, routeName: true } },
        stop: { select: { id: true, stopName: true, pickupTime: true, dropTime: true, stopFee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(tenantId: string, dto: any) {
    const passNumber = dto.passNumber || dto.id || `BUS-PASS-${Date.now().toString().slice(-6)}`;
    return this.prisma.transportSubscription.create({
      data: {
        tenant: { connect: { id: tenantId } },
        student: { connect: { id: dto.studentId || dto.student_id } },
        route: { connect: { id: dto.routeId || dto.route_id } },
        stop: { connect: { id: dto.stopId || dto.halt_id } },
        academicYear: dto.academicYear || '2026-2027',
        rfidCardNo: dto.rfidCardNo || dto.rfid_card_no || `RFID-${Math.floor(1000 + Math.random() * 9000)}`,
        feeStatus: dto.feeStatus || dto.fee_status || 'Paid',
        annualFee: Number(dto.annualFee || dto.annual_fee || 16000),
        validTill: dto.validTill || dto.valid_till ? new Date(dto.validTill || dto.valid_till) : new Date('2027-05-31'),
        passNumber,
        status: dto.status || 'Active',
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
        route: true,
        stop: true,
      },
    });
  }

  async updateSubscription(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.transportSubscription.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Subscription not found in this institution');

    return this.prisma.transportSubscription.update({
      where: { id },
      data: {
        ...(dto.routeId || dto.route_id ? { routeId: dto.routeId || dto.route_id } : {}),
        ...(dto.stopId || dto.halt_id ? { stopId: dto.stopId || dto.halt_id } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.feeStatus || dto.fee_status ? { feeStatus: dto.feeStatus || dto.fee_status } : {}),
        ...(dto.rfidCardNo || dto.rfid_card_no ? { rfidCardNo: dto.rfidCardNo || dto.rfid_card_no } : {}),
        ...(dto.annualFee !== undefined || dto.annual_fee !== undefined ? { annualFee: Number(dto.annualFee || dto.annual_fee) } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
        route: true,
        stop: true,
      },
    });
  }

  async deleteSubscription(tenantId: string, id: string) {
    const existing = await this.prisma.transportSubscription.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Subscription not found in this institution');
    return this.prisma.transportSubscription.delete({ where: { id } });
  }

  // ==========================================
  // 5. FLEET LOGBOOK & EXPENSES
  // ==========================================
  async findLogs(tenantId: string, vehicleId?: string) {
    return this.prisma.transportLog.findMany({
      where: {
        tenantId,
        ...(vehicleId ? { vehicleId } : {}),
      },
      include: {
        vehicle: { select: { id: true, vehicleNo: true, type: true, driverName: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async createLog(tenantId: string, dto: any) {
    return this.prisma.transportLog.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId || dto.vehicle_id,
        expenseDate: dto.expenseDate || dto.expense_date ? new Date(dto.expenseDate || dto.expense_date) : new Date(),
        expenseHead: dto.expenseHead || dto.expense_head || 'Fuel',
        amount: Number(dto.amount || 0),
        odometerKm: Number(dto.odometerKm || dto.odometer_km || 0),
        description: dto.description || '',
      },
      include: {
        vehicle: true,
      },
    });
  }

  async updateLog(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.transportLog.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Log not found in this institution');

    return this.prisma.transportLog.update({
      where: { id },
      data: {
        ...(dto.vehicleId || dto.vehicle_id ? { vehicleId: dto.vehicleId || dto.vehicle_id } : {}),
        ...(dto.expenseDate || dto.expense_date ? { expenseDate: new Date(dto.expenseDate || dto.expense_date) } : {}),
        ...(dto.expenseHead || dto.expense_head ? { expenseHead: dto.expenseHead || dto.expense_head } : {}),
        ...(dto.amount !== undefined ? { amount: Number(dto.amount) } : {}),
        ...(dto.odometerKm !== undefined || dto.odometer_km !== undefined ? { odometerKm: Number(dto.odometerKm || dto.odometer_km) } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        vehicle: true,
      },
    });
  }

  async deleteLog(tenantId: string, id: string) {
    const existing = await this.prisma.transportLog.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Log not found in this institution');
    return this.prisma.transportLog.delete({ where: { id } });
  }
}
