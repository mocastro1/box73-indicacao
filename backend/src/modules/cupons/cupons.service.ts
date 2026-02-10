import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCupomDto } from './dto/cupom.dto';

@Injectable()
export class CuponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, embaixadorId?: number, mecanicaId?: number) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (embaixadorId) where.embaixadorId = embaixadorId;
    if (mecanicaId) where.mecanicaId = mecanicaId;

    const [data, total] = await Promise.all([
      this.prisma.cupom.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          embaixador: { select: { nome: true, cpf: true } },
          mecanica: { select: { nome: true, beneficioCliente: true } },
          _count: { select: { indicacoes: true } },
        },
      }),
      this.prisma.cupom.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
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
      orderBy: { criadoEm: 'desc' },
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
      throw new NotFoundException('Mecânica não encontrada');
    }

    const today = new Date();
    if (
      mecanica.status !== 'ATIVA' ||
      mecanica.dataInicio > today ||
      mecanica.dataFim < today
    ) {
      throw new BadRequestException('Mecânica não está ativa ou fora do período');
    }

    if (mecanica.cuponsEmitidos >= mecanica.limiteCupons) {
      throw new BadRequestException('Limite de cupons atingido para esta mecânica');
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
          mecanica: { select: { nome: true, beneficioCliente: true } },
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
