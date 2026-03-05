import { Request, Response } from 'express';
import { BookingService } from './booking.service';
import { CreateSlotDto, BookAppointmentDto, CreateBulkSlotsDto, UpdateVisitDto } from './booking.dto';
import { prisma } from '../../config/prisma';
import { AppointmentStatus, PaymentStatus, PaymentMode } from '@prisma/client';

export class BookingController {
  private service = new BookingService();

  createSlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateSlotDto.parse(req.body);
      if (req.user?.role === 'DOCTOR' && req.user.userId !== data.doctorId) {
        res.status(403).json({ message: 'Forbidden: Can only create slots for yourself' });
        return;
      }
      const result = await this.service.createSlot(data);
      res.status(201).json({ message: 'Slot created successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create slot' });
    }
  };

  createBulkSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateBulkSlotsDto.parse(req.body);
      
      if (req.user?.role === 'DOCTOR' && req.user.userId !== data.doctorId) {
        res.status(403).json({ message: 'Forbidden: Can only create slots for yourself' });
        return;
      }
      
      const result = await this.service.createBulkSlots(data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to bulk create slots' });
    }
  };

  getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = String(req.params.doctorId || '');
      const date = req.query.date ? String(req.query.date) : '';

      if (!doctorId || !date) {
        res.status(400).json({ message: 'Doctor ID and Date are required' });
        return;
      }

      const slots = await this.service.getAvailableSlots(doctorId, date);
      res.status(200).json({ data: slots });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch slots' });
    }
  };

  bookAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = BookAppointmentDto.parse(req.body);
      const appointment = await this.service.bookAppointment(data);
      res.status(201).json({ message: 'Appointment booked successfully', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Booking collision or failure' });
    }
  };

  // List appointments for the logged-in doctor
  getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const patientId = req.query.patientId ? String(req.query.patientId) : undefined;
      
      let appointments;
      
      if (role === 'DOCTOR') {
        // Find doctor profile for this user
        const profile = await prisma.doctorProfile.findFirst({ where: { userId } });
        if (!profile) { res.status(404).json({ message: 'Doctor profile not found' }); return; }
        appointments = await prisma.appointment.findMany({
          where: { 
            doctorId: profile.id,
            ...(patientId ? { patientId } : {})
          },
          include: { 
            patient: { select: { name: true, uhid: true } },
            doctor: { select: { name: true, department: true } },
            visit: { select: { id: true, chiefComplaint: true, diagnosis: true, medications: true, notes: true, status: true } }
          },
          orderBy: { startTime: 'asc' }
        });
      } else {
        // Admin/Receptionist/SuperAdmin: support optional patientId filter
        appointments = await prisma.appointment.findMany({
          where: patientId ? { patientId } : {},
          include: { 
            patient: { select: { name: true, uhid: true } },
            doctor: { select: { name: true, department: true } },
            visit: { select: { id: true, chiefComplaint: true, diagnosis: true, medications: true, notes: true, status: true } }
          },
          orderBy: { startTime: 'desc' }
        });
      }
      
      res.status(200).json({ data: appointments });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  };

  // Acknowledge appointment
  acknowledgeAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CHECKED_IN }
      });
      res.status(200).json({ message: 'Appointment acknowledged', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to acknowledge' });
    }
  };

  // GET /appointments/:id – single appointment for billing page
  getAppointmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const appt = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: { select: { id: true, name: true, uhid: true, contactNo: true } },
          doctor: { select: { id: true, name: true, department: true } },
        },
      });
      if (!appt) { res.status(404).json({ message: 'Appointment not found' }); return; }
      res.status(200).json({ data: appt });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // POST /appointments/:id/pay – record payment
  payAppointment = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { amount, paymentMode } = req.body;
    try {
      const modeToUse = (paymentMode as PaymentMode) || PaymentMode.CASH;
      
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) { res.status(404).json({ message: 'Not found' }); return; }

      // 1. Resolve Provider Strategy via Factory
      const { PaymentStrategyFactory } = require('../payment/payment.factory');
      const provider = PaymentStrategyFactory.getProvider(modeToUse);

      // 2. Perform Payment Creation
      const paymentResult = await provider.createPayment(Number(amount), { appointmentId: id });
      
      if (!paymentResult.success) {
        res.status(400).json({ message: 'Payment processing failed with provider' });
        return;
      }

      // 3. Update Domain Totals
      const newPaid = appt.paidAmount + Number(amount);
      const newPending = Math.max(0, appt.totalAmount - newPaid);
      const newStatus = newPending === 0 ? PaymentStatus.PAID : newPaid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING;

      // 4. Save Payment Record
      await prisma.payment.create({
        data: { 
          appointmentId: id, 
          amount: Number(amount), 
          paymentMode: modeToUse, 
          status: paymentResult.status,
          transactionId: paymentResult.transactionId 
        },
      });

      // 5. Save Updated Appointment
      const updated = await prisma.appointment.update({
        where: { id },
        data: { paidAmount: newPaid, pendingAmount: newPending, paymentStatus: newStatus },
      });

      res.status(200).json({ data: updated, transactionInfo: paymentResult });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Payment failed' });
    }
  };

  // GET /appointments/:id/visit
  getVisit = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = String(req.params.id);
      const visit = await prisma.visit.findUnique({
        where: { appointmentId }
      });
      res.status(200).json({ data: visit || null });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch visit' });
    }
  };

  // PUT /appointments/:id/visit
  updateVisit = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = String(req.params.id);
      const data = UpdateVisitDto.parse(req.body);

      const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }

      const visit = await prisma.visit.upsert({
        where: { appointmentId },
        update: { ...data },
        create: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          ...data
        }
      });

      res.status(200).json({ message: 'Visit updated', data: visit });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update visit' });
    }
  };

  completeAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);

      // 1. Mark appointment as complete
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.COMPLETED }
      });

      // 2. Mark visit as complete if exists
      const visit = await prisma.visit.findUnique({ where: { appointmentId: id } });
      if (visit) {
        await prisma.visit.update({
          where: { appointmentId: id },
          data: { status: 'completed' }
        });
      }

      // 3. Free up the slot — decrement bookedCount and re-open if below capacity
      if (appointment.slotId) {
        const slot = await prisma.slot.findUnique({ where: { id: appointment.slotId } });
        if (slot) {
          const newCount = Math.max(0, slot.bookedCount - 1);
          await prisma.slot.update({
            where: { id: slot.id },
            data: {
              bookedCount: newCount,
              isAvailable: newCount < slot.maxCapacity
            }
          });
        }
      }

      res.status(200).json({ message: 'Consultation completed', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to complete appointment' });
    }
  };
}

