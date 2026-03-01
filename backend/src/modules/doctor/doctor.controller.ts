import { Request, Response } from 'express';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './doctor.dto';

export class DoctorController {
  private service = new DoctorService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateDoctorDto.parse(req.body);
      const result = await this.service.createDoctor(data);
      res.status(201).json({ message: 'Doctor created successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create doctor' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctors = await this.service.getAllDoctors();
      res.status(200).json({ data: doctors });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch doctors' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const doctor = await this.service.getDoctorById(id);
      if (!doctor) {
         res.status(404).json({ message: 'Doctor not found' });
         return;
      }
      res.status(200).json({ data: doctor });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch doctor' });
    }
  };
}
