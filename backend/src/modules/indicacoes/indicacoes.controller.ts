import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IndicacoesService } from './indicacoes.service';
import { CreateIndicacaoDto } from './dto/indicacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('indicacoes')
@ApiBearerAuth()
@Controller('indicacoes')
export class IndicacoesController {
  constructor(private readonly indicacoesService: IndicacoesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'cupomId', required: false, type: Number })
  findAll(
    @Query('page') page?: string,
    @Query('cupomId') cupomId?: string,
  ) {
    return this.indicacoesService.findAll(
      page ? parseInt(page, 10) : 1,
      cupomId ? parseInt(cupomId, 10) : undefined,
    );
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRecent(@Query('limit') limit?: string) {
    return this.indicacoesService.findRecent(
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('historico/:cpf')
  getHistorico(@Param('cpf') cpf: string) {
    return this.indicacoesService.getHistorico(cpf);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateIndicacaoDto, @Request() req: any) {
    return this.indicacoesService.create(dto, req.user.sub);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.indicacoesService.cancel(id);
  }
}
