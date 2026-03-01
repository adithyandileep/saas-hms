import { AdminRepository } from './admin.repository';
import { CreateAdminDto, UpdateAdminDto } from './admin.dto';
import { z } from 'zod';
import { hashPassword } from '../../utils/hash';
import { Role } from '@prisma/client';

export class AdminService {
  private repository = new AdminRepository();

  async getAllAdmins() {
    return this.repository.getAllAdmins();
  }

  async getAdminById(id: string) {
    return this.repository.getAdminById(id);
  }

  async createAdmin(data: z.infer<typeof CreateAdminDto>) {
    const passwordHash = await hashPassword(data.password);
    
    return this.repository.createAdmin(
      {
        username: data.username,
        passwordHash,
        role: Role.ADMIN,
      },
      {
        name: data.name,
        phone: data.phone,
        permissions: data.permissions,
      }
    );
  }

  async updateAdmin(id: string, data: z.infer<typeof UpdateAdminDto>) {
    return this.repository.updateAdmin(id, {
      isActive: data.isActive,
      name: data.name,
      phone: data.phone,
      permissions: data.permissions,
    });
  }

  async deleteAdmin(id: string) {
    return this.repository.deleteAdmin(id);
  }

  async getDashboardStats() {
    return this.repository.getDashboardStats();
  }
}
