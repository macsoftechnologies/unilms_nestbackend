import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FinanceController, AccountsController],
  providers: [FinanceService, AccountsService, PrismaService],
  exports: [FinanceService, AccountsService],
})
export class FinanceModule {}
