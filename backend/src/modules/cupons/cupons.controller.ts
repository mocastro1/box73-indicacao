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
import { CuponsService } from './cupons.service';
import { CreateCupomDto } from './dto/cupom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('cupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cupons')
export class CuponsController {
  constructor(private readonly cuponsService: CuponsService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'embaixadorId', required: false, type: Number })
  @ApiQuery({ name: 'mecanicaId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('embaixadorId') embaixadorId?: string,
    @Query('mecanicaId') mecanicaId?: string,
    @Query('search') search?: string,
  ) {
    return this.cuponsService.findAll(
      page ? parseInt(page, 10) : 1,
      embaixadorId ? parseInt(embaixadorId, 10) : undefined,
      mecanicaId ? parseInt(mecanicaId, 10) : undefined,
      search,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('ganhadores')
  getGanhadores() {
    return this.cuponsService.getGanhadores();
  }

  @Get('code/:codigo')
  findByCode(@Param('codigo') codigo: string) {
    return this.cuponsService.findByCode(codigo);
  }

  @Get('embaixador/:embaixadorId')
  findByEmbaixador(@Param('embaixadorId', ParseIntPipe) embaixadorId: number) {
    return this.cuponsService.findByEmbaixador(embaixadorId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  create(@Body() dto: CreateCupomDto, @Request() req: any) {
    return this.cuponsService.create(dto, req.user.sub);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.cuponsService.deactivate(id);
  }
}
