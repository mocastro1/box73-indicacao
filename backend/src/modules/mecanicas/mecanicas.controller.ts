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
import { MecanicasService } from './mecanicas.service';
import { CreateMecanicaDto, UpdateMecanicaDto } from './dto/mecanica.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('mecanicas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mecanicas')
export class MecanicasController {
  constructor(private readonly mecanicasService: MecanicasService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.mecanicasService.findAll(
      page ? parseInt(page, 10) : 1,
      status,
    );
  }

  @Get('validas')
  findValidas() {
    return this.mecanicasService.findValidas();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mecanicasService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  create(@Body() dto: CreateMecanicaDto, @Request() req: any) {
    return this.mecanicasService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMecanicaDto,
  ) {
    return this.mecanicasService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.mecanicasService.toggleStatus(id);
  }
}
