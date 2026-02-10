import { Module } from '@nestjs/common';
import { EmbaixadoresService } from './embaixadores.service';
import { EmbaixadoresController } from './embaixadores.controller';

@Module({
  controllers: [EmbaixadoresController],
  providers: [EmbaixadoresService],
  exports: [EmbaixadoresService],
})
export class EmbaixadoresModule {}
