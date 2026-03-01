import { DepartmentRepository } from './department.repository';
import { z } from 'zod';

export const CreateDepartmentDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export const UpdateDepartmentDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
});

export class DepartmentService {
  private repository = new DepartmentRepository();

  async getAll() {
    return this.repository.getAll();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }

  async create(data: z.infer<typeof CreateDepartmentDto>) {
    return this.repository.create(data);
  }

  async update(id: string, data: z.infer<typeof UpdateDepartmentDto>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
