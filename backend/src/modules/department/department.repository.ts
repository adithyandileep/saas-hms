import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
  async getAll() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { doctors: true }
        }
      }
    });
  }

  async getById(id: string) {
    return prisma.department.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({
      data
    });
  }

  async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return prisma.department.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.department.delete({
      where: { id }
    });
  }
}
