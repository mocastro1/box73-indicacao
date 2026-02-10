import { Module } from '@nestjs/common';
import { IndicacoesService } from './indicacoes.service';
import { IndicacoesController } from './indicacoes.controller';

@Module({
  controllers: [IndicacoesController],
  providers: [IndicacoesService],
  exports: [IndicacoesService],
})
export class IndicacoesModule {}
