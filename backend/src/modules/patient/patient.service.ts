import { PatientRepository } from './patient.repository';
import { RegisterPatientDto, UpsertPatientMedicalHistoryDto } from './patient.dto';
import { z } from 'zod';

export class PatientService {
  private repository = new PatientRepository();

  private generateUHID(): string {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `IP-${randomNum}`;
  }

  async registerPatient(data: z.infer<typeof RegisterPatientDto>) {
    const uhid = this.generateUHID();

    return this.repository.createPatient({
      uhid,
      name: data.name,
      firstName: (data as any).firstName || null,
      lastName: (data as any).lastName || null,
      age: data.age,
      dob: data.dob ? new Date(data.dob) : undefined,
      gender: data.gender,
      registrationDate: (data as any).registrationDate ? new Date((data as any).registrationDate) : new Date(),
      // Structured address
      houseNumber: (data as any).houseNumber || null,
      houseName: (data as any).houseName || null,
      houseAddress: (data as any).houseAddress || null,
      localArea: (data as any).localArea || null,
      street: (data as any).street || null,
      city: (data as any).city || null,
      state: (data as any).state || null,
      pincode: (data as any).pincode || null,
      // Combined address
      address: data.address,
      contactNo: data.contactNo,
      alternateContact: (data as any).alternateContact || null,
      email: data.email,
      // Guardian
      guardianName: data.guardianName,
      guardianRelation: data.guardianRelation,
      guardianContact: data.guardianContact,
      guardianComment: (data as any).guardianComment || null,
      guardianAddress: (data as any).guardianAddress || null,
      // Referral
      referredDoctor: (data as any).referredDoctor || null,
      referredHospital: (data as any).referredHospital || null,
      // ID proof
      idProofType: (data as any).idProofType || null,
      idProofDetail: (data as any).idProofDetail || null,
      idProofData: (data as any).idProofData || null,
      registrationAmount: data.registrationAmount || 200,
    });
  }

  async getAllPatients(search?: string) {
    return this.repository.getAllPatients(search);
  }

  async getPatientById(id: string) {
    return this.repository.getPatientById(id);
  }

  async updatePatient(id: string, data: any) {
    return this.repository.updatePatient(id, data);
  }

  async deletePatient(id: string) {
    return this.repository.deletePatient(id);
  }

  async getPatientMedicalHistory(patientId: string) {
    return this.repository.getPatientMedicalHistory(patientId);
  }

  async upsertPatientMedicalHistory(id: string, data: z.infer<typeof UpsertPatientMedicalHistoryDto>) {
    return this.repository.upsertPatientMedicalHistory(id, data);
  }
}
