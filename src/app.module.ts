import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './common/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantBindingGuard } from './common/guards/tenant-binding.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SuperAdminModule } from './modules/superadmin/superadmin.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { StudentsModule } from './modules/students/students.module';
import { StaffModule } from './modules/staff/staff.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { ObeModule } from './modules/obe/obe.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { TransportModule } from './modules/transport/transport.module';
import { LibraryModule } from './modules/library/library.module';
import { FrontOfficeModule } from './modules/front-office/front-office.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { LmsModule } from './modules/lms/lms.module';
import { CbtModule } from './modules/cbt/cbt.module';
import { ParentModule } from './modules/parent/parent.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlacementsModule } from './modules/placements/placements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    AuthModule,
    TenantsModule,
    SuperAdminModule,
    AcademicsModule,
    AdmissionsModule,
    StudentsModule,
    StaffModule,
    LeavesModule,
    PayrollModule,
    AttendanceModule,
    ExaminationsModule,
    ObeModule,
    FinanceModule,
    HostelModule,
    TransportModule,
    LibraryModule,
    FrontOfficeModule,
    FacultyModule,
    LmsModule,
    CbtModule,
    ParentModule,
    NotificationsModule,
    PlacementsModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    // 1. First: JWT Authentication Guard (Default-Deny)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Second: Multi-Tenant Token Context Binding & Isolation Guard
    {
      provide: APP_GUARD,
      useClass: TenantBindingGuard,
    },
    // 3. Third: Role-Based Access Control (RBAC) Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
