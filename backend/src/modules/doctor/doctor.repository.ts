import { prisma } from '../../config/prisma';
import { Prisma, Role, DoctorProfile } from '@prisma/client';

export class DoctorRepository {
  async createDoctor(data: Prisma.UserCreateInput, profileData: Omit<Prisma.DoctorProfileCreateInput, 'user' | 'department'> & { departmentId: string }) {
    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({ data });
      
      const profile = await tx.doctorProfile.create({
        data: {
          ...profileData,
          department: { connect: { id: profileData.departmentId } },
          user: { connect: { id: user.id } }
        }
      });
      
      return { user, profile };
    });
  }

  async getAllDoctors() {
    return prisma.doctorProfile.findMany({
      include: { 
        user: { select: { username: true, isActive: true } },
        department: true
      }
    });
  }

  async getDoctorById(id: string) {
    return prisma.doctorProfile.findUnique({
      where: { id },
      include: { 
        user: { select: { username: true, isActive: true } },
        department: true 
      }
    });
  }
}
