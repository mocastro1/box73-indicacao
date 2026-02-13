import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    usuarioId?: number;
    acao: string;
    entidade: string;
    entidadeId?: number;
    detalhes?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        detalhes: params.detalhes,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  async findAll(page = 1, usuarioId?: number, entidade?: string) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (entidade) where.entidade = entidade;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: { select: { nome: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
