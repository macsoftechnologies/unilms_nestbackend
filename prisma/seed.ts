import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing UniLMS Production Seed (Subscription Plans & SuperAdmin)...');

  // 1. Seed Platform Subscription Plans
  const starter = await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      price: 1999.0,
      durationMonths: 1,
      maxStudents: 500,
      features: 'Basic LMS Module, Up to 500 Students, Standard Reports',
      cmsEnabled: false,
      lmsEnabled: true,
      obeEnabled: false,
    },
  });

  const pro = await prisma.subscriptionPlan.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
      name: 'Professional',
      price: 4999.0,
      durationMonths: 6,
      maxStudents: 2500,
      features: 'Full LMS & CMS Modules, Up to 2500 Students, OBE Attainment System',
      cmsEnabled: true,
      lmsEnabled: true,
      obeEnabled: true,
    },
  });

  const enterprise = await prisma.subscriptionPlan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      price: 14999.0,
      durationMonths: 12,
      maxStudents: 999999,
      features: 'Unlimited Students & Storage, Multi-Campus Management, Dedicated Database',
      cmsEnabled: true,
      lmsEnabled: true,
      obeEnabled: true,
    },
  });

  console.log('  ✔ Subscription Plans ready (Starter, Professional, Enterprise)');

  // 2. Seed Initial Super Admin User
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@superadmin.com').toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'password123';
  const defaultPassword = await bcrypt.hash(superAdminPassword, 10);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: defaultPassword,
      name: process.env.SUPERADMIN_NAME || 'Chief Platform Administrator',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`  ✔ Super Admin account ready: ${superAdmin.email} (Change password immediately upon first production login)`);
  console.log('✅ Production database initialization complete.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
