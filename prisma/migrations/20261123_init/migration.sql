-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'CAMPUS_ADMIN', 'FACULTY', 'STUDENT', 'PARENT', 'CREATOR', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 1,
    "maxStudents" INTEGER NOT NULL DEFAULT 500,
    "features" TEXT NOT NULL,
    "cmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "obeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "cmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "obeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionEndDate" TIMESTAMP(3),
    "adminEmail" VARCHAR(255),
    "primaryColor" VARCHAR(50) NOT NULL DEFAULT '#7C3AED',
    "primaryHover" VARCHAR(50) NOT NULL DEFAULT '#6D28D9',
    "primaryLight" VARCHAR(50) NOT NULL DEFAULT '#F3E8FF',
    "accentColor" VARCHAR(50) NOT NULL DEFAULT '#06B6D4',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "passwordHash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "rollNumber" VARCHAR(100),
    "employeeCode" VARCHAR(100),
    "program" VARCHAR(255),
    "semester" VARCHAR(50),
    "section" VARCHAR(50),
    "department" VARCHAR(255),
    "designation" VARCHAR(255),
    "studentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" UUID,
    "user" VARCHAR(255) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "details" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "invoiceId" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "headOfDepartment" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'UG',
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "pos" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "startYear" INTEGER NOT NULL DEFAULT 2026,
    "totalCredits" INTEGER NOT NULL DEFAULT 160,
    "passPercentage" DECIMAL(5,2) NOT NULL DEFAULT 40.0,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "academicYearId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "semesterName" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 60,
    "currentEnrolled" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "departmentId" UUID,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "shortName" VARCHAR(50),
    "type" VARCHAR(50) NOT NULL DEFAULT 'Theory',
    "credits" DECIMAL(4,1) NOT NULL DEFAULT 3.0,
    "sessions" INTEGER NOT NULL DEFAULT 45,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_groups" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "permissionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" VARCHAR(100) DEFAULT 'System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_periods" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "periodNumber" INTEGER NOT NULL DEFAULT 1,
    "startTime" VARCHAR(20) NOT NULL,
    "endTime" VARCHAR(20) NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "day" VARCHAR(20) NOT NULL,
    "periodId" UUID NOT NULL,
    "cohortId" UUID,
    "sectionId" UUID,
    "subjectId" UUID NOT NULL,
    "staffId" UUID,
    "room" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_materials" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "cohortId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL DEFAULT 'PDF',
    "fileUrl" TEXT,
    "fileName" VARCHAR(255),
    "uploadedBy" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100),
    "programId" UUID,
    "programName" VARCHAR(255),
    "source" VARCHAR(100) NOT NULL DEFAULT 'Website',
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "assignedTo" VARCHAR(255),
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "applicationNumber" VARCHAR(100) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "programId" UUID,
    "programName" VARCHAR(255),
    "admissionCategory" VARCHAR(100) NOT NULL DEFAULT 'General',
    "qualification" VARCHAR(100),
    "board" VARCHAR(100),
    "passingYear" INTEGER,
    "marks" DECIMAL(5,2),
    "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
    "offerLetterSent" BOOLEAN NOT NULL DEFAULT false,
    "offerLetterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "rollNumber" VARCHAR(100) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "programId" UUID,
    "cohortId" UUID,
    "sectionId" UUID,
    "currentSemester" INTEGER NOT NULL DEFAULT 1,
    "parentName" VARCHAR(255),
    "parentPhone" VARCHAR(50),
    "parentEmail" VARCHAR(255),
    "gender" VARCHAR(20),
    "dob" TIMESTAMP(3),
    "bloodGroup" VARCHAR(10),
    "address" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_categories" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "quotaPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "documentType" VARCHAR(100) NOT NULL,
    "documentName" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "verifiedBy" VARCHAR(255),
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_scholarships" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentProfileId" UUID,
    "applicationId" UUID,
    "studentName" VARCHAR(255) NOT NULL,
    "rollNumber" VARCHAR(100),
    "scholarshipName" VARCHAR(255) NOT NULL,
    "donorName" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'applied',
    "sanctionDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_payments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "applicationId" UUID,
    "receiptNumber" VARCHAR(100) NOT NULL,
    "applicantName" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" VARCHAR(50) NOT NULL DEFAULT 'UPI / QR',
    "gatewayReference" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Completed',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "departmentId" UUID,
    "employeeCode" VARCHAR(100) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "designation" VARCHAR(255) NOT NULL,
    "staffType" VARCHAR(50) NOT NULL DEFAULT 'Teaching',
    "joiningDate" TIMESTAMP(3),
    "qualification" VARCHAR(255),
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "panNumber" VARCHAR(50),
    "bankAccount" VARCHAR(100),
    "bankIfsc" VARCHAR(50),
    "basicSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "leaveType" VARCHAR(50) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "daysCount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "approvedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "totalGross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'processed',
    "disbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "providentFund" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxDeducted" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'generated',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_duties" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "taskName" VARCHAR(255) NOT NULL,
    "assignedBy" VARCHAR(255) NOT NULL DEFAULT 'Dean Academics',
    "dueDate" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_certificates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "certificateType" VARCHAR(100) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatory" VARCHAR(255) NOT NULL DEFAULT 'Registrar & Authorized Signatory',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Issued',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_checklists" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "checklistType" VARCHAR(50) NOT NULL DEFAULT 'Joining',
    "itemName" VARCHAR(255) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_components" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'Earning',
    "calculationType" VARCHAR(50) NOT NULL DEFAULT 'Fixed',
    "defaultAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percentageOf" VARCHAR(50),
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "designationId" VARCHAR(100),
    "designationName" VARCHAR(100) NOT NULL DEFAULT 'All Designations',
    "basicSalary" DECIMAL(12,2) NOT NULL DEFAULT 50000,
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 65000,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 6000,
    "netSalary" DECIMAL(12,2) NOT NULL DEFAULT 59000,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "studentId" UUID,
    "staffId" UUID,
    "subjectId" UUID,
    "sectionId" UUID,
    "periodNumber" INTEGER,
    "status" VARCHAR(50) NOT NULL,
    "remarks" VARCHAR(255),
    "markedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "examType" VARCHAR(50) NOT NULL DEFAULT 'MID_TERM',
    "academicYear" VARCHAR(100) NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATE,
    "endDate" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "startTime" VARCHAR(20) NOT NULL,
    "endTime" VARCHAR(20) NOT NULL,
    "venue" VARCHAR(100),
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "passMarks" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_marks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "marksObtained" DECIMAL(5,2) NOT NULL,
    "maxMarks" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "grade" VARCHAR(10),
    "remarks" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_outcomes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "bloomLevel" VARCHAR(50) NOT NULL DEFAULT 'Understand',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_outcomes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_po_mappings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "coId" UUID NOT NULL,
    "poId" UUID NOT NULL,
    "correlationLevel" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_po_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_attainments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "coId" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "targetPercentage" DECIMAL(5,2) NOT NULL DEFAULT 60.0,
    "attainedPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "academicYear" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_attainments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "academicYear" VARCHAR(100) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_heads" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_types" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,
    "applicableTo" VARCHAR(100) NOT NULL DEFAULT 'All Students',
    "glHead" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_invoices" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255),
    "academicYear" VARCHAR(100),
    "semester" VARCHAR(50),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(12,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "receiptNumber" VARCHAR(100) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentMode" VARCHAR(50) NOT NULL DEFAULT 'UPI',
    "transactionRef" VARCHAR(255),
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daybook_entries" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "entryType" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" VARCHAR(50) NOT NULL DEFAULT 'CASH',
    "description" VARCHAR(255),
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daybook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_heads" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL DEFAULT 'Bank',
    "accountNumber" VARCHAR(100) NOT NULL,
    "ifscCode" VARCHAR(50),
    "branch" VARCHAR(255),
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "voucherNumber" VARCHAR(100) NOT NULL,
    "transactionDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voucherType" VARCHAR(50) NOT NULL DEFAULT 'Payment',
    "transactionType" VARCHAR(50) NOT NULL,
    "headId" UUID,
    "bankAccountId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "partyName" VARCHAR(255),
    "referenceNo" VARCHAR(100),
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'BOYS',
    "location" VARCHAR(255),
    "wardenName" VARCHAR(255),
    "wardenContact" VARCHAR(50),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "hostelId" UUID NOT NULL,
    "roomNumber" VARCHAR(50) NOT NULL,
    "floor" VARCHAR(50) NOT NULL DEFAULT '1st Floor',
    "roomType" VARCHAR(50) NOT NULL DEFAULT 'DOUBLE',
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "occupied" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bedNumber" VARCHAR(50) NOT NULL DEFAULT 'Bed 1',
    "allocatedFrom" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocatedTill" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_outings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "outTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inTime" TIMESTAMP(3),
    "parentApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_outings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleNo" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'Bus',
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "modelYear" VARCHAR(20),
    "fuelType" VARCHAR(50) NOT NULL DEFAULT 'Diesel',
    "driverName" VARCHAR(255),
    "driverPhone" VARCHAR(50),
    "gpsTrackingId" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'In Service',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleId" UUID,
    "routeNumber" VARCHAR(50) NOT NULL,
    "routeName" VARCHAR(255) NOT NULL,
    "startPoint" VARCHAR(255) NOT NULL,
    "endPoint" VARCHAR(255) NOT NULL,
    "departureMorning" VARCHAR(50) DEFAULT '07:15 AM',
    "departureEvening" VARCHAR(50) DEFAULT '04:45 PM',
    "totalKm" DECIMAL(8,2) NOT NULL DEFAULT 25.0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_stops" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "stopName" VARCHAR(255) NOT NULL,
    "pickupTime" VARCHAR(50) NOT NULL,
    "dropTime" VARCHAR(50) NOT NULL,
    "distanceKm" DECIMAL(8,2) NOT NULL DEFAULT 5.0,
    "stopFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_subscriptions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "stopId" UUID NOT NULL,
    "academicYear" VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    "rfidCardNo" VARCHAR(50),
    "feeStatus" VARCHAR(50) NOT NULL DEFAULT 'Paid',
    "annualFee" DECIMAL(10,2) NOT NULL DEFAULT 16000,
    "validTill" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "passNumber" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expenseHead" VARCHAR(100) NOT NULL DEFAULT 'Fuel',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_categories" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "categoryId" UUID,
    "accessionNo" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(255) NOT NULL,
    "isbn" VARCHAR(50),
    "rackNo" VARCHAR(50),
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "publisher" VARCHAR(255),
    "edition" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_issues" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "studentId" UUID,
    "staffId" UUID,
    "issueDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE NOT NULL,
    "returnDate" DATE,
    "fineAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_members" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "memberType" VARCHAR(50) NOT NULL DEFAULT 'student',
    "cardNo" VARCHAR(100) NOT NULL,
    "studentId" UUID,
    "staffId" UUID,
    "maxBooksAllowed" INTEGER NOT NULL DEFAULT 3,
    "validTill" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_periodicals" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'Journal',
    "issn" VARCHAR(50),
    "frequency" VARCHAR(50) NOT NULL DEFAULT 'Monthly',
    "publisher" VARCHAR(255),
    "subscriptionStart" DATE,
    "subscriptionEnd" DATE,
    "annualCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_periodicals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_suppliers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "gstin" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_stock_audits" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "auditDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditorName" VARCHAR(255) NOT NULL,
    "totalPhysical" INTEGER NOT NULL DEFAULT 0,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "damagedCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Completed',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_stock_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_passes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "passNumber" VARCHAR(100) NOT NULL,
    "visitorName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "visitorType" VARCHAR(50) NOT NULL DEFAULT 'Guest',
    "purpose" VARCHAR(255) NOT NULL,
    "personToMeet" VARCHAR(255) NOT NULL,
    "department" VARCHAR(255),
    "inTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outTime" TIMESTAMP(3),
    "idProof" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'inside',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'INWARD',
    "trackingNumber" VARCHAR(100),
    "sender" VARCHAR(255) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "department" VARCHAR(255),
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "front_office_call_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "callerName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "callType" VARCHAR(50) NOT NULL DEFAULT 'INCOMING',
    "purpose" VARCHAR(255) NOT NULL,
    "duration" VARCHAR(50),
    "notes" TEXT,
    "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "front_office_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "front_office_enquiries" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "enquiryNumber" VARCHAR(100) NOT NULL,
    "studentName" VARCHAR(255) NOT NULL,
    "parentName" VARCHAR(255),
    "mobile" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "program" VARCHAR(255) NOT NULL,
    "enquirySource" VARCHAR(100) NOT NULL DEFAULT 'Walk-In',
    "assignedCounsellor" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'New',
    "remarks" TEXT,
    "followups" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "front_office_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_subject_allocations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "cohortId" UUID,
    "sectionId" UUID,
    "semesterId" UUID,
    "cohortName" VARCHAR(255),
    "semesterName" VARCHAR(100),
    "academicYear" VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_subject_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "allocationId" UUID,
    "staffId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "cohortName" VARCHAR(255) NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodNumber" INTEGER NOT NULL DEFAULT 1,
    "topicTaught" TEXT NOT NULL,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "presentStudents" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_attendances" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    "remarks" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "period_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuous_assessments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cohortName" VARCHAR(255) NOT NULL,
    "examType" VARCHAR(100) NOT NULL DEFAULT 'Internal Assessment',
    "maxMarks" DECIMAL(5,2) NOT NULL DEFAULT 25.0,
    "weightage" DECIMAL(5,2) NOT NULL DEFAULT 20.0,
    "assessmentDate" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "continuous_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuous_assessment_marks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "remarks" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "continuous_assessment_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "unitNumber" INTEGER NOT NULL DEFAULT 1,
    "unitTitle" VARCHAR(255),
    "topicTitle" VARCHAR(255) NOT NULL,
    "plannedSessions" INTEGER NOT NULL DEFAULT 1,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'General',
    "level" VARCHAR(50) NOT NULL DEFAULT 'Beginner',
    "thumbnail" VARCHAR(500),
    "instructorId" UUID,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_modules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_lessons" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(50) NOT NULL DEFAULT 'VIDEO',
    "videoUrl" VARCHAR(500),
    "durationMinutes" INTEGER NOT NULL DEFAULT 10,
    "textContent" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_enrollments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "progressPct" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbt_exam_sessions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "examType" VARCHAR(50) NOT NULL DEFAULT 'ONLINE_CBT',
    "totalDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "remainingSeconds" INTEGER NOT NULL DEFAULT 3600,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DECIMAL(5,2),
    "totalQuestions" INTEGER NOT NULL DEFAULT 20,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cbt_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "studentId" UUID NOT NULL,
    "fatherName" VARCHAR(255) NOT NULL,
    "motherName" VARCHAR(255),
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "occupation" VARCHAR(100),
    "relationship" VARCHAR(50) NOT NULL DEFAULT 'Parent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_remarks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
    "remark" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_backlogs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "examId" UUID,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "attempt" INTEGER NOT NULL DEFAULT 2,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_backlogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbt_quizzes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subjectId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "totalMarks" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
    "passMarks" DECIMAL(5,2) NOT NULL DEFAULT 12.0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cbt_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbt_quiz_questions" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL,
    "correctOption" INTEGER NOT NULL DEFAULT 0,
    "points" DECIMAL(4,1) NOT NULL DEFAULT 5.0,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cbt_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_companies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "industry" VARCHAR(150) NOT NULL,
    "tier" VARCHAR(50) NOT NULL DEFAULT 'Tier 1',
    "hrName" VARCHAR(100),
    "hrEmail" VARCHAR(255),
    "hrPhone" VARCHAR(50),
    "website" VARCHAR(255),
    "location" VARCHAR(255),
    "mouSigned" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_drives" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "jobRole" VARCHAR(150) NOT NULL,
    "ctcDetails" VARCHAR(100),
    "ctcNumeric" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "driveDate" DATE,
    "deadlineDate" DATE,
    "requiredCgpa" DECIMAL(3,1) NOT NULL DEFAULT 6.5,
    "maxBacklogs" INTEGER NOT NULL DEFAULT 0,
    "location" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "driveId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "currentRound" VARCHAR(150) NOT NULL DEFAULT 'Round 1: Online Assessment',
    "status" VARCHAR(50) NOT NULL DEFAULT 'In Progress',
    "resumeUrl" VARCHAR(500),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_offers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "jobRole" VARCHAR(150) NOT NULL,
    "ctc" DECIMAL(12,2) NOT NULL,
    "offerDate" DATE,
    "offerLetterRef" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Accepted',
    "department" VARCHAR(150),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_postings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "roleTitle" VARCHAR(150) NOT NULL,
    "workMode" VARCHAR(50) NOT NULL DEFAULT 'Hybrid',
    "location" VARCHAR(255),
    "stipendAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "totalSeats" INTEGER NOT NULL DEFAULT 5,
    "availableSeats" INTEGER NOT NULL DEFAULT 5,
    "startDate" DATE,
    "endDate" DATE,
    "milestonesJson" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_certificate_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID,
    "certificateType" VARCHAR(150) NOT NULL,
    "reason" TEXT NOT NULL,
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'Free',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Under Review',
    "issuedDate" DATE,
    "downloadUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_complaints" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID,
    "category" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'In Progress',
    "resolutionRemarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_feedbacks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID,
    "subjectId" UUID,
    "subjectName" VARCHAR(255),
    "facultyName" VARCHAR(255),
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comments" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_notices" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tag" VARCHAR(50) NOT NULL DEFAULT 'Official',
    "tagColor" VARCHAR(50),
    "description" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_exam_registrations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "studentId" UUID,
    "examId" UUID,
    "examName" VARCHAR(255) NOT NULL,
    "examType" VARCHAR(100) NOT NULL,
    "hallTicketNumber" VARCHAR(100) NOT NULL,
    "feeStatus" VARCHAR(100) NOT NULL DEFAULT 'Paid (₹3,500)',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_exam_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_code_idx" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "tenants_domain_idx" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_rollNumber_key" ON "users"("tenantId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_employeeCode_key" ON "users"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_idx" ON "activity_logs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoiceId_key" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_isRead_idx" ON "notifications"("tenantId", "userId", "isRead");

-- CreateIndex
CREATE INDEX "departments_tenantId_idx" ON "departments"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenantId_code_key" ON "departments"("tenantId", "code");

-- CreateIndex
CREATE INDEX "programs_tenantId_idx" ON "programs"("tenantId");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_tenantId_code_key" ON "programs"("tenantId", "code");

-- CreateIndex
CREATE INDEX "academic_years_tenantId_idx" ON "academic_years"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_tenantId_name_key" ON "academic_years"("tenantId", "name");

-- CreateIndex
CREATE INDEX "semesters_tenantId_idx" ON "semesters"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_tenantId_sequence_key" ON "semesters"("tenantId", "sequence");

-- CreateIndex
CREATE INDEX "regulations_tenantId_idx" ON "regulations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "regulations_tenantId_code_key" ON "regulations"("tenantId", "code");

-- CreateIndex
CREATE INDEX "cohorts_tenantId_idx" ON "cohorts"("tenantId");

-- CreateIndex
CREATE INDEX "cohorts_programId_idx" ON "cohorts"("programId");

-- CreateIndex
CREATE INDEX "sections_tenantId_idx" ON "sections"("tenantId");

-- CreateIndex
CREATE INDEX "sections_cohortId_idx" ON "sections"("cohortId");

-- CreateIndex
CREATE INDEX "subjects_tenantId_idx" ON "subjects"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenantId_code_key" ON "subjects"("tenantId", "code");

-- CreateIndex
CREATE INDEX "access_groups_tenantId_idx" ON "access_groups"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "access_groups_tenantId_name_key" ON "access_groups"("tenantId", "name");

-- CreateIndex
CREATE INDEX "timetable_periods_tenantId_idx" ON "timetable_periods"("tenantId");

-- CreateIndex
CREATE INDEX "timetable_slots_tenantId_idx" ON "timetable_slots"("tenantId");

-- CreateIndex
CREATE INDEX "timetable_slots_periodId_idx" ON "timetable_slots"("periodId");

-- CreateIndex
CREATE INDEX "timetable_slots_sectionId_idx" ON "timetable_slots"("sectionId");

-- CreateIndex
CREATE INDEX "timetable_slots_subjectId_idx" ON "timetable_slots"("subjectId");

-- CreateIndex
CREATE INDEX "timetable_slots_staffId_idx" ON "timetable_slots"("staffId");

-- CreateIndex
CREATE INDEX "study_materials_tenantId_idx" ON "study_materials"("tenantId");

-- CreateIndex
CREATE INDEX "study_materials_subjectId_idx" ON "study_materials"("subjectId");

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "applications_tenantId_idx" ON "applications"("tenantId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_tenantId_applicationNumber_key" ON "applications"("tenantId", "applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_tenantId_idx" ON "student_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "student_profiles_programId_idx" ON "student_profiles"("programId");

-- CreateIndex
CREATE INDEX "student_profiles_cohortId_idx" ON "student_profiles"("cohortId");

-- CreateIndex
CREATE INDEX "student_profiles_status_idx" ON "student_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_tenantId_rollNumber_key" ON "student_profiles"("tenantId", "rollNumber");

-- CreateIndex
CREATE INDEX "admission_categories_tenantId_idx" ON "admission_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "admission_categories_tenantId_code_key" ON "admission_categories"("tenantId", "code");

-- CreateIndex
CREATE INDEX "admission_documents_tenantId_applicationId_idx" ON "admission_documents"("tenantId", "applicationId");

-- CreateIndex
CREATE INDEX "admission_scholarships_tenantId_idx" ON "admission_scholarships"("tenantId");

-- CreateIndex
CREATE INDEX "admission_payments_tenantId_idx" ON "admission_payments"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "admission_payments_tenantId_receiptNumber_key" ON "admission_payments"("tenantId", "receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE INDEX "staff_profiles_tenantId_idx" ON "staff_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "staff_profiles_departmentId_idx" ON "staff_profiles"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_tenantId_employeeCode_key" ON "staff_profiles"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "leave_applications_tenantId_idx" ON "leave_applications"("tenantId");

-- CreateIndex
CREATE INDEX "leave_applications_staffId_idx" ON "leave_applications"("staffId");

-- CreateIndex
CREATE INDEX "leave_applications_status_idx" ON "leave_applications"("status");

-- CreateIndex
CREATE INDEX "payroll_runs_tenantId_idx" ON "payroll_runs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_tenantId_month_year_key" ON "payroll_runs"("tenantId", "month", "year");

-- CreateIndex
CREATE INDEX "payslips_tenantId_idx" ON "payslips"("tenantId");

-- CreateIndex
CREATE INDEX "payslips_staffId_idx" ON "payslips"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollRunId_staffId_key" ON "payslips"("payrollRunId", "staffId");

-- CreateIndex
CREATE INDEX "staff_duties_tenantId_idx" ON "staff_duties"("tenantId");

-- CreateIndex
CREATE INDEX "staff_duties_staffId_idx" ON "staff_duties"("staffId");

-- CreateIndex
CREATE INDEX "staff_certificates_tenantId_idx" ON "staff_certificates"("tenantId");

-- CreateIndex
CREATE INDEX "staff_certificates_staffId_idx" ON "staff_certificates"("staffId");

-- CreateIndex
CREATE INDEX "staff_checklists_tenantId_idx" ON "staff_checklists"("tenantId");

-- CreateIndex
CREATE INDEX "staff_checklists_staffId_idx" ON "staff_checklists"("staffId");

-- CreateIndex
CREATE INDEX "payroll_components_tenantId_idx" ON "payroll_components"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_components_tenantId_code_key" ON "payroll_components"("tenantId", "code");

-- CreateIndex
CREATE INDEX "salary_structures_tenantId_idx" ON "salary_structures"("tenantId");

-- CreateIndex
CREATE INDEX "attendance_records_tenantId_idx" ON "attendance_records"("tenantId");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE INDEX "attendance_records_entityType_studentId_idx" ON "attendance_records"("entityType", "studentId");

-- CreateIndex
CREATE INDEX "attendance_records_entityType_staffId_idx" ON "attendance_records"("entityType", "staffId");

-- CreateIndex
CREATE INDEX "exams_tenantId_idx" ON "exams"("tenantId");

-- CreateIndex
CREATE INDEX "exam_schedules_tenantId_idx" ON "exam_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "exam_schedules_examId_idx" ON "exam_schedules"("examId");

-- CreateIndex
CREATE INDEX "exam_schedules_subjectId_idx" ON "exam_schedules"("subjectId");

-- CreateIndex
CREATE INDEX "exam_marks_tenantId_idx" ON "exam_marks"("tenantId");

-- CreateIndex
CREATE INDEX "exam_marks_studentId_idx" ON "exam_marks"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_marks_scheduleId_studentId_key" ON "exam_marks"("scheduleId", "studentId");

-- CreateIndex
CREATE INDEX "course_outcomes_tenantId_idx" ON "course_outcomes"("tenantId");

-- CreateIndex
CREATE INDEX "course_outcomes_subjectId_idx" ON "course_outcomes"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "course_outcomes_subjectId_code_key" ON "course_outcomes"("subjectId", "code");

-- CreateIndex
CREATE INDEX "program_outcomes_tenantId_idx" ON "program_outcomes"("tenantId");

-- CreateIndex
CREATE INDEX "program_outcomes_programId_idx" ON "program_outcomes"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "program_outcomes_programId_code_key" ON "program_outcomes"("programId", "code");

-- CreateIndex
CREATE INDEX "co_po_mappings_tenantId_idx" ON "co_po_mappings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "co_po_mappings_coId_poId_key" ON "co_po_mappings"("coId", "poId");

-- CreateIndex
CREATE INDEX "co_attainments_tenantId_idx" ON "co_attainments"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "co_attainments_coId_cohortId_academicYear_key" ON "co_attainments"("coId", "cohortId", "academicYear");

-- CreateIndex
CREATE INDEX "fee_structures_tenantId_idx" ON "fee_structures"("tenantId");

-- CreateIndex
CREATE INDEX "fee_structures_programId_idx" ON "fee_structures"("programId");

-- CreateIndex
CREATE INDEX "fee_heads_structureId_idx" ON "fee_heads"("structureId");

-- CreateIndex
CREATE INDEX "fee_types_tenantId_idx" ON "fee_types"("tenantId");

-- CreateIndex
CREATE INDEX "student_invoices_tenantId_idx" ON "student_invoices"("tenantId");

-- CreateIndex
CREATE INDEX "student_invoices_studentId_idx" ON "student_invoices"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_invoices_tenantId_invoiceNumber_key" ON "student_invoices"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "fee_payments_tenantId_idx" ON "fee_payments"("tenantId");

-- CreateIndex
CREATE INDEX "fee_payments_invoiceId_idx" ON "fee_payments"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_tenantId_receiptNumber_key" ON "fee_payments"("tenantId", "receiptNumber");

-- CreateIndex
CREATE INDEX "daybook_entries_tenantId_idx" ON "daybook_entries"("tenantId");

-- CreateIndex
CREATE INDEX "daybook_entries_date_idx" ON "daybook_entries"("date");

-- CreateIndex
CREATE INDEX "account_heads_tenantId_idx" ON "account_heads"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "account_heads_tenantId_code_key" ON "account_heads"("tenantId", "code");

-- CreateIndex
CREATE INDEX "bank_accounts_tenantId_idx" ON "bank_accounts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_tenantId_accountNumber_key" ON "bank_accounts"("tenantId", "accountNumber");

-- CreateIndex
CREATE INDEX "financial_transactions_tenantId_idx" ON "financial_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "financial_transactions_transactionDate_idx" ON "financial_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "financial_transactions_headId_idx" ON "financial_transactions"("headId");

-- CreateIndex
CREATE INDEX "financial_transactions_bankAccountId_idx" ON "financial_transactions"("bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_tenantId_voucherNumber_key" ON "financial_transactions"("tenantId", "voucherNumber");

-- CreateIndex
CREATE INDEX "hostels_tenantId_idx" ON "hostels"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_tenantId_name_key" ON "hostels"("tenantId", "name");

-- CreateIndex
CREATE INDEX "hostel_rooms_tenantId_idx" ON "hostel_rooms"("tenantId");

-- CreateIndex
CREATE INDEX "hostel_rooms_hostelId_idx" ON "hostel_rooms"("hostelId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_tenantId_hostelId_roomNumber_key" ON "hostel_rooms"("tenantId", "hostelId", "roomNumber");

-- CreateIndex
CREATE INDEX "hostel_allocations_tenantId_idx" ON "hostel_allocations"("tenantId");

-- CreateIndex
CREATE INDEX "hostel_allocations_roomId_idx" ON "hostel_allocations"("roomId");

-- CreateIndex
CREATE INDEX "hostel_allocations_studentId_idx" ON "hostel_allocations"("studentId");

-- CreateIndex
CREATE INDEX "hostel_outings_tenantId_idx" ON "hostel_outings"("tenantId");

-- CreateIndex
CREATE INDEX "hostel_outings_studentId_idx" ON "hostel_outings"("studentId");

-- CreateIndex
CREATE INDEX "transport_vehicles_tenantId_idx" ON "transport_vehicles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_vehicles_tenantId_vehicleNo_key" ON "transport_vehicles"("tenantId", "vehicleNo");

-- CreateIndex
CREATE INDEX "transport_routes_tenantId_idx" ON "transport_routes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_tenantId_routeNumber_key" ON "transport_routes"("tenantId", "routeNumber");

-- CreateIndex
CREATE INDEX "transport_stops_tenantId_idx" ON "transport_stops"("tenantId");

-- CreateIndex
CREATE INDEX "transport_stops_routeId_idx" ON "transport_stops"("routeId");

-- CreateIndex
CREATE INDEX "transport_subscriptions_tenantId_idx" ON "transport_subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "transport_subscriptions_studentId_idx" ON "transport_subscriptions"("studentId");

-- CreateIndex
CREATE INDEX "transport_subscriptions_routeId_idx" ON "transport_subscriptions"("routeId");

-- CreateIndex
CREATE INDEX "transport_logs_tenantId_idx" ON "transport_logs"("tenantId");

-- CreateIndex
CREATE INDEX "transport_logs_vehicleId_idx" ON "transport_logs"("vehicleId");

-- CreateIndex
CREATE INDEX "library_categories_tenantId_idx" ON "library_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_tenantId_name_key" ON "library_categories"("tenantId", "name");

-- CreateIndex
CREATE INDEX "library_books_tenantId_idx" ON "library_books"("tenantId");

-- CreateIndex
CREATE INDEX "library_books_categoryId_idx" ON "library_books"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_tenantId_accessionNo_key" ON "library_books"("tenantId", "accessionNo");

-- CreateIndex
CREATE INDEX "library_issues_tenantId_idx" ON "library_issues"("tenantId");

-- CreateIndex
CREATE INDEX "library_issues_bookId_idx" ON "library_issues"("bookId");

-- CreateIndex
CREATE INDEX "library_issues_studentId_idx" ON "library_issues"("studentId");

-- CreateIndex
CREATE INDEX "library_issues_staffId_idx" ON "library_issues"("staffId");

-- CreateIndex
CREATE INDEX "library_members_tenantId_idx" ON "library_members"("tenantId");

-- CreateIndex
CREATE INDEX "library_members_studentId_idx" ON "library_members"("studentId");

-- CreateIndex
CREATE INDEX "library_members_staffId_idx" ON "library_members"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "library_members_tenantId_cardNo_key" ON "library_members"("tenantId", "cardNo");

-- CreateIndex
CREATE INDEX "library_periodicals_tenantId_idx" ON "library_periodicals"("tenantId");

-- CreateIndex
CREATE INDEX "library_suppliers_tenantId_idx" ON "library_suppliers"("tenantId");

-- CreateIndex
CREATE INDEX "library_stock_audits_tenantId_idx" ON "library_stock_audits"("tenantId");

-- CreateIndex
CREATE INDEX "visitor_passes_tenantId_idx" ON "visitor_passes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_passes_tenantId_passNumber_key" ON "visitor_passes"("tenantId", "passNumber");

-- CreateIndex
CREATE INDEX "postal_records_tenantId_idx" ON "postal_records"("tenantId");

-- CreateIndex
CREATE INDEX "front_office_call_logs_tenantId_idx" ON "front_office_call_logs"("tenantId");

-- CreateIndex
CREATE INDEX "front_office_enquiries_tenantId_idx" ON "front_office_enquiries"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "front_office_enquiries_tenantId_enquiryNumber_key" ON "front_office_enquiries"("tenantId", "enquiryNumber");

-- CreateIndex
CREATE INDEX "faculty_subject_allocations_tenantId_idx" ON "faculty_subject_allocations"("tenantId");

-- CreateIndex
CREATE INDEX "faculty_subject_allocations_staffId_idx" ON "faculty_subject_allocations"("staffId");

-- CreateIndex
CREATE INDEX "faculty_subject_allocations_subjectId_idx" ON "faculty_subject_allocations"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_subject_allocations_tenantId_staffId_subjectId_acad_key" ON "faculty_subject_allocations"("tenantId", "staffId", "subjectId", "academicYear");

-- CreateIndex
CREATE INDEX "class_sessions_tenantId_idx" ON "class_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "class_sessions_staffId_idx" ON "class_sessions"("staffId");

-- CreateIndex
CREATE INDEX "class_sessions_subjectId_idx" ON "class_sessions"("subjectId");

-- CreateIndex
CREATE INDEX "class_sessions_sessionDate_idx" ON "class_sessions"("sessionDate");

-- CreateIndex
CREATE INDEX "period_attendances_tenantId_idx" ON "period_attendances"("tenantId");

-- CreateIndex
CREATE INDEX "period_attendances_sessionId_idx" ON "period_attendances"("sessionId");

-- CreateIndex
CREATE INDEX "period_attendances_studentId_idx" ON "period_attendances"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "period_attendances_tenantId_sessionId_studentId_key" ON "period_attendances"("tenantId", "sessionId", "studentId");

-- CreateIndex
CREATE INDEX "continuous_assessments_tenantId_idx" ON "continuous_assessments"("tenantId");

-- CreateIndex
CREATE INDEX "continuous_assessments_subjectId_idx" ON "continuous_assessments"("subjectId");

-- CreateIndex
CREATE INDEX "continuous_assessment_marks_tenantId_idx" ON "continuous_assessment_marks"("tenantId");

-- CreateIndex
CREATE INDEX "continuous_assessment_marks_assessmentId_idx" ON "continuous_assessment_marks"("assessmentId");

-- CreateIndex
CREATE INDEX "continuous_assessment_marks_studentId_idx" ON "continuous_assessment_marks"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "continuous_assessment_marks_tenantId_assessmentId_studentId_key" ON "continuous_assessment_marks"("tenantId", "assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "lesson_plans_tenantId_idx" ON "lesson_plans"("tenantId");

-- CreateIndex
CREATE INDEX "lesson_plans_subjectId_idx" ON "lesson_plans"("subjectId");

-- CreateIndex
CREATE INDEX "lesson_plans_staffId_idx" ON "lesson_plans"("staffId");

-- CreateIndex
CREATE INDEX "lms_courses_tenantId_idx" ON "lms_courses"("tenantId");

-- CreateIndex
CREATE INDEX "lms_courses_category_idx" ON "lms_courses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "lms_courses_tenantId_slug_key" ON "lms_courses"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "lms_course_modules_tenantId_idx" ON "lms_course_modules"("tenantId");

-- CreateIndex
CREATE INDEX "lms_course_modules_courseId_idx" ON "lms_course_modules"("courseId");

-- CreateIndex
CREATE INDEX "lms_course_lessons_tenantId_idx" ON "lms_course_lessons"("tenantId");

-- CreateIndex
CREATE INDEX "lms_course_lessons_moduleId_idx" ON "lms_course_lessons"("moduleId");

-- CreateIndex
CREATE INDEX "lms_course_enrollments_tenantId_idx" ON "lms_course_enrollments"("tenantId");

-- CreateIndex
CREATE INDEX "lms_course_enrollments_courseId_idx" ON "lms_course_enrollments"("courseId");

-- CreateIndex
CREATE INDEX "lms_course_enrollments_studentId_idx" ON "lms_course_enrollments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_course_enrollments_tenantId_courseId_studentId_key" ON "lms_course_enrollments"("tenantId", "courseId", "studentId");

-- CreateIndex
CREATE INDEX "cbt_exam_sessions_tenantId_idx" ON "cbt_exam_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "cbt_exam_sessions_studentId_idx" ON "cbt_exam_sessions"("studentId");

-- CreateIndex
CREATE INDEX "cbt_exam_sessions_status_idx" ON "cbt_exam_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");

-- CreateIndex
CREATE INDEX "parent_profiles_tenantId_idx" ON "parent_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "parent_profiles_studentId_idx" ON "parent_profiles"("studentId");

-- CreateIndex
CREATE INDEX "parent_remarks_tenantId_idx" ON "parent_remarks"("tenantId");

-- CreateIndex
CREATE INDEX "parent_remarks_studentId_idx" ON "parent_remarks"("studentId");

-- CreateIndex
CREATE INDEX "parent_remarks_staffId_idx" ON "parent_remarks"("staffId");

-- CreateIndex
CREATE INDEX "exam_backlogs_tenantId_idx" ON "exam_backlogs"("tenantId");

-- CreateIndex
CREATE INDEX "exam_backlogs_studentId_idx" ON "exam_backlogs"("studentId");

-- CreateIndex
CREATE INDEX "exam_backlogs_subjectId_idx" ON "exam_backlogs"("subjectId");

-- CreateIndex
CREATE INDEX "exam_backlogs_status_idx" ON "exam_backlogs"("status");

-- CreateIndex
CREATE INDEX "cbt_quizzes_tenantId_idx" ON "cbt_quizzes"("tenantId");

-- CreateIndex
CREATE INDEX "cbt_quizzes_subjectId_idx" ON "cbt_quizzes"("subjectId");

-- CreateIndex
CREATE INDEX "cbt_quiz_questions_quizId_idx" ON "cbt_quiz_questions"("quizId");

-- CreateIndex
CREATE INDEX "placement_companies_tenantId_idx" ON "placement_companies"("tenantId");

-- CreateIndex
CREATE INDEX "placement_companies_tier_idx" ON "placement_companies"("tier");

-- CreateIndex
CREATE INDEX "placement_drives_tenantId_idx" ON "placement_drives"("tenantId");

-- CreateIndex
CREATE INDEX "placement_drives_companyId_idx" ON "placement_drives"("companyId");

-- CreateIndex
CREATE INDEX "placement_drives_status_idx" ON "placement_drives"("status");

-- CreateIndex
CREATE INDEX "placement_applications_tenantId_idx" ON "placement_applications"("tenantId");

-- CreateIndex
CREATE INDEX "placement_applications_driveId_idx" ON "placement_applications"("driveId");

-- CreateIndex
CREATE INDEX "placement_applications_studentId_idx" ON "placement_applications"("studentId");

-- CreateIndex
CREATE INDEX "placement_applications_status_idx" ON "placement_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_applications_tenantId_driveId_studentId_key" ON "placement_applications"("tenantId", "driveId", "studentId");

-- CreateIndex
CREATE INDEX "placement_offers_tenantId_idx" ON "placement_offers"("tenantId");

-- CreateIndex
CREATE INDEX "placement_offers_studentId_idx" ON "placement_offers"("studentId");

-- CreateIndex
CREATE INDEX "placement_offers_companyId_idx" ON "placement_offers"("companyId");

-- CreateIndex
CREATE INDEX "placement_offers_status_idx" ON "placement_offers"("status");

-- CreateIndex
CREATE INDEX "internship_postings_tenantId_idx" ON "internship_postings"("tenantId");

-- CreateIndex
CREATE INDEX "internship_postings_status_idx" ON "internship_postings"("status");

-- CreateIndex
CREATE INDEX "student_certificate_requests_tenantId_idx" ON "student_certificate_requests"("tenantId");

-- CreateIndex
CREATE INDEX "student_certificate_requests_studentId_idx" ON "student_certificate_requests"("studentId");

-- CreateIndex
CREATE INDEX "student_complaints_tenantId_idx" ON "student_complaints"("tenantId");

-- CreateIndex
CREATE INDEX "student_complaints_studentId_idx" ON "student_complaints"("studentId");

-- CreateIndex
CREATE INDEX "student_feedbacks_tenantId_idx" ON "student_feedbacks"("tenantId");

-- CreateIndex
CREATE INDEX "student_feedbacks_studentId_idx" ON "student_feedbacks"("studentId");

-- CreateIndex
CREATE INDEX "academic_notices_tenantId_idx" ON "academic_notices"("tenantId");

-- CreateIndex
CREATE INDEX "student_exam_registrations_tenantId_idx" ON "student_exam_registrations"("tenantId");

-- CreateIndex
CREATE INDEX "student_exam_registrations_studentId_idx" ON "student_exam_registrations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_groups" ADD CONSTRAINT "access_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_periods" ADD CONSTRAINT "timetable_periods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "timetable_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_categories" ADD CONSTRAINT "admission_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_scholarships" ADD CONSTRAINT "admission_scholarships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_scholarships" ADD CONSTRAINT "admission_scholarships_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_duties" ADD CONSTRAINT "staff_duties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_duties" ADD CONSTRAINT "staff_duties_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_certificates" ADD CONSTRAINT "staff_certificates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_certificates" ADD CONSTRAINT "staff_certificates_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_checklists" ADD CONSTRAINT "staff_checklists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_checklists" ADD CONSTRAINT "staff_checklists_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_components" ADD CONSTRAINT "payroll_components_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_outcomes" ADD CONSTRAINT "course_outcomes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_outcomes" ADD CONSTRAINT "course_outcomes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_outcomes" ADD CONSTRAINT "program_outcomes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_outcomes" ADD CONSTRAINT "program_outcomes_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_po_mappings" ADD CONSTRAINT "co_po_mappings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_po_mappings" ADD CONSTRAINT "co_po_mappings_coId_fkey" FOREIGN KEY ("coId") REFERENCES "course_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_po_mappings" ADD CONSTRAINT "co_po_mappings_poId_fkey" FOREIGN KEY ("poId") REFERENCES "program_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_attainments" ADD CONSTRAINT "co_attainments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_attainments" ADD CONSTRAINT "co_attainments_coId_fkey" FOREIGN KEY ("coId") REFERENCES "course_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_attainments" ADD CONSTRAINT "co_attainments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_types" ADD CONSTRAINT "fee_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "student_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daybook_entries" ADD CONSTRAINT "daybook_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_heads" ADD CONSTRAINT "account_heads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "account_heads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_outings" ADD CONSTRAINT "hostel_outings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_outings" ADD CONSTRAINT "hostel_outings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transport_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_logs" ADD CONSTRAINT "transport_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_logs" ADD CONSTRAINT "transport_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_categories" ADD CONSTRAINT "library_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "library_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_periodicals" ADD CONSTRAINT "library_periodicals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_suppliers" ADD CONSTRAINT "library_suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_stock_audits" ADD CONSTRAINT "library_stock_audits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postal_records" ADD CONSTRAINT "postal_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_office_call_logs" ADD CONSTRAINT "front_office_call_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_office_enquiries" ADD CONSTRAINT "front_office_enquiries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_subject_allocations" ADD CONSTRAINT "faculty_subject_allocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_subject_allocations" ADD CONSTRAINT "faculty_subject_allocations_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_subject_allocations" ADD CONSTRAINT "faculty_subject_allocations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "faculty_subject_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_attendances" ADD CONSTRAINT "period_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_attendances" ADD CONSTRAINT "period_attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_attendances" ADD CONSTRAINT "period_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuous_assessments" ADD CONSTRAINT "continuous_assessments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuous_assessments" ADD CONSTRAINT "continuous_assessments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuous_assessment_marks" ADD CONSTRAINT "continuous_assessment_marks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuous_assessment_marks" ADD CONSTRAINT "continuous_assessment_marks_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "continuous_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuous_assessment_marks" ADD CONSTRAINT "continuous_assessment_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_modules" ADD CONSTRAINT "lms_course_modules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_modules" ADD CONSTRAINT "lms_course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_lessons" ADD CONSTRAINT "lms_course_lessons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_lessons" ADD CONSTRAINT "lms_course_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "lms_course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_enrollments" ADD CONSTRAINT "lms_course_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_enrollments" ADD CONSTRAINT "lms_course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_enrollments" ADD CONSTRAINT "lms_course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbt_exam_sessions" ADD CONSTRAINT "cbt_exam_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbt_exam_sessions" ADD CONSTRAINT "cbt_exam_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_remarks" ADD CONSTRAINT "parent_remarks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_remarks" ADD CONSTRAINT "parent_remarks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_remarks" ADD CONSTRAINT "parent_remarks_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_backlogs" ADD CONSTRAINT "exam_backlogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_backlogs" ADD CONSTRAINT "exam_backlogs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_backlogs" ADD CONSTRAINT "exam_backlogs_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_backlogs" ADD CONSTRAINT "exam_backlogs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbt_quizzes" ADD CONSTRAINT "cbt_quizzes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbt_quizzes" ADD CONSTRAINT "cbt_quizzes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cbt_quiz_questions" ADD CONSTRAINT "cbt_quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "cbt_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_companies" ADD CONSTRAINT "placement_companies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "placement_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "placement_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_postings" ADD CONSTRAINT "internship_postings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_certificate_requests" ADD CONSTRAINT "student_certificate_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_complaints" ADD CONSTRAINT "student_complaints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_feedbacks" ADD CONSTRAINT "student_feedbacks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_notices" ADD CONSTRAINT "academic_notices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exam_registrations" ADD CONSTRAINT "student_exam_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

