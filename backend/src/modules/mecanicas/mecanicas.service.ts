import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMecanicaDto, UpdateMecanicaDto } from './dto/mecanica.dto';

@Injectable()
export class MecanicasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, statusFilter?: string) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.mecanica.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { cupons: true } },
          cupons: {
            select: {
              _count: {
                select: {
                  indicacoes: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.mecanica.count({ where }),
    ]);

    // Calculate totalValidacoes for each mecanica
    const dataWithValidacoes = data.map((mecanica) => ({
      ...mecanica,
      totalValidacoes: mecanica.cupons.reduce(
        (sum, cupom) => sum + cupom._count.indicacoes,
        0,
      ),
      cupons: undefined, // Remove cupons array from response
    }));

    return {
      data: dataWithValidacoes,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findValidas() {
    const today = new Date();

    const mecanicas = await this.prisma.mecanica.findMany({
      where: {
        status: 'ATIVA',
        dataInicio: { lte: today },
        dataFim: { gte: today },
      },
    });

    // Filter in application: cuponsEmitidos < limiteCupons
    return mecanicas.filter((m) => m.cuponsEmitidos < m.limiteCupons);
  }

  async findOne(id: number) {
    const mecanica = await this.prisma.mecanica.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cupons: true,
          },
        },
      },
    });

    if (!mecanica) {
      throw new NotFoundException(`Regra de Cupom #${id} não encontrada`);
    }

    return mecanica;
  }

  async create(dto: CreateMecanicaDto, userId: number) {
    return this.prisma.mecanica.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        beneficioEmbaixador: dto.beneficioEmbaixador,
        beneficioCliente: dto.beneficioCliente,
        metaValidacoes: dto.metaValidacoes,
        limiteCupons: dto.limiteCupons,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
        cuponsEmitidos: 0,
        status: 'ATIVA',
        criadoPorId: userId,
      },
    });
  }

  async update(id: number, dto: UpdateMecanicaDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (data.dataInicio) data.dataInicio = new Date(data.dataInicio);
    if (data.dataFim) data.dataFim = new Date(data.dataFim);

    return this.prisma.mecanica.update({
      where: { id },
      data,
    });
  }

  async toggleStatus(id: number) {
    const mecanica = await this.findOne(id);

    const newStatus = mecanica.status === 'ATIVA' ? 'PAUSADA' : 'ATIVA';

    return this.prisma.mecanica.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
