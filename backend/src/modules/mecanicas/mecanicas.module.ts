import { Module } from '@nestjs/common';
import { MecanicasService } from './mecanicas.service';
import { MecanicasController } from './mecanicas.controller';

@Module({
  controllers: [MecanicasController],
  providers: [MecanicasService],
  exports: [MecanicasService],
})
export class MecanicasModule {}
