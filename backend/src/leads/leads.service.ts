import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    const exists = await this.prisma.lead.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe un lead con ese email');
    return this.prisma.lead.create({ data: dto });
  }

  async findAll(query: QueryLeadsDto) {
    const { search, fuente, fechaDesde, fechaHasta, page = 1, limit = 10 } = query;

    const where: Prisma.LeadWhereInput = {
      ...(fuente && { fuente }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(fechaDesde || fechaHasta
        ? {
            createdAt: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(new Date(fechaHasta).setHours(23, 59, 59, 999)) }),
            },
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    if (dto.email) {
      const conflict = await this.prisma.lead.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Ya existe un lead con ese email');
    }
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async getStats() {
    const total = await this.prisma.lead.count();

    const bySource = await this.prisma.lead.groupBy({
      by: ['fuente'],
      _count: { fuente: true },
    });

    const budgetAgg = await this.prisma.lead.aggregate({
      _avg: { presupuesto: true },
    });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const last7Days = await this.prisma.lead.count({ where: { createdAt: { gte: since } } });

    return {
      total,
      bySource: bySource.map((r) => ({ fuente: r.fuente, count: r._count.fuente })),
      avgBudget: budgetAgg._avg.presupuesto ?? 0,
      last7Days,
    };
  }
}
