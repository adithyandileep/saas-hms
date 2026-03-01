import { ReceptionistRepository } from './receptionist.repository';
import { CreateReceptionistDto } from './receptionist.dto';
import { z } from 'zod';
import { hashPassword } from '../../utils/hash';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';

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

// Controller
export class ReceptionistController {
  private service = new ReceptionistService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateReceptionistDto.parse(req.body);
      const result = await this.service.createReceptionist(data);
      res.status(201).json({ message: 'Receptionist created successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create receptionist' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getAllReceptionists();
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch receptionists' });
    }
  };
}
