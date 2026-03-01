import { Request, Response } from 'express';
import { PatientService } from './patient.service';
import { RegisterPatientDto } from './patient.dto';

export class PatientController {
  private service = new PatientService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = RegisterPatientDto.parse(req.body);
      const result = await this.service.registerPatient(data);
      res.status(201).json({ message: 'Patient registered successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to register patient' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const result = await this.service.getAllPatients(search);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch patients' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const patient = await this.service.getPatientById(id);
      if (!patient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      res.status(200).json({ data: patient });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch patient' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updated = await this.service.updatePatient(id, req.body);
      res.status(200).json({ message: 'Patient updated', data: updated });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update patient' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.service.deletePatient(id);
      res.status(200).json({ message: 'Patient deleted' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete patient' });
    }
  };
}
