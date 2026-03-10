import { RadiologyRequestStatus } from '@prisma/client';
import { z } from 'zod';
import { CreateRadiologyReportDto, CreateRadiologyRequestDto, CreateRadiologyTestDto, UpdateRadiologyRequestStatusDto, UpdateRadiologyTestDto } from './radiology.dto';
import { RadiologyRepository } from './radiology.repository';

export class RadiologyService {
  private repository = new RadiologyRepository();
  async getAllTests(includeInactive = false, role?: string) { const tests = await this.repository.getAllTests(includeInactive); return role === 'DOCTOR' ? tests.map(({ price: _price, ...rest }) => rest) : tests; }
  createTest(data: z.infer<typeof CreateRadiologyTestDto>) { return this.repository.createTest(data); }
  updateTest(id: string, data: z.infer<typeof UpdateRadiologyTestDto>) { return this.repository.updateTest(id, data); }
  deactivateTest(id: string) { return this.repository.updateTest(id, { isActive: false }); }
  getAllRequests(filters?: { status?: string; patientId?: string; doctorId?: string }) { return this.repository.getAllRequests({ status: filters?.status as RadiologyRequestStatus | undefined, patientId: filters?.patientId, doctorId: filters?.doctorId }); }
  getRequestById(id: string) { return this.repository.getRequestById(id); }
  getRequestsByPatientId(patientId: string) { return this.repository.getRequestsByPatientId(patientId); }
  async createRequest(data: z.infer<typeof CreateRadiologyRequestDto>) { const test = await this.repository.getTestById(data.radiologyTestId); if (!test) throw new Error('Radiology test not found'); if (!test.isActive) throw new Error('Radiology test is inactive'); return this.repository.createRequest({ ...data, testNameSnapshot: test.testName, modalitySnapshot: test.modality, priceSnapshot: test.price }); }
  async updateRequestStatus(id: string, data: z.infer<typeof UpdateRadiologyRequestStatusDto>) { const request = await this.repository.getRequestById(id); if (!request) throw new Error('Radiology request not found'); return this.repository.updateRequestStatus(id, data.status as RadiologyRequestStatus); }
  async createReport(data: z.infer<typeof CreateRadiologyReportDto>) { const request = await this.repository.getRequestById(data.radiologyRequestId); if (!request) throw new Error('Radiology request not found'); if (request.report) throw new Error('Report already exists for this request'); return this.repository.createReport(data); }
  getReportById(id: string) { return this.repository.getReportById(id); }
}
