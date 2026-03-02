import { prisma } from '../../config/prisma';
import { CreateMedicalReportType } from './medical-report.dto';

export class MedicalReportService {
  async createReport(data: CreateMedicalReportType) {
    return prisma.medicalReport.create({ data });
  }

  async getReportsByPatientId(patientId: string) {
    return prisma.medicalReport.findMany({
      where: { patientId },
      orderBy: { uploadedDate: 'desc' }
    });
  }

  async getReportById(id: string) {
    return prisma.medicalReport.findUnique({ where: { id } });
  }

  async deleteReport(id: string) {
    return prisma.medicalReport.delete({ where: { id } });
  }
}
