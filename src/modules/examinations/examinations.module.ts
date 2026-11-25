import { Module } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { ExaminationsController } from './examinations.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ExaminationsController],
  providers: [ExaminationsService, PrismaService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
