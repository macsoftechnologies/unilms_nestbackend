import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [LmsController],
  providers: [LmsService, PrismaService],
  exports: [LmsService],
})
export class LmsModule {}

