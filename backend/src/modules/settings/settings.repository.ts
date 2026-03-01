import { prisma } from '../../config/prisma';
import { Organization } from '@prisma/client';

export class SettingsRepository {
  async getOrganization(): Promise<Organization | null> {
    return prisma.organization.findFirst();
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data
    });
  }
}
