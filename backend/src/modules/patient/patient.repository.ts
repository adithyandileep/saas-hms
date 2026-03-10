import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class PatientRepository {
  async createPatient(data: any) {
    return prisma.patient.create({ data });
  }

  async getAllPatients(search?: string) {
    const where: Prisma.PatientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { uhid: { contains: search, mode: 'insensitive' } },
            { contactNo: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, uhid: true, name: true, age: true, gender: true,
        contactNo: true, alternateContact: true, email: true,
        registrationPaymentStatus: true, createdAt: true,
      },
    });
  }

  async getPatientById(id: string) {
    return prisma.patient.findFirst({
      where: {
        OR: [
          { id },
          { uhid: id }
        ]
      },
      include: {
        appointments: {
          include: { doctor: true, slot: true },
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: true,
        medicalReports: true,
        medicalHistory: true,
      },
    });
  }

  async updatePatient(id: string, data: any) {
    const {
      name, firstName, lastName, dob, gender, registrationDate,
      address, contactNo, alternateContact, email,
      houseNumber, houseName, houseAddress, localArea, street, city, state, pincode,
      guardianName, guardianRelation, guardianContact, guardianComment, guardianAddress,
      referredDoctor, referredHospital, idProofType, idProofDetail,
    } = data;

    return prisma.patient.update({
      where: { id },
      data: {
        name, firstName, lastName,
        dob: dob ? new Date(dob) : undefined,
        gender, registrationDate: registrationDate ? new Date(registrationDate) : undefined,
        address, contactNo, alternateContact, email,
        houseNumber, houseName, houseAddress, localArea, street, city, state, pincode,
        guardianName, guardianRelation, guardianContact, guardianComment, guardianAddress,
        referredDoctor, referredHospital, idProofType, idProofDetail,
      },
    });
  }

  async deletePatient(id: string) {
    // Delete related records first
    await prisma.appointment.updateMany({
      where: { patientId: id },
      data: { status: 'CANCELLED' },
    });
    return prisma.patient.delete({ where: { id } });
  }

  async getPatientMedicalHistory(patientId: string) {
    return prisma.patientMedicalHistory.findUnique({
      where: { patientId },
    });
  }

  async upsertPatientMedicalHistory(
    patientId: string,
    data: {
      pastMedicalHistory?: string;
      pastSurgicalHistory?: string;
      allergies?: string;
      familyHistory?: string;
      socialHistory?: string;
      medications?: string;
      vaccinationHistory?: string;
    }
  ) {
    return prisma.patientMedicalHistory.upsert({
      where: { patientId },
      update: data,
      create: {
        patientId,
        ...data,
      },
    });
  }

  getPatientByUserId(userId: string) {
    return prisma.patient.findUnique({ where: { userId } });
  }

  updateRegistrationPaymentStatus(id: string) {
    return prisma.patient.update({
      where: { id },
      data: { registrationPaymentStatus: 'PAID' },
    });
  }
}
