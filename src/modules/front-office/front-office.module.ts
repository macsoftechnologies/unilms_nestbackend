import { Module } from '@nestjs/common';
import { FrontOfficeService } from './front-office.service';
import { FrontOfficeController } from './front-office.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FrontOfficeController],
  providers: [FrontOfficeService, PrismaService],
  exports: [FrontOfficeService],
})
export class FrontOfficeModule {}

