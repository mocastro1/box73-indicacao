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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmbaixadoresService } from './embaixadores.service';
import { CreateEmbaixadorDto, UpdateEmbaixadorDto } from './dto/embaixador.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('embaixadores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('embaixadores')
export class EmbaixadoresController {
  constructor(private readonly embaixadoresService: EmbaixadoresService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    return this.embaixadoresService.findAll(
      page ? parseInt(page, 10) : 1,
      search,
    );
  }

  @Get('cpf/:cpf')
  findByCpf(@Param('cpf') cpf: string) {
    return this.embaixadoresService.findByCpf(cpf);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.embaixadoresService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  create(@Body() dto: CreateEmbaixadorDto) {
    return this.embaixadoresService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmbaixadorDto,
  ) {
    return this.embaixadoresService.update(id, dto);
  }
}
