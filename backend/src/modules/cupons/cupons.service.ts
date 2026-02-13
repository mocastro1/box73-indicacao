import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCupomDto } from './dto/cupom.dto';
import { Prisma } from '@prisma/client';

// Tipos para os dados retornados
export interface Embaixador {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string | null;
}

export interface CupomWithRelations {
  id: number;
  codigo: string;
  ativo: boolean;
  createdAt: Date;
  embaixador: Embaixador;
  mecanica: {
    nome: string;
    beneficioCliente: string;
    beneficioEmbaixador: string;
    dataFim: Date | null;
    metaValidacoes: number;
  } | null;
  _count: { indicacoes: number };
}

export interface CupomComIndicacoes {
  id: number;
  codigo: string;
  ativo: boolean;
  createdAt: Date;
  embaixador: Embaixador & { id: number };
  mecanica: {
    id: number;
    nome: string;
    beneficioEmbaixador: string;
    beneficioCliente: string;
    metaValidacoes: number;
    dataFim: Date | null;
  } | null;
  indicacoes: Array<{ id: number; createdAt: Date }>;
}

export interface GanhadorData {
  id: number;
  codigo: string;
  embaixador: Embaixador & { id: number };
  mecanica: {
    id: number;
    nome: string;
    beneficioEmbaixador: string;
    beneficioCliente: string;
    metaValidacoes: number;
    dataFim: Date | null;
  } | null;
  validadas: number;
  meta: number;
  progresso: number;
  dataAtingimento: Date | null;
  ativo: boolean;
}

