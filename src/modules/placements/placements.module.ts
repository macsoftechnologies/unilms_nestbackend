import { Module } from '@nestjs/common';
import { PlacementsService } from './placements.service';
import { PlacementsController } from './placements.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PlacementsController],
  providers: [PlacementsService, PrismaService],
  exports: [PlacementsService],
})
export class PlacementsModule {}
