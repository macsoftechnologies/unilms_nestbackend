import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRuns(tenantId: string) {
    const count = await this.prisma.payrollRun.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialPayrollRun(tenantId);
    }

    return this.prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        _count: { select: { payslips: true } },
      },
    });
  }

  async generatePayrollRun(tenantId: string, dto: { month: number | string; year: number | string; title?: string }) {
    const monthMap: Record<string, number> = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };

    let month = typeof dto.month === 'string' && monthMap[dto.month.toLowerCase().trim()] 
      ? monthMap[dto.month.toLowerCase().trim()] 
      : parseInt(String(dto.month), 10);
    const year = parseInt(String(dto.year), 10);

    if (!month || isNaN(month) || !year || isNaN(year)) {
      throw new BadRequestException('Month and year are required.');
    }

    const existing = await this.prisma.payrollRun.findUnique({
      where: {
        tenantId_month_year: { tenantId, month, year },
      },
    });

    if (existing) {
      throw new ConflictException(`Payroll run for ${month}/${year} has already been processed.`);
    }

    // Get active staff members
    let staffList = await this.prisma.staffProfile.findMany({
      where: { tenantId, status: 'active' },
    });

    if (staffList.length === 0) {
      // If no staff, fetch any staff
      staffList = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    }

    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const title = dto.title || `${monthNames[month] || month} ${year} Monthly Payroll`;

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const payslipsData = staffList.map((staff) => {
      const basic = Number(staff.basicSalary) || 50000;
      const da = Math.round(basic * 0.5);
      const hra = Math.round(basic * 0.27);
      const allowances = Math.round(basic * 0.1);
      const pf = Math.round(basic * 0.12);
      const tax = basic > 60000 ? Math.round(basic * 0.1) : 0;
      const deductions = pf + tax + 200; // includes professional tax 200
      const gross = basic + da + hra + allowances;
      const net = gross - deductions;

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;

      return {
        staffId: staff.id,
        basicSalary: basic,
        hra,
        allowances,
        providentFund: pf,
        taxDeducted: tax,
        deductions,
        netSalary: net,
        status: 'generated',
      };
    });

    return this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          month,
          year,
          title,
          totalGross,
          totalDeductions,
          totalNet,
          staffCount: staffList.length,
          status: 'processed',
        },
      });

      if (payslipsData.length > 0) {
        await tx.payslip.createMany({
          data: payslipsData.map((p) => ({
            tenantId,
            payrollRunId: run.id,
            ...p,
          })),
        });
      }

      return run;
    });
  }

  async findAllPayslips(tenantId: string, query?: { payrollRunId?: string; staffId?: string }) {
    // If no payslips exist at all, trigger findAllRuns to auto-seed run + payslips
    const count = await this.prisma.payslip.count({ where: { tenantId } });
    if (count === 0) {
      await this.findAllRuns(tenantId);
    }

    const where: any = { tenantId };

    if (query?.payrollRunId) {
      where.payrollRunId = query.payrollRunId;
    }
    if (query?.staffId) {
      where.staffId = query.staffId;
    }

    return this.prisma.payslip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        payrollRun: {
          select: {
            month: true,
            year: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async disbursePayroll(tenantId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException(`Payroll run #${runId} not found.`);
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.payrollRun.update({
        where: { id: runId },
        data: { status: 'disbursed', disbursedAt: now },
      }),
      this.prisma.payslip.updateMany({
        where: { payrollRunId: runId, tenantId },
        data: { status: 'PAID', paidAt: now },
      }),
    ]);

    return { success: true, message: 'Payroll disbursed and all payslips marked as paid.' };
  }

  // ==========================================
  // PAYROLL COMPONENTS
  // ==========================================
  async findAllComponents(tenantId: string) {
    const count = await this.prisma.payrollComponent.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialComponents(tenantId);
    }

    return this.prisma.payrollComponent.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createComponent(tenantId: string, dto: any) {
    const name = (dto.name || '').trim();
    const code = (dto.code || '').trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Component name and code are required.');
    }

    return this.prisma.payrollComponent.create({
      data: {
        tenantId,
        name,
        code,
        type: dto.type || 'Earning',
        calculationType: dto.calculationType || dto.calculation_type || 'Fixed',
        defaultAmount: dto.defaultAmount || dto.default_amount ? parseFloat(dto.defaultAmount || dto.default_amount) : 0,
        percentageOf: dto.percentageOf || dto.percentage_of || null,
        isTaxable: dto.isTaxable !== undefined ? Boolean(dto.isTaxable) : (dto.is_taxable !== undefined ? Boolean(dto.is_taxable) : true),
      },
    });
  }

  async updateComponent(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.payrollComponent.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Component #${id} not found.`);
    }

    return this.prisma.payrollComponent.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : existing.name,
        code: dto.code ? dto.code.trim().toUpperCase() : existing.code,
        type: dto.type ?? existing.type,
        calculationType: dto.calculationType ?? dto.calculation_type ?? existing.calculationType,
        defaultAmount: dto.defaultAmount !== undefined || dto.default_amount !== undefined
          ? parseFloat(dto.defaultAmount ?? dto.default_amount)
          : existing.defaultAmount,
        percentageOf: dto.percentageOf !== undefined ? dto.percentageOf : (dto.percentage_of !== undefined ? dto.percentage_of : existing.percentageOf),
        isTaxable: dto.isTaxable !== undefined ? Boolean(dto.isTaxable) : (dto.is_taxable !== undefined ? Boolean(dto.is_taxable) : existing.isTaxable),
      },
    });
  }

  async deleteComponent(tenantId: string, id: string) {
    const existing = await this.prisma.payrollComponent.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Component #${id} not found.`);
    }

    return this.prisma.payrollComponent.delete({
      where: { id },
    });
  }

  // ==========================================
  // SALARY STRUCTURES
  // ==========================================
  async findAllStructures(tenantId: string) {
    const count = await this.prisma.salaryStructure.count({ where: { tenantId } });
    if (count === 0) {
      await this.seedInitialStructures(tenantId);
    }

    return this.prisma.salaryStructure.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createStructure(tenantId: string, dto: any) {
    const name = (dto.name || '').trim();
    if (!name) {
      throw new BadRequestException('Structure name is required.');
    }

    return this.prisma.salaryStructure.create({
      data: {
        tenantId,
        name,
        designationId: dto.designationId || dto.designation_id || null,
        designationName: dto.designationName || dto.designation_name || 'All Designations',
        basicSalary: parseFloat(dto.basicSalary || dto.basic_salary) || 50000,
        totalEarnings: parseFloat(dto.totalEarnings || dto.total_earnings) || 65000,
        totalDeductions: parseFloat(dto.totalDeductions || dto.total_deductions) || 6000,
        netSalary: parseFloat(dto.netSalary || dto.net_salary) || 59000,
        status: dto.status || 'Active',
      },
    });
  }

  async updateStructure(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.salaryStructure.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Structure #${id} not found.`);
    }

    return this.prisma.salaryStructure.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : existing.name,
        designationId: dto.designationId !== undefined ? dto.designationId : (dto.designation_id !== undefined ? dto.designation_id : existing.designationId),
        designationName: dto.designationName ?? dto.designation_name ?? existing.designationName,
        basicSalary: dto.basicSalary !== undefined || dto.basic_salary !== undefined ? parseFloat(dto.basicSalary ?? dto.basic_salary) : existing.basicSalary,
        totalEarnings: dto.totalEarnings !== undefined || dto.total_earnings !== undefined ? parseFloat(dto.totalEarnings ?? dto.total_earnings) : existing.totalEarnings,
        totalDeductions: dto.totalDeductions !== undefined || dto.total_deductions !== undefined ? parseFloat(dto.totalDeductions ?? dto.total_deductions) : existing.totalDeductions,
        netSalary: dto.netSalary !== undefined || dto.net_salary !== undefined ? parseFloat(dto.netSalary ?? dto.net_salary) : existing.netSalary,
        status: dto.status ?? existing.status,
      },
    });
  }

  async deleteStructure(tenantId: string, id: string) {
    const existing = await this.prisma.salaryStructure.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Structure #${id} not found.`);
    }

    return this.prisma.salaryStructure.delete({
      where: { id },
    });
  }

  // ==========================================
  // SEED HELPERS
  // ==========================================
  private async seedInitialPayrollRun(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    const staff = await this.prisma.staffProfile.findMany({ where: { tenantId } });
    if (staff.length === 0) return;

    const month = 11;
    const year = 2026;
    const title = 'November 2026 Monthly Staff Payroll Run';

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const payslipsData = staff.map((s) => {
      const basic = Number(s.basicSalary) || 50000;
      const da = Math.round(basic * 0.5);
      const hra = Math.round(basic * 0.27);
      const allowances = Math.round(basic * 0.1);
      const pf = Math.round(basic * 0.12);
      const tax = basic > 60000 ? Math.round(basic * 0.1) : 0;
      const deductions = pf + tax + 200;
      const gross = basic + da + hra + allowances;
      const net = gross - deductions;

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;

      return {
        staffId: s.id,
        basicSalary: basic,
        hra,
        allowances,
        providentFund: pf,
        taxDeducted: tax,
        deductions,
        netSalary: net,
        status: 'PAID',
        paidAt: new Date('2026-11-01T10:00:00Z'),
      };
    });

    await this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          month,
          year,
          title,
          totalGross,
          totalDeductions,
          totalNet,
          staffCount: staff.length,
          status: 'disbursed',
          disbursedAt: new Date('2026-11-01T10:00:00Z'),
        },
      });

      await tx.payslip.createMany({
        data: payslipsData.map((p) => ({
          tenantId,
          payrollRunId: run.id,
          ...p,
        })),
      });
    });
  }

  private async seedInitialComponents(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    await this.prisma.payrollComponent.createMany({
      data: [
        {
          tenantId,
          name: 'Basic Pay',
          code: 'BASIC',
          type: 'Earning',
          calculationType: 'Fixed',
          defaultAmount: 50000,
          isTaxable: true,
        },
        {
          tenantId,
          name: 'Dearness Allowance (DA)',
          code: 'DA',
          type: 'Earning',
          calculationType: 'Percentage',
          defaultAmount: 50,
          percentageOf: 'BASIC',
          isTaxable: true,
        },
        {
          tenantId,
          name: 'House Rent Allowance (HRA)',
          code: 'HRA',
          type: 'Earning',
          calculationType: 'Percentage',
          defaultAmount: 27,
          percentageOf: 'BASIC',
          isTaxable: true,
        },
        {
          tenantId,
          name: 'Special Academic Allowance',
          code: 'SA',
          type: 'Earning',
          calculationType: 'Fixed',
          defaultAmount: 8000,
          isTaxable: true,
        },
        {
          tenantId,
          name: "Employees' Provident Fund (EPF)",
          code: 'EPF',
          type: 'Deduction',
          calculationType: 'Percentage',
          defaultAmount: 12,
          percentageOf: 'BASIC',
          isTaxable: false,
        },
        {
          tenantId,
          name: 'Professional Tax (PT)',
          code: 'PT',
          type: 'Deduction',
          calculationType: 'Fixed',
          defaultAmount: 200,
          isTaxable: false,
        },
      ],
    });
  }

  private async seedInitialStructures(tenantId: string) {
    if (process.env.NODE_ENV === 'production') return;
    await this.prisma.salaryStructure.createMany({
      data: [
        {
          tenantId,
          name: 'Professor Grade-I UGC Scale',
          designationName: 'Professor',
          basicSalary: 95000,
          totalEarnings: 142500,
          totalDeductions: 13400,
          netSalary: 129100,
          status: 'Active',
        },
        {
          tenantId,
          name: 'Associate Professor UGC Scale',
          designationName: 'Associate Professor',
          basicSalary: 82000,
          totalEarnings: 123000,
          totalDeductions: 11840,
          netSalary: 111160,
          status: 'Active',
        },
        {
          tenantId,
          name: 'Assistant Professor Entry Scale',
          designationName: 'Assistant Professor',
          basicSalary: 65000,
          totalEarnings: 97500,
          totalDeductions: 9800,
          netSalary: 87700,
          status: 'Active',
        },
        {
          tenantId,
          name: 'Administrative Staff Standard Structure',
          designationName: 'Administrative Staff',
          basicSalary: 50000,
          totalEarnings: 65000,
          totalDeductions: 6200,
          netSalary: 58800,
          status: 'Active',
        },
      ],
    });
  }
}
