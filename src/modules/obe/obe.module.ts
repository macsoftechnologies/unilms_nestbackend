import { Module } from '@nestjs/common';
import { ObeService } from './obe.service';
import { ObeController } from './obe.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ObeController],
  providers: [ObeService, PrismaService],
  exports: [ObeService],
})
export class ObeModule {}
