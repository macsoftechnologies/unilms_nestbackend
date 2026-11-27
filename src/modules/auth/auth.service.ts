import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, SuperAdminLoginDto, RefreshTokenDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedStandardAccessGroups, STANDARD_ACCESS_GROUPS } from '../../common/constants/standard-access-groups';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const orgCode = dto.orgCode.toUpperCase().trim();

    // 1. Resolve Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { code: orgCode },
    });

    if (!tenant) {
      throw new UnauthorizedException(`Institution code "${orgCode}" does not exist.`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Institution account for "${tenant.name}" is currently ${tenant.status.toLowerCase()}. Please contact administrator.`);
    }

    // 2. Resolve User within Tenant
    let user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { rollNumber: dto.identifier.trim() },
          { employeeCode: dto.identifier.trim() },
          { email: dto.identifier.trim().toLowerCase() },
          { phone: dto.identifier.trim() },
        ],
      },
      include: {
        studentProfile: true,
        staffProfile: true,
      },
    });

    // Self-healing: if user account does not exist, check if student profile exists without User record
    if (!user) {
      const stProfile = await this.prisma.studentProfile.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            { rollNumber: dto.identifier.trim() },
            { email: dto.identifier.trim().toLowerCase() },
            { phone: dto.identifier.trim() },
          ],
        },
      });

      if (stProfile) {
        const passwordHash = await bcrypt.hash('Password@123', 10);
        user = await this.prisma.user.create({
          data: {
            tenantId: tenant.id,
            role: Role.STUDENT,
            name: `${stProfile.firstName} ${stProfile.lastName || ''}`.trim(),
            email: stProfile.email || `${stProfile.rollNumber.toLowerCase()}@campus.edu`,
            passwordHash,
            phone: stProfile.phone,
            rollNumber: stProfile.rollNumber,
            semester: String(stProfile.currentSemester || 1),
          },
          include: {
            studentProfile: true,
            staffProfile: true,
          },
        });
        await this.prisma.studentProfile.update({
          where: { id: stProfile.id },
          data: { userId: user.id },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid user identifier for this institution.');
    }

    // 3. Verify Password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    // 4. Generate Tokens & Load RBAC Access Groups
    let userGroups: string[] = [];
    try {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: `${tenant.id}:user_access_group:${user.id}` },
      });
      if (setting && Array.isArray(setting.value)) {
        userGroups = setting.value as string[];
      }
    } catch {}

    // Check if user is the primary college administrator or has the full Admin access group
    const isPrimaryAdmin = user.email?.toLowerCase().startsWith('vorg@') || user.email?.toLowerCase().includes('admin');
    const hasAdminGroup = userGroups.some(g => g.toLowerCase().includes('admin') || g.toLowerCase().includes('administrator'));
    const isFullOrgAdmin = isPrimaryAdmin || hasAdminGroup;

    // If no access groups explicitly stored, determine standard default
    if (userGroups.length === 0) {
      if (isFullOrgAdmin) {
        userGroups = ['Admin / College Administrator'];
      } else if (user.role === Role.FACULTY) {
        userGroups = ['Faculty / Teaching Staff'];
      } else {
        const des = (user.designation || '').toLowerCase();
        if (des.includes('hr')) userGroups = ['HR Operations Executive'];
        else if (des.includes('account') || des.includes('fee')) userGroups = ['Accounts Officer / Fee Cashier'];
        else if (des.includes('admiss')) userGroups = ['Admissions Counselor'];
        else if (des.includes('exam')) userGroups = ['Examinations Assistant'];
        else if (des.includes('hostel') || des.includes('warden')) userGroups = ['Hostel Warden'];
        else if (des.includes('transport')) userGroups = ['Transport Supervisor'];
        else if (des.includes('librar')) userGroups = ['Librarian / Library Assistant'];
        else userGroups = ['Front Office / Reception Desk'];
      }
    }

    const effectiveRole = isFullOrgAdmin
      ? 'admin'
      : (user.role === Role.FACULTY ? 'faculty' : (user.role === Role.STUDENT ? 'student' : (user.role === Role.PARENT ? 'parent' : 'staff')));

    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      tenantCode: tenant.code,
      role: effectiveRole,
      isOrgAdmin: isFullOrgAdmin,
      accessGroups: userGroups,
      name: user.name,
      email: user.email,
      studentId: user.studentProfile?.id,
      staffId: user.staffProfile?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '90d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: effectiveRole,
        is_org_admin: isFullOrgAdmin,
        access_groups: userGroups,
        designation: user.designation || user.staffProfile?.designation || (isFullOrgAdmin ? 'Organization Admin' : userGroups[0]),
        email: user.email,
        rollNumber: user.rollNumber,
        employeeCode: user.employeeCode,
        studentId: user.studentProfile?.id,
        staffId: user.staffProfile?.id,
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
          primaryColor: tenant.primaryColor,
        },
      },
    };
  }

  async superAdminLogin(dto: SuperAdminLoginDto) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!superAdmin) {
      throw new UnauthorizedException('Invalid Super Admin credentials.');
    }

    const isValid = await bcrypt.compare(dto.password, superAdmin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Super Admin credentials.');
    }

    const payload = {
      sub: superAdmin.id,
      role: 'super_admin',
      name: superAdmin.name,
      email: superAdmin.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    return {
      accessToken,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: 'super_admin',
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          studentProfile: { select: { id: true } },
          staffProfile: { select: { id: true } },
        },
      });

      if (!user || (user.status && user.status.toLowerCase() !== 'active')) {
        throw new UnauthorizedException('User account is inactive or revoked.');
      }

      const studentId = user.studentProfile?.id || decoded.studentId;
      const staffId = user.staffProfile?.id || decoded.staffId;

      const payload = {
        sub: user.id,
        tenantId: user.tenantId,
        tenantCode: decoded.tenantCode || user.tenantId,
        role: user.role,
        name: user.name || decoded.name || 'User',
        email: user.email,
        studentId,
        staffId,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      });

      return {
        accessToken: newAccessToken,
      };
    } catch {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }
  }

  async ensureAllInstitutionalUsers(tenantId: string) {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Sync staff
    const staffList = await this.prisma.staffProfile.findMany({
      where: { tenantId },
      include: { department: true },
    });

    for (const staff of staffList) {
      if (!staff.userId) {
        let existingUser = await this.prisma.user.findFirst({
          where: {
            tenantId,
            OR: [
              { employeeCode: staff.employeeCode },
              { email: staff.email.toLowerCase() },
            ],
          },
        });

        if (!existingUser) {
          existingUser = await this.prisma.user.create({
            data: {
              tenantId,
              role: Role.FACULTY,
              name: `${staff.firstName} ${staff.lastName || ''}`.trim(),
              email: staff.email.toLowerCase(),
              phone: staff.phone || '9876543210',
              passwordHash: defaultPasswordHash,
              employeeCode: staff.employeeCode,
              department: staff.department?.name || 'Department of Engineering',
              designation: staff.designation || 'Faculty Member',
              status: 'active',
            },
          });
        }

        await this.prisma.staffProfile.update({
          where: { id: staff.id },
          data: { userId: existingUser.id },
        });
      }
    }

    // 2. Sync students
    const studentList = await this.prisma.studentProfile.findMany({
      where: { tenantId },
      include: { program: true },
    });

    for (const student of studentList) {
      if (!student.userId) {
        let existingUser = await this.prisma.user.findFirst({
          where: {
            tenantId,
            OR: [
              { rollNumber: student.rollNumber },
              ...(student.email ? [{ email: student.email.toLowerCase() }] : []),
            ],
          },
        });

        if (!existingUser) {
          const studentEmail = student.email
            ? student.email.toLowerCase()
            : `${student.rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@campus.edu`;

          existingUser = await this.prisma.user.create({
            data: {
              tenantId,
              role: Role.STUDENT,
              name: `${student.firstName} ${student.lastName || ''}`.trim(),
              email: studentEmail,
              phone: student.phone || '9876543210',
              passwordHash: defaultPasswordHash,
              rollNumber: student.rollNumber,
              program: student.program?.name || 'B.Tech CSE',
              status: 'active',
            },
          });
        }

        await this.prisma.studentProfile.update({
          where: { id: student.id },
          data: { userId: existingUser.id },
        });
      }
    }

    // 3. Ensure sample Parent account
    const parentUser = await this.prisma.user.findFirst({
      where: { tenantId, role: Role.PARENT },
    });
    if (!parentUser && studentList.length > 0) {
      const firstStudent = studentList[0];
      await this.prisma.user.create({
        data: {
          tenantId,
          role: Role.PARENT,
          name: 'Ramesh Sharma (Parent / Guardian)',
          email: 'ramesh.sharma@parent.edu',
          phone: '9820099881',
          passwordHash: defaultPasswordHash,
          employeeCode: 'PAR001',
          designation: 'Guardian of ' + firstStudent.firstName + ' ' + (firstStudent.lastName || ''),
          studentId: firstStudent.id,
          status: 'active',
        },
      });
    }
  }

  async getUsers(tenantId: string) {
    await this.ensureAllInstitutionalUsers(tenantId);

    const [users, rbacSettings] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        include: {
          studentProfile: { select: { rollNumber: true, program: { select: { name: true } } } },
          staffProfile: { select: { employeeCode: true, designation: true, department: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.platformSetting.findMany({
        where: { key: { startsWith: `${tenantId}:user_access_group:` } },
      }),
    ]);

    const groupsMap = new Map<string, string[]>();
    for (const s of rbacSettings) {
      const prefix = `${tenantId}:user_access_group:`;
      const userId = s.key.replace(prefix, '');
      if (Array.isArray(s.value)) {
        groupsMap.set(userId, s.value as string[]);
      }
    }

    return users.map((u, idx) => {
      let roleLower = u.role.toLowerCase();
      if (u.role === 'CAMPUS_ADMIN') roleLower = 'admin';

      let code =
        u.employeeCode ||
        u.staffProfile?.employeeCode ||
        u.rollNumber ||
        u.studentProfile?.rollNumber;
      if (!code) {
        if (roleLower === 'admin') code = 'ADM001';
        else if (roleLower === 'parent') code = 'PAR001';
        else code = `USR-${idx + 1}`;
      }

      let groups = groupsMap.get(u.id);
      if (!groups || groups.length === 0) {
        if (roleLower === 'admin') groups = ['Admin / College Administrator'];
        else if (roleLower === 'faculty') groups = ['Faculty / Teaching Staff'];
        else if (roleLower === 'staff') groups = ['Front Office / Reception Desk'];
        else if (roleLower === 'student') groups = ['Student Council'];
        else if (roleLower === 'parent') groups = ['Parent Portal Access'];
        else groups = ['General Access'];
      }

      return {
        id: u.id,
        employee_code: code,
        full_name: u.name,
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        designation:
          u.designation ||
          u.staffProfile?.designation ||
          (roleLower === 'student'
            ? (u.studentProfile?.program?.name || 'B.Tech CSE')
            : roleLower === 'parent'
            ? 'Parent / Guardian'
            : 'Staff Member'),
        role: roleLower,
        is_org_admin: roleLower === 'admin' ? 1 : 0,
        access_groups: groups,
        status: u.status || 'active',
        created_at: u.createdAt,
      };
    });
  }

  async createUser(tenantId: string, data: any) {
    const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
    let role: Role = Role.FACULTY;
    const r = (data.role || '').toLowerCase();
    if (r === 'admin') role = Role.CAMPUS_ADMIN;
    else if (r === 'student') role = Role.STUDENT;
    else if (r === 'parent') role = Role.PARENT;

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        role,
        name: data.full_name || data.name,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        passwordHash,
        employeeCode: data.employee_code || null,
        rollNumber: r === 'student' ? data.employee_code : null,
        designation: data.designation || null,
        status: 'active',
      },
    });

    if (data.access_groups && Array.isArray(data.access_groups) && data.access_groups.length > 0) {
      const settingKey = `${tenantId}:user_access_group:${user.id}`;
      await this.prisma.platformSetting.upsert({
        where: { key: settingKey },
        update: { value: data.access_groups },
        create: {
          key: settingKey,
          value: data.access_groups,
        },
      });
    }

    return user;
  }

  async updateUser(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('User not found within your institution.');
    }
    const updateData: any = {};
    if (data.full_name) updateData.name = data.full_name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.phone) updateData.phone = data.phone;
    if (data.designation) updateData.designation = data.designation;
    if (data.employee_code) {
      updateData.employeeCode = data.employee_code;
      if (data.role === 'student') updateData.rollNumber = data.employee_code;
    }
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (data.access_groups && Array.isArray(data.access_groups)) {
      const settingKey = `${tenantId}:user_access_group:${id}`;
      await this.prisma.platformSetting.upsert({
        where: { key: settingKey },
        update: { value: data.access_groups },
        create: {
          key: settingKey,
          value: data.access_groups,
        },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(tenantId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('User not found within your institution.');
    }
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getAccessGroups(tenantId?: string) {
    if (tenantId) {
      await seedStandardAccessGroups(this.prisma, tenantId);
      const groups = await this.prisma.accessGroup.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
      if (groups && groups.length > 0) {
        return groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          permissions_count: g.permissionsCount,
          users_count: 0,
          created_by: g.createdBy || 'System',
          created_at: g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-GB') : 'System Default',
        }));
      }
    }

    return STANDARD_ACCESS_GROUPS.map((g, idx) => ({
      id: String(idx + 1),
      name: g.name,
      description: g.description,
      permissions_count: g.permissionsCount,
      users_count: 0,
      created_by: 'System',
      created_at: 'System Default',
    }));
  }
}

