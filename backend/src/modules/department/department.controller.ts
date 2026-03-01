import { Request, Response } from 'express';
import { DepartmentService, CreateDepartmentDto, UpdateDepartmentDto } from './department.service';
import { z } from 'zod';

export class DepartmentController {
  private service = new DepartmentService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const departments = await this.service.getAll();
      res.status(200).json({ data: departments });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to fetch departments' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const department = await this.service.getById(String(req.params.id));
      if (!department) {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      res.status(200).json({ data: department });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to fetch department' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = CreateDepartmentDto.parse(req.body);
      const department = await this.service.create(validatedData);
      res.status(201).json({ data: department });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation failed', errors: err.issues });
        return;
      }
      res.status(500).json({ message: err.message || 'Failed to create department' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = UpdateDepartmentDto.parse(req.body);
      const department = await this.service.update(String(req.params.id), validatedData);
      res.status(200).json({ data: department });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation failed', errors: err.issues });
        return;
      }
      res.status(500).json({ message: err.message || 'Failed to update department' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.delete(String(req.params.id));
      res.status(200).json({ message: 'Department deleted successfully' });
    } catch (err: any) {
      if (err?.code === 'P2003') { // Foreign key constraint failed
        res.status(400).json({ message: 'Cannot delete department as it has associated doctors.' });
        return;
      }
      if (err?.code === 'P2025') {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      res.status(500).json({ message: err.message || 'Failed to delete department' });
    }
  };
}
