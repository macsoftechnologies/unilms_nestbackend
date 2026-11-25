import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeedAccounts(tenantId: string) {
    return;
    const headCount = await this.prisma.accountHead.count({ where: { tenantId } });
    if (headCount === 0) {
      console.log(`Seeding canonical Chart of Accounts for tenant: ${tenantId}`);
      const canonicalHeads = [
        { code: '1001', name: 'SBI Core Operations Bank Account', type: 'Asset', description: 'Primary institutional operational current account' },
        { code: '1002', name: 'Central Campus Petty Cash', type: 'Asset', description: 'Front desk and administrative cash drawer' },
        { code: '1003', name: 'Student Fee Receivables', type: 'Asset', description: 'Accrued semester dues and tuition fees' },
        { code: '2001', name: 'Sundry Creditors & Vendors', type: 'Liability', description: 'Procurement suppliers and equipment vendor payables' },
        { code: '2002', name: 'Staff Salary Payable', type: 'Liability', description: 'Accrued faculty compensation and monthly staff payroll' },
        { code: '3001', name: 'Institutional Corpus Fund', type: 'Equity', description: 'Endowment and university reserve equity' },
        { code: '4001', name: 'Tuition Fees Academic Revenue', type: 'Income', description: 'Undergraduate and postgraduate tuition collections' },
        { code: '4002', name: 'Campus Bus Transport Revenue', type: 'Income', description: 'Student fleet and transport route subscriptions' },
        { code: '4003', name: 'Hostel Accommodation Revenue', type: 'Income', description: 'Residential hostel room fees and boarding charges' },
        { code: '4004', name: 'Library Fines & Overdue Charges', type: 'Income', description: 'OPAC book circulation overdue recovery' },
        { code: '4005', name: 'Examination & Certification Revenue', type: 'Income', description: 'End-semester evaluation and re-checking fees' },
        { code: '5001', name: 'Faculty & Staff Payroll Expense', type: 'Expense', description: 'Monthly teaching and administrative salaries' },
        { code: '5002', name: 'Campus Electricity & Utilities', type: 'Expense', description: 'State grid power and water supply utilities' },
        { code: '5003', name: 'High-Speed Internet & Server Infrastructure', type: 'Expense', description: 'Dedicated 1Gbps leased line and cloud services' },
        { code: '5004', name: 'Fleet Diesel & Bus Maintenance', type: 'Expense', description: 'Transport fuel refills and vehicle servicing' },
        { code: '5005', name: 'Library Journal Subscriptions & Books', type: 'Expense', description: 'Periodical acquisitions and OPAC shelf restock' },
        { code: '5006', name: 'Lab Consumables & Technical Supplies', type: 'Expense', description: 'Chemistry reagents, electronic kits, computer lab parts' },
      ];

      for (const h of canonicalHeads) {
        await this.prisma.accountHead.create({
          data: {
            tenantId,
            code: h.code,
            name: h.name,
            type: h.type,
            description: h.description,
            isActive: true,
          },
        });
      }
    }

    const bankCount = await this.prisma.bankAccount.count({ where: { tenantId } });
    if (bankCount === 0) {
      console.log(`Seeding canonical Bank & Cash accounts for tenant: ${tenantId}`);
      const sbi = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          accountName: 'State Bank of India - Core Operations A/C',
          accountType: 'Bank',
          accountNumber: 'SBI-CA-9844001289',
          ifscCode: 'SBIN0001842',
          branch: 'University Campus Branch',
          openingBalance: new Prisma.Decimal(1250000.00),
          currentBalance: new Prisma.Decimal(1425000.00),
          isActive: true,
        },
      });

      const hdfc = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          accountName: 'HDFC Bank - Tuition & Fee Collections A/C',
          accountType: 'Bank',
          accountNumber: 'HDFC-CA-5020004921',
          ifscCode: 'HDFC0000421',
          branch: 'Tech Park Financial Branch',
          openingBalance: new Prisma.Decimal(2450000.00),
          currentBalance: new Prisma.Decimal(2850000.00),
          isActive: true,
        },
      });

      const cash = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          accountName: 'Central Campus Petty Cash Chest',
          accountType: 'Cash',
          accountNumber: 'CASH-CHEST-01',
          ifscCode: '—',
          branch: 'Front Counter Accounts Desk',
          openingBalance: new Prisma.Decimal(45000.00),
          currentBalance: new Prisma.Decimal(38200.00),
          isActive: true,
        },
      });

      // Seed initial transactions
      const txCount = await this.prisma.financialTransaction.count({ where: { tenantId } });
      if (txCount === 0) {
        const heads = await this.prisma.accountHead.findMany({ where: { tenantId } });
        const tuitionHead = heads.find(h => h.code === '4001') || heads[0];
        const transportHead = heads.find(h => h.code === '4002') || heads[0];
        const libFineHead = heads.find(h => h.code === '4004') || heads[0];
        const powerHead = heads.find(h => h.code === '5002') || heads[0];
        const dieselHead = heads.find(h => h.code === '5004') || heads[0];
        const netHead = heads.find(h => h.code === '5003') || heads[0];

        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);
        const twoDaysAgo = new Date(Date.now() - 172800000);

        const initialTxs = [
          {
            voucherNumber: 'RCP-2026-001',
            transactionDate: today,
            voucherType: 'Receipt',
            transactionType: 'Credit',
            headId: tuitionHead.id,
            bankAccountId: hdfc.id,
            amount: 150000.00,
            partyName: 'Aditya Sharma & Cohort 2026',
            referenceNo: 'FEE-ONLINE-9921',
            description: 'B.Tech CSE Semester 4 Tuition & Lab Fee Collections',
          },
          {
            voucherNumber: 'RCP-2026-002',
            transactionDate: today,
            voucherType: 'Receipt',
            transactionType: 'Credit',
            headId: transportHead.id,
            bankAccountId: sbi.id,
            amount: 25000.00,
            partyName: 'Subscribed Fleet Students',
            referenceNo: 'BUS-RT-2026-88',
            description: 'Campus Bus Route 4 & 7 Term 2 Seat Subscriptions',
          },
          {
            voucherNumber: 'RCP-2026-003',
            transactionDate: yesterday,
            voucherType: 'Receipt',
            transactionType: 'Credit',
            headId: libFineHead.id,
            bankAccountId: cash.id,
            amount: 1500.00,
            partyName: 'Central Library Counter',
            referenceNo: 'LIB-FINE-OCT',
            description: 'Overdue circulation fine receipts recovered at OPAC desk',
          },
          {
            voucherNumber: 'PMT-2026-001',
            transactionDate: today,
            voucherType: 'Payment',
            transactionType: 'Debit',
            headId: powerHead.id,
            bankAccountId: sbi.id,
            amount: 42500.00,
            partyName: 'State Electricity Transmission Corp',
            referenceNo: 'EB-INV-2026-11',
            description: 'Campus High-Tension Substation Monthly Power Bill',
          },
          {
            voucherNumber: 'PMT-2026-002',
            transactionDate: yesterday,
            voucherType: 'Payment',
            transactionType: 'Debit',
            headId: dieselHead.id,
            bankAccountId: cash.id,
            amount: 8300.00,
            partyName: 'Campus Fuel Service Point',
            referenceNo: 'FUEL-BILL-4410',
            description: 'Bus No. 4 Routine Oil Service & 80L Diesel Refill',
          },
          {
            voucherNumber: 'PMT-2026-003',
            transactionDate: twoDaysAgo,
            voucherType: 'Payment',
            transactionType: 'Debit',
            headId: netHead.id,
            bankAccountId: sbi.id,
            amount: 18500.00,
            partyName: 'Tata Tele Business Services',
            referenceNo: 'ILL-1GBPS-NOV',
            description: 'Campus Core 1Gbps Dedicated Leased Line Monthly Rental',
          },
        ];

        for (const tx of initialTxs) {
          await this.prisma.financialTransaction.create({
            data: {
              tenantId,
              voucherNumber: tx.voucherNumber,
              transactionDate: tx.transactionDate,
              voucherType: tx.voucherType,
              transactionType: tx.transactionType,
              headId: tx.headId,
              bankAccountId: tx.bankAccountId,
              amount: new Prisma.Decimal(tx.amount),
              partyName: tx.partyName,
              referenceNo: tx.referenceNo,
              description: tx.description,
              status: 'POSTED',
            },
          });
        }
      }
    }
  }

  // --- 1. OVERVIEW & TELEMETRY ---
  async getStats(tenantId: string) {
    await this.ensureSeedAccounts(tenantId);

    const banks = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true },
      orderBy: { accountName: 'asc' },
    });

    const transactions = await this.prisma.financialTransaction.findMany({
      where: { tenantId },
      include: {
        accountHead: true,
        bankAccount: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    const totalBankBalance = banks
      .filter(b => b.accountType.toLowerCase() === 'bank')
      .reduce((sum, b) => sum + Number(b.currentBalance), 0);

    const totalCashBalance = banks
      .filter(b => b.accountType.toLowerCase() === 'cash')
      .reduce((sum, b) => sum + Number(b.currentBalance), 0);

    const allTx = await this.prisma.financialTransaction.findMany({
      where: { tenantId },
      select: { amount: true, transactionType: true },
    });

    const totalInflow = allTx
      .filter(t => t.transactionType.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalOutflow = allTx
      .filter(t => t.transactionType.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalHeads = await this.prisma.accountHead.count({ where: { tenantId, isActive: true } });

    // Format recent transactions for UI consumption (supporting both camelCase and snake_case)
    const formattedRecentTransactions = transactions.slice(0, 8).map(t => ({
      id: t.id,
      voucher_number: t.voucherNumber,
      voucherNumber: t.voucherNumber,
      transaction_date: t.transactionDate.toISOString().split('T')[0],
      transactionDate: t.transactionDate.toISOString().split('T')[0],
      voucher_type: t.voucherType,
      voucherType: t.voucherType,
      transaction_type: t.transactionType,
      transactionType: t.transactionType,
      type: t.transactionType === 'Credit' ? 'Income' : 'Expense',
      amount: Number(t.amount),
      party_name: t.partyName,
      partyName: t.partyName,
      reference_no: t.referenceNo,
      referenceNo: t.referenceNo,
      description: t.description,
      head_id: t.headId,
      headId: t.headId,
      head_name: t.accountHead?.name || 'General Head',
      headName: t.accountHead?.name || 'General Head',
      bank_account_id: t.bankAccountId,
      bankAccountId: t.bankAccountId,
      bank_name: t.bankAccount?.accountName || 'Cash / Bank',
      bankName: t.bankAccount?.accountName || 'Cash / Bank',
      status: t.status,
    }));

    const formattedBanks = banks.map(b => ({
      id: b.id,
      account_name: b.accountName,
      accountName: b.accountName,
      type: b.accountType,
      accountType: b.accountType,
      account_no: b.accountNumber,
      accountNumber: b.accountNumber,
      ifsc_code: b.ifscCode,
      ifscCode: b.ifscCode,
      branch: b.branch,
      opening_balance: Number(b.openingBalance),
      openingBalance: Number(b.openingBalance),
      current_balance: Number(b.currentBalance),
      currentBalance: Number(b.currentBalance),
      isActive: b.isActive,
    }));

    return {
      totalBankBalance,
      totalCashBalance,
      totalInflow,
      totalOutflow,
      netSurplus: totalInflow - totalOutflow,
      totalHeads,
      banks: formattedBanks,
      recentTransactions: formattedRecentTransactions,
    };
  }

  // --- 2. CHART OF ACCOUNTS (HEADS) ---
  async findHeads(tenantId: string, type?: string, search?: string) {
    await this.ensureSeedAccounts(tenantId);

    const where: Prisma.AccountHeadWhereInput = { tenantId, isActive: true };
    if (type && type !== 'All') {
      where.type = { equals: type, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const heads = await this.prisma.accountHead.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return heads.map(h => ({
      id: h.id,
      gl_code: h.code,
      code: h.code,
      head_name: h.name,
      name: h.name,
      head_type: h.type,
      type: h.type,
      description: h.description,
      isActive: h.isActive,
      createdAt: h.createdAt,
    }));
  }

  async createHead(tenantId: string, dto: any) {
    const code = dto.code || dto.gl_code || `GL-${Date.now().toString().slice(-4)}`;
    const name = dto.name || dto.head_name;
    const type = dto.type || dto.head_type || 'Expense';

    if (!name) {
      throw new BadRequestException('Account head name is required.');
    }

    const created = await this.prisma.accountHead.create({
      data: {
        tenantId,
        code,
        name,
        type,
        description: dto.description || '',
        isActive: true,
      },
    });

    return {
      id: created.id,
      gl_code: created.code,
      code: created.code,
      head_name: created.name,
      name: created.name,
      head_type: created.type,
      type: created.type,
      description: created.description,
      isActive: created.isActive,
    };
  }

  async updateHead(tenantId: string, id: string, dto: any) {
    const head = await this.prisma.accountHead.findFirst({ where: { id, tenantId } });
    if (!head) throw new NotFoundException('Account head not found.');

    const updated = await this.prisma.accountHead.update({
      where: { id },
      data: {
        code: dto.code || dto.gl_code || head.code,
        name: dto.name || dto.head_name || head.name,
        type: dto.type || dto.head_type || head.type,
        description: dto.description !== undefined ? dto.description : head.description,
        isActive: dto.isActive !== undefined ? dto.isActive : head.isActive,
      },
    });

    return {
      id: updated.id,
      gl_code: updated.code,
      code: updated.code,
      head_name: updated.name,
      name: updated.name,
      head_type: updated.type,
      type: updated.type,
      description: updated.description,
    };
  }

  async deleteHead(tenantId: string, id: string) {
    const head = await this.prisma.accountHead.findFirst({ where: { id, tenantId } });
    if (!head) throw new NotFoundException('Account head not found.');

    await this.prisma.accountHead.delete({ where: { id } });
    return { success: true, message: `Account head ${head.name} deleted successfully.` };
  }

  // --- 3. BANK & CASH ACCOUNTS ---
  async findBanks(tenantId: string, type?: string, search?: string) {
    await this.ensureSeedAccounts(tenantId);

    const where: Prisma.BankAccountWhereInput = { tenantId, isActive: true };
    if (type && type !== 'All') {
      where.accountType = { equals: type, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const banks = await this.prisma.bankAccount.findMany({
      where,
      orderBy: { accountName: 'asc' },
    });

    return banks.map(b => ({
      id: b.id,
      account_name: b.accountName,
      accountName: b.accountName,
      type: b.accountType,
      accountType: b.accountType,
      account_no: b.accountNumber,
      accountNumber: b.accountNumber,
      ifsc_code: b.ifscCode,
      ifscCode: b.ifscCode,
      branch: b.branch,
      opening_balance: Number(b.openingBalance),
      openingBalance: Number(b.openingBalance),
      current_balance: Number(b.currentBalance),
      currentBalance: Number(b.currentBalance),
      isActive: b.isActive,
    }));
  }

  async createBank(tenantId: string, dto: any) {
    const accountName = dto.accountName || dto.account_name;
    const accountType = dto.accountType || dto.type || 'Bank';
    const accountNumber = dto.accountNumber || dto.account_no || `ACC-${Date.now().toString().slice(-6)}`;
    const openingBalance = parseFloat(dto.openingBalance || dto.opening_balance || '0');

    if (!accountName) {
      throw new BadRequestException('Account name is required.');
    }

    const created = await this.prisma.bankAccount.create({
      data: {
        tenantId,
        accountName,
        accountType,
        accountNumber,
        ifscCode: dto.ifscCode || dto.ifsc_code || '—',
        branch: dto.branch || '',
        openingBalance: new Prisma.Decimal(openingBalance),
        currentBalance: new Prisma.Decimal(openingBalance),
        isActive: true,
      },
    });

    return {
      id: created.id,
      account_name: created.accountName,
      accountName: created.accountName,
      type: created.accountType,
      accountType: created.accountType,
      account_no: created.accountNumber,
      accountNumber: created.accountNumber,
      ifsc_code: created.ifscCode,
      ifscCode: created.ifscCode,
      branch: created.branch,
      opening_balance: Number(created.openingBalance),
      current_balance: Number(created.currentBalance),
    };
  }

  async updateBank(tenantId: string, id: string, dto: any) {
    const bank = await this.prisma.bankAccount.findFirst({ where: { id, tenantId } });
    if (!bank) throw new NotFoundException('Bank/Cash account not found.');

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data: {
        accountName: dto.accountName || dto.account_name || bank.accountName,
        accountType: dto.accountType || dto.type || bank.accountType,
        accountNumber: dto.accountNumber || dto.account_no || bank.accountNumber,
        ifscCode: dto.ifscCode !== undefined ? dto.ifscCode : (dto.ifsc_code !== undefined ? dto.ifsc_code : bank.ifscCode),
        branch: dto.branch !== undefined ? dto.branch : bank.branch,
        isActive: dto.isActive !== undefined ? dto.isActive : bank.isActive,
      },
    });

    return {
      id: updated.id,
      account_name: updated.accountName,
      accountName: updated.accountName,
      type: updated.accountType,
      accountType: updated.accountType,
      account_no: updated.accountNumber,
      accountNumber: updated.accountNumber,
      ifsc_code: updated.ifscCode,
      current_balance: Number(updated.currentBalance),
    };
  }

  async deleteBank(tenantId: string, id: string) {
    const bank = await this.prisma.bankAccount.findFirst({ where: { id, tenantId } });
    if (!bank) throw new NotFoundException('Bank/Cash account not found.');

    await this.prisma.bankAccount.delete({ where: { id } });
    return { success: true, message: `Account ${bank.accountName} deleted successfully.` };
  }

  // --- 4. FINANCIAL TRANSACTIONS / VOUCHERS ---
  async findTransactions(tenantId: string, query: any = {}) {
    await this.ensureSeedAccounts(tenantId);

    const where: Prisma.FinancialTransactionWhereInput = { tenantId };

    if (query.voucherType && query.voucherType !== 'All') {
      where.voucherType = { equals: query.voucherType, mode: 'insensitive' };
    }
    if (query.transactionType && query.transactionType !== 'All') {
      where.transactionType = { equals: query.transactionType, mode: 'insensitive' };
    }
    if (query.type && query.type !== 'All') {
      if (query.type === 'Income') where.transactionType = 'Credit';
      if (query.type === 'Expense') where.transactionType = 'Debit';
    }
    if (query.startDate && query.endDate) {
      where.transactionDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }
    if (query.headId) {
      where.headId = query.headId;
    }
    if (query.bankAccountId) {
      where.bankAccountId = query.bankAccountId;
    }
    if (query.search) {
      where.OR = [
        { voucherNumber: { contains: query.search, mode: 'insensitive' } },
        { partyName: { contains: query.search, mode: 'insensitive' } },
        { referenceNo: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const txs = await this.prisma.financialTransaction.findMany({
      where,
      include: {
        accountHead: true,
        bankAccount: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    return txs.map(t => ({
      id: t.id,
      voucher_number: t.voucherNumber,
      voucherNumber: t.voucherNumber,
      transaction_date: t.transactionDate.toISOString().split('T')[0],
      transactionDate: t.transactionDate.toISOString().split('T')[0],
      voucher_type: t.voucherType,
      voucherType: t.voucherType,
      transaction_type: t.transactionType,
      transactionType: t.transactionType,
      type: t.transactionType === 'Credit' ? 'Income' : 'Expense',
      head_id: t.headId,
      headId: t.headId,
      head_name: t.accountHead?.name || 'General Head',
      headName: t.accountHead?.name || 'General Head',
      bank_account_id: t.bankAccountId,
      bankAccountId: t.bankAccountId,
      bank_name: t.bankAccount?.accountName || 'Cash / Bank',
      bankName: t.bankAccount?.accountName || 'Cash / Bank',
      amount: Number(t.amount),
      party_name: t.partyName,
      partyName: t.partyName,
      reference_no: t.referenceNo,
      referenceNo: t.referenceNo,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
    }));
  }

  async createTransaction(tenantId: string, dto: any) {
    const rawType = dto.type || dto.transaction_type || 'Expense';
    const transactionType = (rawType.toLowerCase() === 'income' || rawType.toLowerCase() === 'credit') ? 'Credit' : 'Debit';
    const voucherType = dto.voucherType || dto.voucher_type || (transactionType === 'Credit' ? 'Receipt' : 'Payment');
    const amount = parseFloat(dto.amount);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than zero.');
    }

    const count = await this.prisma.financialTransaction.count({ where: { tenantId } });
    const prefix = voucherType.toUpperCase().slice(0, 3);
    const voucherNumber = dto.voucherNumber || dto.voucher_number || `${prefix}-2026-${String(count + 101).padStart(3, '0')}`;
    const transactionDate = dto.transactionDate || dto.transaction_date ? new Date(dto.transactionDate || dto.transaction_date) : new Date();

    const headId = dto.headId || dto.head_id || null;
    const bankAccountId = dto.bankAccountId || dto.bank_account_id || null;

    // Execute atomic creation & bank balance adjustment
    const created = await this.prisma.$transaction(async (tx) => {
      const newTx = await tx.financialTransaction.create({
        data: {
          tenantId,
          voucherNumber,
          transactionDate,
          voucherType,
          transactionType,
          headId,
          bankAccountId,
          amount: new Prisma.Decimal(amount),
          partyName: dto.partyName || dto.party_name || '',
          referenceNo: dto.referenceNo || dto.reference_no || '',
          description: dto.description || '',
          status: 'POSTED',
        },
        include: {
          accountHead: true,
          bankAccount: true,
        },
      });

      // Update bank account currentBalance
      if (bankAccountId) {
        const balanceChange = transactionType === 'Credit' ? amount : -amount;
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: {
              increment: new Prisma.Decimal(balanceChange),
            },
          },
        });
      }

      return newTx;
    });

    return {
      id: created.id,
      voucher_number: created.voucherNumber,
      voucherNumber: created.voucherNumber,
      transaction_date: created.transactionDate.toISOString().split('T')[0],
      transactionDate: created.transactionDate.toISOString().split('T')[0],
      voucher_type: created.voucherType,
      voucherType: created.voucherType,
      transaction_type: created.transactionType,
      transactionType: created.transactionType,
      type: created.transactionType === 'Credit' ? 'Income' : 'Expense',
      head_id: created.headId,
      headId: created.headId,
      head_name: created.accountHead?.name || 'General Head',
      headName: created.accountHead?.name || 'General Head',
      bank_account_id: created.bankAccountId,
      bankAccountId: created.bankAccountId,
      bank_name: created.bankAccount?.accountName || 'Cash / Bank',
      bankName: created.bankAccount?.accountName || 'Cash / Bank',
      amount: Number(created.amount),
      party_name: created.partyName,
      partyName: created.partyName,
      reference_no: created.referenceNo,
      referenceNo: created.referenceNo,
      description: created.description,
      status: created.status,
    };
  }

  async updateTransaction(tenantId: string, id: string, dto: any) {
    const existing = await this.prisma.financialTransaction.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Transaction not found.');

    const updated = await this.prisma.financialTransaction.update({
      where: { id },
      data: {
        partyName: dto.partyName || dto.party_name || existing.partyName,
        referenceNo: dto.referenceNo || dto.reference_no || existing.referenceNo,
        description: dto.description !== undefined ? dto.description : existing.description,
        status: dto.status || existing.status,
      },
      include: {
        accountHead: true,
        bankAccount: true,
      },
    });

    return {
      id: updated.id,
      voucher_number: updated.voucherNumber,
      amount: Number(updated.amount),
      status: updated.status,
    };
  }

  async deleteTransaction(tenantId: string, id: string) {
    const existing = await this.prisma.financialTransaction.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Transaction not found.');

    await this.prisma.$transaction(async (tx) => {
      // Revert bank balance adjustment
      if (existing.bankAccountId) {
        const revertChange = existing.transactionType === 'Credit' ? -Number(existing.amount) : Number(existing.amount);
        await tx.bankAccount.update({
          where: { id: existing.bankAccountId },
          data: {
            currentBalance: {
              increment: new Prisma.Decimal(revertChange),
            },
          },
        });
      }

      await tx.financialTransaction.delete({ where: { id } });
    });

    return { success: true, message: `Voucher ${existing.voucherNumber} deleted and balance reverted.` };
  }

  // --- 5. DAYBOOK JOURNAL ---
  async getDaybook(tenantId: string, dateStr?: string) {
    await this.ensureSeedAccounts(tenantId);

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Prior transactions for opening balance
    const priorTxs = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        transactionDate: { lt: startOfDay },
      },
      select: { amount: true, transactionType: true },
    });

    const priorCredits = priorTxs.filter(t => t.transactionType === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
    const priorDebits = priorTxs.filter(t => t.transactionType === 'Debit').reduce((s, t) => s + Number(t.amount), 0);
    const openingBalance = priorCredits - priorDebits;

    // Day's transactions
    const dayTxs = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        accountHead: true,
        bankAccount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayCredits = dayTxs.filter(t => t.transactionType === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
    const dayDebits = dayTxs.filter(t => t.transactionType === 'Debit').reduce((s, t) => s + Number(t.amount), 0);
    const closingBalance = openingBalance + dayCredits - dayDebits;

    const entries = dayTxs.map(t => ({
      id: t.id,
      voucher_number: t.voucherNumber,
      voucherNumber: t.voucherNumber,
      time: t.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: t.accountHead?.name || 'General Cash Book',
      entryType: t.transactionType === 'Credit' ? 'INFLOW' : 'OUTFLOW',
      transaction_type: t.transactionType,
      paymentMode: t.bankAccount?.accountName || 'Cash',
      amount: Number(t.amount),
      partyName: t.partyName,
      description: t.description,
      referenceNo: t.referenceNo,
    }));

    return {
      date: targetDate.toISOString().split('T')[0],
      openingBalance,
      totalInflow: dayCredits,
      totalOutflow: dayDebits,
      closingBalance,
      entries,
    };
  }

  // --- 6. PROFIT & LOSS / INCOME & EXPENDITURE STATEMENT ---
  async getPlStatement(tenantId: string, startDate?: string, endDate?: string) {
    await this.ensureSeedAccounts(tenantId);

    const where: Prisma.FinancialTransactionWhereInput = { tenantId };
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const txs = await this.prisma.financialTransaction.findMany({
      where,
      include: {
        accountHead: true,
      },
    });

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    txs.forEach(t => {
      const headName = t.accountHead?.name || 'General Ledger';
      const amt = Number(t.amount);
      if (t.transactionType === 'Credit') {
        incomeMap[headName] = (incomeMap[headName] || 0) + amt;
      } else {
        expenseMap[headName] = (expenseMap[headName] || 0) + amt;
      }
    });

    const totalIncome = Object.values(incomeMap).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(expenseMap).reduce((a, b) => a + b, 0);
    const netSurplus = totalIncome - totalExpense;

    return {
      startDate: startDate || '2026-01-01',
      endDate: endDate || new Date().toISOString().split('T')[0],
      totalIncome,
      totalExpense,
      netSurplus,
      isProfit: netSurplus >= 0,
      incomeBreakdown: Object.entries(incomeMap).map(([name, amount]) => ({ name, amount })),
      expenseBreakdown: Object.entries(expenseMap).map(([name, amount]) => ({ name, amount })),
    };
  }
}
