import { Request, Response } from 'express';
import { SettingsService, UpdateOrganizationDto } from './settings.service';

export class SettingsController {
  private service = new SettingsService();

  getOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const org = await this.service.getOrganization();
      res.status(200).json({ data: org });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  };

  updateOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = UpdateOrganizationDto.parse(req.body);
      const updated = await this.service.updateOrganization(data);
      res.status(200).json({ message: 'Organization updated successfully', data: updated });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update organization' });
    }
  };
}
