import { DoctorRepository } from './doctor.repository';
import { CreateDoctorDto } from './doctor.dto';
import { z } from 'zod';
import { hashPassword } from '../../utils/hash';
import { Role } from '@prisma/client';

export class DoctorService {
  private repository = new DoctorRepository();

  async createDoctor(data: z.infer<typeof CreateDoctorDto>) {
    const passwordHash = await hashPassword(data.password);
    
    const userData = {
      username: data.username,
      passwordHash,
      role: Role.DOCTOR,
      isActive: true,
    };

    const profileData = {
      name: data.name,
      departmentId: data.departmentId,
      phone: data.phone,
      consultationFee: data.consultationFee,
      incrementIntervalDays: data.incrementIntervalDays,
      renewalCharge: data.renewalCharge
    };

    return this.repository.createDoctor(userData, profileData);
  }

  async getAllDoctors() {
    return this.repository.getAllDoctors();
  }

  async getDoctorById(id: string) {
    return this.repository.getDoctorById(id);
  }
}
