import { Request, Response } from 'express';
import { ReceptionistService } from './receptionist.service';
import { CreateReceptionistDto } from './receptionist.dto';

export class ReceptionistController {
  private service = new ReceptionistService();

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const receptionists = await this.service.getAllReceptionists();
      res.status(200).json({ data: receptionists });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to fetch receptionists' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateReceptionistDto.parse(req.body);
      const receptionist = await this.service.createReceptionist(data);
      res.status(201).json({ message: 'Receptionist created', data: receptionist });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to create receptionist' });
    }
  };
}
