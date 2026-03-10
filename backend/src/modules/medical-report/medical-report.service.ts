import { CreateMedicalReportType } from './medical-report.dto';
import { MedicalReportRepository } from './medical-report.repository';

export class MedicalReportService {
  private repository = new MedicalReportRepository();

  async createReport(data: CreateMedicalReportType) {
    return this.repository.createReport(data);
  }

  async getReportsByPatientId(patientId: string) {
    return this.repository.getReportsByPatientId(patientId);
  }

  async getReportById(id: string) {
    return this.repository.getReportById(id);
  }

  async deleteReport(id: string) {
    return this.repository.deleteReport(id);
  }
}
