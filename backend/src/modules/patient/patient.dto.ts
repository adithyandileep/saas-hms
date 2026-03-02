import { z } from 'zod';

export const RegisterPatientDto = z.object({
  name: z.string().min(1, 'Name is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
age: z.number().int().nonnegative('Age cannot be negative'),  dob: z.string().optional(),
  gender: z.string().optional(),
  
  // Structured Address
  houseNumber: z.string().optional(),
  houseName: z.string().optional(),
  houseAddress: z.string().optional(),
  localArea: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  
  // Contact info
  contactNo: z.string().optional(),
  alternateContact: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(), // Legacy combined
  
  // Guardian Info
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianContact: z.string().optional(),
  guardianComment: z.string().optional(),
  guardianAddress: z.string().optional(),
  
  // Referral
  referredDoctor: z.string().optional(),
  referredHospital: z.string().optional(),

  // ID Proof
  idProofType: z.string().optional(),
  idProofDetail: z.string().optional(),
  idProofData: z.string().optional(),

  registrationAmount: z.number().optional().default(200),
  registrationDate: z.string().optional(), // ISO date
});
