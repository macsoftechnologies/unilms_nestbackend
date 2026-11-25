import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AdmissionsController],
  providers: [AdmissionsService, PrismaService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}