@Injectable()
export class CuponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    embaixadorId?: number,
    mecanicaId?: number,
    search?: string,
    limitParam?: number,
  ) {
    const limit = limitParam || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CupomWhereInput = {};
    if (embaixadorId) where.embaixadorId = embaixadorId;
    if (mecanicaId) where.mecanicaId = mecanicaId;

    // Filtro de busca por código, nome do embaixador, CPF ou telefone
    if (search) {
      where.OR = [
        { codigo: { contains: search.toUpperCase() } },
        { embaixador: { nome: { contains: search, mode: 'insensitive' } } },
        { embaixador: { cpf: { contains: search.replace(/\D/g, '') } } },
        { embaixador: { telefone: { contains: search.replace(/\D/g, '') } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cupom.findMany({
        where,
        skip,
        take: limit,
        include: {
          embaixador: { select: { nome: true, cpf: true, telefone: true } },
          mecanica: {
            select: {
              nome: true,
              beneficioCliente: true,
              beneficioEmbaixador: true,
              dataFim: true,
              metaValidacoes: true,
            },
          },
          _count: { select: { indicacoes: true } },
        },
      }),
      this.prisma.cupom.count({ where }),
    ]);

    // Ordenar: ativos primeiro (mais antigos), depois expirados
    const today = new Date();
    const sortedData = (data as unknown as CupomWithRelations[]).sort(
      (a: CupomWithRelations, b: CupomWithRelations) => {
        const aExpired = a.mecanica?.dataFim
          ? new Date(a.mecanica.dataFim) < today
          : false;
        const bExpired = b.mecanica?.dataFim
          ? new Date(b.mecanica.dataFim) < today
          : false;

        // Ativos primeiro
        if (!aExpired && bExpired) return -1;
        if (aExpired && !bExpired) return 1;

        // Dentro do mesmo grupo, ordenar por data de criação (mais antigos primeiro para ativos)
        if (!aExpired && !bExpired) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }

        // Expirados: mais recentes primeiro
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
    );

    return {
      data: sortedData,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getGanhadores() {
    const cupons = await this.prisma.cupom.findMany({
      include: {
        embaixador: {
          select: { id: true, nome: true, cpf: true, telefone: true },
        },
        mecanica: {
          select: {
            id: true,
            nome: true,
            beneficioEmbaixador: true,
            beneficioCliente: true,
            metaValidacoes: true,
            dataFim: true,
          },
        },
        indicacoes: {
          where: { status: 'VALIDADO' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, createdAt: true },
        },
      },
    });

    const ganhadores: GanhadorData[] = (
      cupons as unknown as CupomComIndicacoes[]
    ).map((cupom: CupomComIndicacoes) => {
      const validadas = cupom.indicacoes.length;
      const meta = cupom.mecanica?.metaValidacoes || 1;
      const progresso = Math.round((validadas / meta) * 100);

      // Data de atingimento da meta (data da indicação que atingiu a meta)
      let dataAtingimento: Date | null = null;
      if (validadas >= meta && cupom.indicacoes.length >= meta) {
        dataAtingimento = cupom.indicacoes[meta - 1]?.createdAt || null;
      }

      return {
        id: cupom.id,
        codigo: cupom.codigo,
        embaixador: cupom.embaixador,
        mecanica: cupom.mecanica,
        validadas,
        meta,
        progresso,
        dataAtingimento,
        ativo: cupom.ativo,
      };
    });

    // Estatísticas
    const totalGanhadores = ganhadores.filter(
      (g: GanhadorData) => g.progresso >= 100,
    ).length;
    const totalValidacoes = ganhadores.reduce(
      (sum: number, g: GanhadorData) => sum + g.validadas,
      0,
    );
    const cuponsComMeta = ganhadores.filter(
      (g: GanhadorData) => g.progresso >= 100,
    ).length;
    const embaixadoresAtivos = new Set(
      ganhadores
        .filter((g: GanhadorData) => g.validadas > 0)
        .map((g: GanhadorData) => g.embaixador.id),
    ).size;

    // Ordenar: meta atingida primeiro, depois por progresso
    const sortedGanhadores = ganhadores.sort(
      (a: GanhadorData, b: GanhadorData) => {
        if (a.progresso >= 100 && b.progresso < 100) return -1;
        if (a.progresso < 100 && b.progresso >= 100) return 1;
        return b.progresso - a.progresso;
      },
    );

    return {
      ganhadores: sortedGanhadores,
      stats: {
        totalGanhadores,
        totalValidacoes,
        cuponsComMeta,
        embaixadoresAtivos,
      },
    };
  }

  async findByCode(codigo: string) {
    const cupom = await this.prisma.cupom.findFirst({
      where: { codigo: codigo.toUpperCase(), ativo: true },
      include: {
        embaixador: true,
        mecanica: true,
        _count: { select: { indicacoes: true } },
      },
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return cupom;
  }

  async findByEmbaixador(embaixadorId: number) {
    return this.prisma.cupom.findMany({
      where: { embaixadorId },
      include: {
        mecanica: true,
        _count: { select: { indicacoes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCupomDto, userId: number) {
    const codigo = dto.codigo.toUpperCase();

    // Check unique codigo
    const existing = await this.prisma.cupom.findFirst({
      where: { codigo },
    });

    if (existing) {
      throw new ConflictException('Código de cupom já existe');
    }

    // Check mecanica is valid
    const mecanica = await this.prisma.mecanica.findUnique({
      where: { id: dto.mecanicaId },
    });

    if (!mecanica) {
      throw new NotFoundException('Regra de Cupom não encontrada');
    }

    const today = new Date();
    if (
      mecanica.status !== 'ATIVA' ||
      mecanica.dataInicio > today ||
      mecanica.dataFim < today
    ) {
      throw new BadRequestException(
        'Regra de Cupom não está ativa ou fora do período',
      );
    }

    if (mecanica.cuponsEmitidos >= mecanica.limiteCupons) {
      throw new BadRequestException(
        'Limite de cupons atingido para esta regra',
      );
    }

    // Create cupom and increment cuponsEmitidos in a transaction
    const [cupom] = await this.prisma.$transaction([
      this.prisma.cupom.create({
        data: {
          codigo,
          embaixadorId: dto.embaixadorId,
          mecanicaId: dto.mecanicaId,
          criadoPorId: userId,
        },
        include: {
          embaixador: { select: { nome: true, cpf: true } },
          mecanica: {
            select: {
              nome: true,
              beneficioCliente: true,
              beneficioEmbaixador: true,
              dataFim: true,
            },
          },
        },
      }),
      this.prisma.mecanica.update({
        where: { id: dto.mecanicaId },
        data: { cuponsEmitidos: { increment: 1 } },
      }),
    ]);

    return cupom;
  }

  async deactivate(id: number) {
    const cupom = await this.prisma.cupom.findUnique({ where: { id } });

    if (!cupom) {
      throw new NotFoundException(`Cupom #${id} não encontrado`);
    }

    return this.prisma.cupom.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
