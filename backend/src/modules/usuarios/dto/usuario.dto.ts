import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário',
    enum: UserRole,
    default: UserRole.ATENDENTE,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ATENDENTE;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
