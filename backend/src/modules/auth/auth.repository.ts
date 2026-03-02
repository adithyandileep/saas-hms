import { prisma } from '../../config/prisma';
import { Prisma, Role, User } from '@prisma/client';

export class AuthRepository {
  async findUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
      include: {
        adminProfile: true,
        doctorProfile: true,
        receptionist: true,
      }
    });
  }

  async checkSuperAdminExists(): Promise<boolean> {
    const count = await prisma.user.count({
      where: { role: Role.SUPERADMIN }
    });
    console.log(count);
    return count > 0;
  }

  async createSuperAdmin(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data
    });
  }

  async createOrganization(data: Prisma.OrganizationCreateInput) {
    return prisma.organization.create({ data });
  }
}
