import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto } from './admin.dto';

export class AdminController {
  private service = new AdminService();

  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getDashboardStats();
      res.status(200).json({ data: stats });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to fetch dashboard stats' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const admins = await this.service.getAllAdmins();
      res.status(200).json({ data: admins });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to fetch admins' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = String(req.params.id);
      const admin = await this.service.getAdminById(adminId);
      if (!admin) {
        res.status(404).json({ message: 'Admin not found' });
        return;
      }
      res.status(200).json({ data: admin });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateAdminDto.parse(req.body);
      const admin = await this.service.createAdmin(data);
      res.status(201).json({ message: 'Admin created', data: admin });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to create admin' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = String(req.params.id);
      const data = UpdateAdminDto.parse(req.body);
      const updated = await this.service.updateAdmin(adminId, data);
      res.status(200).json({ message: 'Admin updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to update admin' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = String(req.params.id);
      await this.service.deleteAdmin(adminId);
      res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to delete admin' });
    }
  };
}
