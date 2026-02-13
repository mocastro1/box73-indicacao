import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsCpf } from '../../../common/decorators/is-cpf.decorator';

export class CreateEmbaixadorDto {
  @ApiProperty({ description: 'Nome do embaixador' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ description: 'CPF do embaixador', example: '12345678901' })
  @IsNotEmpty()
  @IsString()
  @IsCpf({ message: 'CPF inválido' })
  cpf: string;

  @ApiProperty({ description: 'Telefone do embaixador' })
  @IsNotEmpty()
  @IsString()
  telefone: string;

  @ApiPropertyOptional({ description: 'Email do embaixador' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateEmbaixadorDto extends PartialType(CreateEmbaixadorDto) {}
