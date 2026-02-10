import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicacaoDto } from './dto/indicacao.dto';

@Injectable()
export class IndicacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, cupomId?: number) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (cupomId) where.cupomId = cupomId;

    const [data, total] = await Promise.all([
      this.prisma.indicacao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          cupom: {
            include: {
              embaixador: { select: { nome: true } },
            },
          },
        },
      }),
      this.prisma.indicacao.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findByCupomIds(cupomIds: number[]) {
    return this.prisma.indicacao.findMany({
      where: { cupomId: { in: cupomIds } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findRecent(limit = 20) {
    return this.prisma.indicacao.findMany({
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        cupom: {
          include: {
            embaixador: { select: { nome: true } },
          },
        },
      },
    });
  }

  async create(dto: CreateIndicacaoDto, userId: number) {
    const cupom = await this.prisma.cupom.findUnique({
      where: { id: dto.cupomId },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return this.prisma.indicacao.create({
      data: {
        cupomId: dto.cupomId,
        nomeIndicado: dto.nomeIndicado,
        cpfIndicado: dto.cpfIndicado
          ? dto.cpfIndicado.replace(/\D/g, '')
          : undefined,
        telefoneIndicado: dto.telefoneIndicado,
        servico: dto.servico,
        valorServico: dto.valorServico,
        observacoes: dto.observacoes,
        codigoUsado: cupom.codigo,
        validadoPorId: userId,
        status: 'VALIDADO',
      },
      include: {
        cupom: {
          include: {
            embaixador: { select: { nome: true } },
          },
        },
      },
    });
  }

  async cancel(id: number) {
    const indicacao = await this.prisma.indicacao.findUnique({
      where: { id },
    });

    if (!indicacao) {
      throw new NotFoundException(`Indicação #${id} não encontrada`);
    }

    return this.prisma.indicacao.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  async getHistorico(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, '');

    const embaixador = await this.prisma.embaixador.findFirst({
      where: { cpf: cleanCpf, ativo: true },
    });

    if (!embaixador) {
      throw new NotFoundException('Embaixador não encontrado com este CPF');
    }

    const cupons = await this.prisma.cupom.findMany({
      where: { embaixadorId: embaixador.id },
      include: {
        mecanica: true,
        indicacoes: {
          orderBy: { criadoEm: 'desc' },
        },
      },
    });

    const progressoPorCupom = cupons.map((cupom) => ({
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        ativo: cupom.ativo,
      },
      mecanica: {
        id: cupom.mecanica.id,
        nome: cupom.mecanica.nome,
        beneficioEmbaixador: cupom.mecanica.beneficioEmbaixador,
        beneficioCliente: cupom.mecanica.beneficioCliente,
        metaValidacoes: cupom.mecanica.metaValidacoes,
      },
      indicacoes: cupom.indicacoes,
      totalIndicacoes: cupom.indicacoes.length,
      validadas: cupom.indicacoes.filter((i) => i.status === 'VALIDADO').length,
      meta: cupom.mecanica.metaValidacoes,
      progresso:
        cupom.mecanica.metaValidacoes > 0
          ? Math.round(
              (cupom.indicacoes.filter((i) => i.status === 'VALIDADO').length /
                cupom.mecanica.metaValidacoes) *
                100,
            )
          : 0,
    }));

    return {
      embaixador: {
        id: embaixador.id,
        nome: embaixador.nome,
        cpf: embaixador.cpf,
      },
      cupons: progressoPorCupom,
    };
  }
}
