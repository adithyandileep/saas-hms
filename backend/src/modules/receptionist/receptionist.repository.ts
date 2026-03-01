import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class ReceptionistRepository {
  async createReceptionist(data: Prisma.UserCreateInput, profileData: Omit<Prisma.ReceptionistProfileCreateInput, 'user'>) {
    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({ data });
      
      const profile = await tx.receptionistProfile.create({
        data: {
          ...profileData,
          user: { connect: { id: user.id } }
        }
      });
      
      return { user, profile };
    });
  }

  async getAllReceptionists() {
    return prisma.receptionistProfile.findMany({
      include: { user: { select: { username: true, isActive: true } } }
    });
  }
}
