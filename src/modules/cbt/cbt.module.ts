import { Module } from '@nestjs/common';
import { CbtController } from './cbt.controller';
import { CbtService } from './cbt.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CbtController],
  providers: [CbtService, PrismaService],
  exports: [CbtService],
})
export class CbtModule {}

