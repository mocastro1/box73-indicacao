import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MecanicaStatus {
  ATIVA = 'ATIVA',
  PAUSADA = 'PAUSADA',
  ENCERRADA = 'ENCERRADA',
}

export class CreateMecanicaDto {
  @ApiProperty({ description: 'Nome da mecânica' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Descrição da mecânica' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'Benefício para o embaixador' })
  @IsNotEmpty()
  @IsString()
  beneficioEmbaixador: string;

  @ApiProperty({ description: 'Benefício para o cliente' })
  @IsNotEmpty()
  @IsString()
  beneficioCliente: string;

  @ApiProperty({ description: 'Meta de validações' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  metaValidacoes: number;

  @ApiProperty({ description: 'Limite de cupons' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  limiteCupons: number;

  @ApiProperty({ description: 'Data de início' })
  @IsNotEmpty()
  @IsString()
  dataInicio: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsNotEmpty()
  @IsString()
  dataFim: string;
}

export class UpdateMecanicaDto extends PartialType(CreateMecanicaDto) {
  @ApiPropertyOptional({
    description: 'Status da mecânica',
    enum: MecanicaStatus,
  })
  @IsOptional()
  @IsEnum(MecanicaStatus)
  status?: MecanicaStatus;
}
