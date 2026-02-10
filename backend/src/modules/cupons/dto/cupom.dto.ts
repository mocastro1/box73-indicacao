import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCupomDto {
  @ApiProperty({ description: 'ID do embaixador' })
  @IsNotEmpty()
  @IsInt()
  embaixadorId: number;

  @ApiProperty({ description: 'ID da mecânica' })
  @IsNotEmpty()
  @IsInt()
  mecanicaId: number;

  @ApiProperty({ description: 'Código do cupom' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  codigo: string;
}
