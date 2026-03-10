import { prisma } from '../../config/prisma';
import { CreateMedicalReportType } from './medical-report.dto';

export class MedicalReportRepository {
  createReport(data: CreateMedicalReportType) {
    return prisma.medicalReport.create({ data });
  }

  getReportsByPatientId(patientId: string) {
    return prisma.medicalReport.findMany({
      where: { patientId },
      orderBy: { uploadedDate: 'desc' },
    });
  }

  getReportById(id: string) {
    return prisma.medicalReport.findUnique({ where: { id } });
  }

  deleteReport(id: string) {
    return prisma.medicalReport.delete({ where: { id } });
  }
}
