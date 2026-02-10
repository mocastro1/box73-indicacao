import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmbaixadorDto, UpdateEmbaixadorDto } from './dto/embaixador.dto';

@Injectable()
export class EmbaixadoresService {
  constructor(private readonly prisma: PrismaService) {}

  private stripCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  async findAll(page = 1, search?: string) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = { ativo: true };
    if (search) {
      const searchClean = search.replace(/\D/g, '');
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: searchClean || search } },
        { telefone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.embaixador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count: { select: { cupons: true } },
        },
      }),
      this.prisma.embaixador.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const embaixador = await this.prisma.embaixador.findUnique({
      where: { id },
      include: {
        cupons: {
          include: {
            mecanica: true,
            _count: { select: { indicacoes: true } },
          },
        },
      },
    });

    if (!embaixador) {
      throw new NotFoundException(`Embaixador #${id} não encontrado`);
    }

    return embaixador;
  }

  async findByCpf(cpf: string) {
    const cleanCpf = this.stripCpf(cpf);

    const embaixador = await this.prisma.embaixador.findFirst({
      where: { cpf: cleanCpf, ativo: true },
      include: {
        cupons: {
          include: {
            mecanica: true,
          },
        },
      },
    });

    if (!embaixador) {
      throw new NotFoundException('Embaixador não encontrado com este CPF');
    }

    return embaixador;
  }

  async create(dto: CreateEmbaixadorDto) {
    const cleanCpf = this.stripCpf(dto.cpf);

    const existing = await this.prisma.embaixador.findFirst({
      where: { cpf: cleanCpf },
    });

    if (existing) {
      throw new ConflictException('CPF já cadastrado');
    }

    return this.prisma.embaixador.create({
      data: {
        ...dto,
        cpf: cleanCpf,
      },
    });
  }

  async update(id: number, dto: UpdateEmbaixadorDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (data.cpf) {
      data.cpf = this.stripCpf(data.cpf);
    }

    return this.prisma.embaixador.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.embaixador.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
