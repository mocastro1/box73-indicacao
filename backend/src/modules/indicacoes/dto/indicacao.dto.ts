import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsCpf } from '../../../common/decorators/is-cpf.decorator';

export class CreateIndicacaoDto {
  @ApiProperty({ description: 'ID do cupom' })
  @IsNotEmpty()
  @IsInt()
  cupomId: number;

  @ApiProperty({ description: 'Nome do indicado' })
  @IsNotEmpty()
  @IsString()
  nomeIndicado: string;

  @ApiPropertyOptional({ description: 'CPF do indicado', example: '12345678901' })
  @IsOptional()
  @IsString()
  @IsCpf({ message: 'CPF do indicado inválido' })
  cpfIndicado?: string;

  @ApiPropertyOptional({ description: 'Telefone do indicado' })
  @IsOptional()
  @IsString()
  telefoneIndicado?: string;

  @ApiPropertyOptional({ description: 'Serviço' })
  @IsOptional()
  @IsString()
  servico?: string;

  @ApiPropertyOptional({ description: 'Valor do serviço' })
  @IsOptional()
  @IsNumber()
  valorServico?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
