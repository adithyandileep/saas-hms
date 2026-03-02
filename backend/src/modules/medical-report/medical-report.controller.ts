import { Request, Response } from 'express';
import { MedicalReportService } from './medical-report.service';
import { CreateMedicalReportDto } from './medical-report.dto';

export class MedicalReportController {
  private service = new MedicalReportService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateMedicalReportDto.parse(req.body);
      const result = await this.service.createReport(data);
      res.status(201).json({ message: 'Medical report uploaded', data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Validation failed' });
    }
  };

  getByPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = String(req.params.patientId);
      const reports = await this.service.getReportsByPatientId(patientId);
      res.status(200).json({ data: reports });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch medical reports' });
    }
  };

  // Add more as needed
}
