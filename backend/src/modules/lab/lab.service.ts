import { LabRequestStatus } from '@prisma/client';
import { z } from 'zod';
import { CreateLabReportDto, CreateLabRequestDto, CreateLabTestDto, UpdateLabRequestStatusDto, UpdateLabTestDto } from './lab.dto';
import { LabRepository } from './lab.repository';

export class LabService {
  private repository = new LabRepository();
  getAllTests(includeInactive = false) { return this.repository.getAllTests(includeInactive); }
  createTest(data: z.infer<typeof CreateLabTestDto>) { return this.repository.createTest(data); }
  updateTest(id: string, data: z.infer<typeof UpdateLabTestDto>) { return this.repository.updateTest(id, data); }
  deactivateTest(id: string) { return this.repository.updateTest(id, { isActive: false }); }
  getAllRequests(filters?: { status?: string; patientId?: string; doctorId?: string }) { return this.repository.getAllRequests({ status: filters?.status as LabRequestStatus | undefined, patientId: filters?.patientId, doctorId: filters?.doctorId }); }
  getRequestById(id: string) { return this.repository.getRequestById(id); }
  getRequestsByPatientId(patientId: string) { return this.repository.getRequestsByPatientId(patientId); }
  async createRequest(data: z.infer<typeof CreateLabRequestDto>) {
    const labTest = await this.repository.getTestById(data.labTestId);
    if (!labTest) throw new Error('Lab test not found');
    if (!labTest.isActive) throw new Error('Lab test is inactive');
    return this.repository.createRequest({ ...data, testNameSnapshot: labTest.testName, priceSnapshot: labTest.price });
  }
  async updateRequestStatus(id: string, data: z.infer<typeof UpdateLabRequestStatusDto>) {
    const request = await this.repository.getRequestById(id);
    if (!request) throw new Error('Lab request not found');
    return this.repository.updateRequestStatus(id, data.status as LabRequestStatus);
  }
  async createReport(data: z.infer<typeof CreateLabReportDto>) {
    const request = await this.repository.getRequestById(data.labRequestId);
    if (!request) throw new Error('Lab request not found');
    if (request.report) throw new Error('Report already exists for this request');
    return this.repository.createReport(data);
  }
  getReportById(id: string) { return this.repository.getReportById(id); }
}
