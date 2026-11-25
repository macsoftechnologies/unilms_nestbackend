export interface StandardAccessGroupDefinition {
  name: string;
  description: string;
  permissionsCount: number;
}

export const STANDARD_ACCESS_GROUPS: StandardAccessGroupDefinition[] = [
  {
    name: 'Front Office / Reception Desk',
    description: 'Campus visitor registration, gate passes, call inquiries, and postal dispatch.',
    permissionsCount: 8,
  },
  {
    name: 'Accounts Officer / Fee Cashier',
    description: 'Student fee collection, receipts issuance, invoice tracking, and daily daybook ledger.',
    permissionsCount: 14,
  },
  {
    name: 'Admissions Counselor',
    description: 'Student leads, applicant verification, provisional offer letter generation, and enrollment.',
    permissionsCount: 12,
  },
  {
    name: 'Examinations Assistant',
    description: 'Examination datesheet scheduling, hall tickets generation, and backlog registrations.',
    permissionsCount: 10,
  },
  {
    name: 'Hostel Warden',
    description: 'Hostel block management, bed allotments, room vacancies, and student night outing gate passes.',
    permissionsCount: 9,
  },
  {
    name: 'Transport Supervisor',
    description: 'Fleet logistics, bus routes, pickup stops, student bus passes, and vehicle logbooks.',
    permissionsCount: 9,
  },
  {
    name: 'Librarian / Library Assistant',
    description: 'Book cataloging, student/staff issue and return circulation, and overdue fine collection.',
    permissionsCount: 11,
  },
  {
    name: 'HR Operations Executive',
    description: 'Employee directory management, staff biometric gate logs, and leave approval tracking.',
    permissionsCount: 10,
  },
  {
    name: 'Training & Placement Officer (TPO)',
    description: 'Campus placement drives, company registrations, student shortlists, and offer letters.',
    permissionsCount: 10,
  },
  {
    name: 'Admin / College Administrator',
    description: 'Full administrative control across all institutional modules, academic structures, and settings.',
    permissionsCount: 125,
  },
  {
    name: 'HOD (Head of Department)',
    description: 'Department leadership, faculty allocations, OBE PO/CO approvals, marks verification, and timetables.',
    permissionsCount: 28,
  },
  {
    name: 'Faculty / Teaching Staff',
    description: 'Classroom teaching, attendance marking, internal marks entry, assignments, and study materials.',
    permissionsCount: 18,
  },
];

/**
 * Ensures standard institutional access groups exist in PostgreSQL for the given tenant.
 * Uses Prisma upsert with compound unique key @@unique([tenantId, name]) for safe idempotency.
 */
export async function seedStandardAccessGroups(prisma: any, tenantId: string): Promise<void> {
  if (!tenantId) return;
  for (const group of STANDARD_ACCESS_GROUPS) {
    try {
      await prisma.accessGroup.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: group.name,
          },
        },
        update: {},
        create: {
          tenantId,
          name: group.name,
          description: group.description,
          permissionsCount: group.permissionsCount,
          createdBy: 'System',
        },
      });
    } catch (e: any) {
      // Ignore conflict if concurrently inserted
    }
  }
}
