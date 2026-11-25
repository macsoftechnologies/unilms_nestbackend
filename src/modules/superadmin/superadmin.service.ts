import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedStandardAccessGroups } from '../../common/constants/standard-access-groups';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD TELEMETRY & STATS
  // ==========================================
  async getDashboardStats() {
    const totalTenants = await this.prisma.tenant.count();
    const activeTenants = await this.prisma.tenant.count({
      where: { status: TenantStatus.ACTIVE },
    });
    const suspendedTenants = await this.prisma.tenant.count({
      where: { status: TenantStatus.SUSPENDED },
    });
    const totalUsers = await this.prisma.user.count();

    const paymentsAggregate = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' },
    });
    const totalRevenue = paymentsAggregate._sum.amount
      ? Number(paymentsAggregate._sum.amount)
      : 0;

    const recentTenants = await this.prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        _count: { select: { users: true } },
      },
    });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      totalRevenue,
      recentTenants,
    };
  }

  // ==========================================
  // TENANTS MANAGEMENT (CRUD & STATUS & RENEW)
  // ==========================================
  async getTenants() {
    return this.prisma.tenant.findMany({
      include: {
        plan: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
      include: {
        plan: true,
        users: {
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            departments: true,
            programs: true,
            studentProfiles: true,
            staffProfiles: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant "${id}" not found.`);
    }

    return tenant;
  }

  async provisionTenant(dto: any) {
    const code = (dto.code || `ORG${Date.now()}`).toUpperCase().trim();

    // Check code collision
    const existing = await this.prisma.tenant.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Tenant with code "${code}" already exists.`);
    }

    const domain = dto.domain || `${code.toLowerCase()}.unilms.com`;
    const planId = Number(dto.planId) || 2;

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${planId} not found.`);
    }

    const durationMonths = plan.durationMonths || 1;
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + durationMonths);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        code,
        domain,
        planId,
        cmsEnabled: dto.cmsEnabled ?? dto.cms_enabled ?? true,
        lmsEnabled: dto.lmsEnabled ?? dto.lms_enabled ?? true,
        obeEnabled: dto.obeEnabled ?? dto.obe_enabled ?? false,
        adminEmail: dto.adminEmail,
        primaryColor: dto.primaryColor || '#7C3AED',
        status: TenantStatus.ACTIVE,
        subscriptionEndDate,
      },
      include: { plan: true },
    });

    // Auto-seed standard institutional access groups (Non-teaching & operational roles)
    await seedStandardAccessGroups(this.prisma, tenant.id);

    // Create Tenant Admin User if admin email & password provided
    if (dto.adminEmail && dto.adminPassword) {
      const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
      await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: `${dto.name} Registrar`,
          email: dto.adminEmail.toLowerCase().trim(),
          employeeCode: `ADM-${code}`,
          passwordHash,
          role: Role.CAMPUS_ADMIN,
        },
      });
    }

    // Record Payment if confirmPayment is true
    if (dto.confirmPayment) {
      await this.prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: `INV-${Date.now().toString().slice(-6)}-${code}`,
          amount: plan.price,
          paymentMethod: dto.paymentMethod || 'Razorpay Online',
          status: 'completed',
        },
      });
    }

    // Log Global Activity
    await this.prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        user: 'Super Admin',
        action: 'Tenant Provisioned',
        details: `College "${tenant.name}" (${tenant.code}) was created under ${tenant.plan.name} plan.`,
        type: 'success',
      },
    });

    return tenant;
  }

  async updateTenant(id: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.domain !== undefined) data.domain = dto.domain;
    if (dto.adminEmail !== undefined) data.adminEmail = dto.adminEmail;
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.planId !== undefined) data.planId = Number(dto.planId);
    if (dto.cmsEnabled !== undefined) data.cmsEnabled = Boolean(dto.cmsEnabled);
    if (dto.lmsEnabled !== undefined) data.lmsEnabled = Boolean(dto.lmsEnabled);
    if (dto.obeEnabled !== undefined) data.obeEnabled = Boolean(dto.obeEnabled);
    if (dto.status !== undefined) {
      data.status =
        String(dto.status).toUpperCase() === 'ACTIVE'
          ? TenantStatus.ACTIVE
          : TenantStatus.SUSPENDED;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data,
      include: { plan: true },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: updated.id,
        user: 'Super Admin',
        action: 'Tenant Updated',
        details: `Tenant "${updated.name}" (${updated.code}) profile was updated.`,
        type: 'info',
      },
    });

    return updated;
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found.`);
    }

    await this.prisma.tenant.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Tenant Deleted',
        details: `Tenant "${tenant.name}" (${tenant.code}) was permanently deleted.`,
        type: 'warning',
      },
    });

    return { success: true, message: `Tenant "${tenant.name}" deleted successfully.` };
  }

  async toggleTenantStatus(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found.`);
    }

    const newStatus =
      tenant.status === TenantStatus.ACTIVE
        ? TenantStatus.SUSPENDED
        : TenantStatus.ACTIVE;

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: newStatus },
      include: { plan: true },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        user: 'Super Admin',
        action: 'Tenant Status Toggled',
        details: `Tenant "${tenant.code}" status changed to ${newStatus}.`,
        type: newStatus === TenantStatus.ACTIVE ? 'info' : 'warning',
      },
    });

    return updated;
  }

  async renewTenant(id: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found.`);
    }

    const planId = dto.planId ? Number(dto.planId) : tenant.planId;
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found.`);
    }

    const durationMonths = plan.durationMonths || 1;
    const baseDate =
      tenant.subscriptionEndDate && tenant.subscriptionEndDate > new Date()
        ? new Date(tenant.subscriptionEndDate)
        : new Date();

    baseDate.setMonth(baseDate.getMonth() + durationMonths);

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        planId,
        subscriptionEndDate: baseDate,
        status: TenantStatus.ACTIVE,
      },
      include: { plan: true },
    });

    const paymentAmount = dto.amount ? Number(dto.amount) : Number(plan.price);
    const invoiceId = `INV-${Date.now().toString().slice(-6)}-${tenant.code}`;

    await this.prisma.payment.create({
      data: {
        tenantId: tenant.id,
        invoiceId,
        amount: paymentAmount,
        paymentMethod: dto.paymentMethod || 'Renewal / Offline',
        status: 'completed',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        user: 'Super Admin',
        action: 'Tenant Subscription Renewed',
        details: `Tenant "${tenant.name}" (${tenant.code}) renewed under ${plan.name} plan until ${baseDate.toLocaleDateString()}. Payment receipt: ${invoiceId}.`,
        type: 'success',
      },
    });

    return updatedTenant;
  }

  // ==========================================
  // SUBSCRIPTION PLANS (CRUD)
  // ==========================================
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  async createPlan(dto: any) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Plan name is required.');
    }

    const name = dto.name.trim();
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ConflictException(`Plan "${name}" already exists.`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name,
        price: Number(dto.price) || 0,
        durationMonths: Number(dto.durationMonths || dto.duration_months) || 1,
        maxStudents: Number(dto.maxStudents) || 1000,
        features: dto.features || 'Standard Module Package',
        cmsEnabled: dto.cmsEnabled ?? true,
        lmsEnabled: dto.lmsEnabled ?? true,
        obeEnabled: dto.obeEnabled ?? false,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Subscription Plan Created',
        details: `New plan "${plan.name}" (₹${plan.price}) created.`,
        type: 'success',
      },
    });

    return plan;
  }

  async updatePlan(id: number, dto: any) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.price !== undefined) data.price = Number(dto.price);
    if (dto.durationMonths !== undefined || dto.duration_months !== undefined) {
      data.durationMonths = Number(dto.durationMonths || dto.duration_months);
    }
    if (dto.maxStudents !== undefined) data.maxStudents = Number(dto.maxStudents);
    if (dto.features !== undefined) data.features = dto.features.trim();
    if (dto.cmsEnabled !== undefined) data.cmsEnabled = Boolean(dto.cmsEnabled);
    if (dto.lmsEnabled !== undefined) data.lmsEnabled = Boolean(dto.lmsEnabled);
    if (dto.obeEnabled !== undefined) data.obeEnabled = Boolean(dto.obeEnabled);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Subscription Plan Updated',
        details: `Plan "${updated.name}" details updated.`,
        type: 'info',
      },
    });

    return updated;
  }

  async deletePlan(id: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found.`);
    }

    if (plan._count.tenants > 0) {
      throw new ConflictException(
        `Cannot delete plan "${plan.name}": ${plan._count.tenants} institutions are currently enrolled under this plan.`,
      );
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Subscription Plan Deleted',
        details: `Plan "${plan.name}" was removed.`,
        type: 'warning',
      },
    });

    return { success: true, message: `Plan "${plan.name}" deleted successfully.` };
  }

  // ==========================================
  // PLATFORM ADMINISTRATORS (CRUD)
  // ==========================================
  async getAdmins() {
    return this.prisma.superAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAdmin(dto: any) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password are required.');
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`Super admin with email "${email}" already exists.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.superAdmin.create({
      data: {
        email,
        passwordHash,
        name: dto.name || 'Platform Admin',
        role: Role.SUPER_ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Platform Admin Created',
        details: `New administrator "${admin.email}" added to Executive Suite.`,
        type: 'success',
      },
    });

    return admin;
  }

  async updateAdmin(id: string, dto: any) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email.toLowerCase().trim();
    if (dto.password && dto.password.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    const updated = await this.prisma.superAdmin.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Platform Admin Updated',
        details: `Administrator "${updated.email}" credentials updated.`,
        type: 'info',
      },
    });

    return updated;
  }

  async deleteAdmin(id: string, currentUserId?: string) {
    const count = await this.prisma.superAdmin.count();
    if (count <= 1) {
      throw new ConflictException('Cannot delete the last remaining platform administrator.');
    }

    if (currentUserId && id === currentUserId) {
      throw new ConflictException('You cannot delete your own active administrator account.');
    }

    const admin = await this.prisma.superAdmin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin ${id} not found.`);
    }

    await this.prisma.superAdmin.delete({ where: { id } });

    await this.prisma.activityLog.create({
      data: {
        user: 'Super Admin',
        action: 'Platform Admin Removed',
        details: `Administrator "${admin.email}" was removed.`,
        type: 'warning',
      },
    });

    return { success: true, message: `Administrator "${admin.email}" deleted successfully.` };
  }

  // ==========================================
  // CONTENT CREATORS (COURSE AUTHORS) (CRUD)
  // ==========================================
  async getCreators() {
    return this.prisma.user.findMany({
      where: { role: Role.CREATOR },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCreator(dto: any) {
    if (!dto.name || !dto.email || !dto.password) {
      throw new BadRequestException('Name, email, and password are required.');
    }

    // Resolve tenant: either provided tenantId or first available tenant
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (!firstTenant) {
        throw new BadRequestException('Please create at least one organization first.');
      }
      tenantId = firstTenant.id;
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`User with email "${email}" already exists.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const creator = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        email,
        passwordHash,
        role: Role.CREATOR,
        status: dto.status || 'active',
        employeeCode: `CR-${Date.now().toString().slice(-4)}`,
      },
      include: {
        tenant: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        user: 'Super Admin',
        action: 'Content Creator Onboarded',
        details: `Course Author "${creator.name}" (${creator.email}) provisioned.`,
        type: 'success',
      },
    });

    return creator;
  }

  async updateCreator(id: string, dto: any) {
    const creator = await this.prisma.user.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException(`Creator ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.toLowerCase().trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.tenantId !== undefined) data.tenantId = dto.tenantId;
    if (dto.password && dto.password.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        tenant: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: updated.tenantId,
        user: 'Super Admin',
        action: 'Content Creator Updated',
        details: `Creator profile for "${updated.name}" was modified.`,
        type: 'info',
      },
    });

    return updated;
  }

  async deleteCreator(id: string) {
    const creator = await this.prisma.user.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException(`Creator ${id} not found.`);
    }

    await this.prisma.user.delete({ where: { id } });

    await this.prisma.activityLog.create({
      data: {
        tenantId: creator.tenantId,
        user: 'Super Admin',
        action: 'Content Creator Removed',
        details: `Creator "${creator.name}" was removed.`,
        type: 'warning',
      },
    });

    return { success: true, message: `Creator "${creator.name}" removed successfully.` };
  }

  // ==========================================
  // PAYMENTS & RECEIPTS
  // ==========================================
  async getPayments() {
    return this.prisma.payment.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // ACTIVITY & AUDIT LOGS
  // ==========================================
  async getActivityLogs() {
    const logs = await this.prisma.activityLog.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));
  }

  // ==========================================
  // PLATFORM SETTINGS (PAYMENT GATEWAYS, SMTP, SMS)
  // ==========================================
  async getSettings(key?: string) {
    if (key) {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key },
      });
      return setting ? setting.value : null;
    }
    const all = await this.prisma.platformSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of all) {
      map[s.key] = s.value;
    }
    return map;
  }

  async updateSettings(key: string, value: any) {
    const upserted = await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return upserted.value;
  }
}
