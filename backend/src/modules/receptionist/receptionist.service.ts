import { ReceptionistRepository } from './receptionist.repository';
import { CreateReceptionistDto } from './receptionist.dto';
import { z } from 'zod';
import { hashPassword } from '../../utils/hash';
import { Role } from '@prisma/client';
// Service
export class ReceptionistService {
  private repository = new ReceptionistRepository();

  async createReceptionist(data: z.infer<typeof CreateReceptionistDto>) {
    const passwordHash = await hashPassword(data.password);
    
    return this.repository.createReceptionist(
      { username: data.username, passwordHash, role: Role.RECEPTIONIST, isActive: true },
      { name: data.name, phone: data.phone }
    );
  }

  async getAllReceptionists() {
    return this.repository.getAllReceptionists();
  }
}
