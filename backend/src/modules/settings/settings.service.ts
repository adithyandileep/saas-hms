import { SettingsRepository } from './settings.repository';
import { z } from 'zod';

export const UpdateOrganizationDto = z.object({
  organizationName: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional()
});

export class SettingsService {
  private repository = new SettingsRepository();

  async getOrganization() {
    const org = await this.repository.getOrganization();
    if (!org) throw new Error('Organization not found');
    return org;
  }

  async updateOrganization(data: z.infer<typeof UpdateOrganizationDto>) {
    const org = await this.getOrganization();
    return this.repository.updateOrganization(org.id, data);
  }
}
