import { Request, Response } from 'express';
import { BookingService } from './booking.service';
import { CreateSlotDto, BookAppointmentDto, CreateBulkSlotsDto, UpdateVisitDto } from './booking.dto';
import { prisma } from '../../config/prisma';
import { PaymentStatus, PaymentMode } from '@prisma/client';

export class BookingController {
  private service = new BookingService();
  private isSameDay = (dateA: Date, dateB: Date): boolean =>
    dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();

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

  getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const patientId = req.query.patientId ? String(req.query.patientId) : undefined;

      const appointments = await this.service.getAppointmentsForUser(String(userId || ''), String(role || ''), patientId);
      res.status(200).json({ data: appointments });
    } catch (error: any) {
      if ((error.message || '').includes('Doctor profile not found')) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: error.message || 'Failed to fetch appointments' });
    }
  };

  acknowledgeAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const appt = await this.service.getAppointmentById(id);
      if (!appt) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }

      if (req.user?.role === 'DOCTOR' && !this.isSameDay(new Date(appt.startTime), new Date())) {
        res.status(400).json({ message: 'Doctors can acknowledge only on the appointment day' });
        return;
      }

      if (appt.status !== 'BOOKED' && appt.status !== 'CHECKED_IN') {
        res.status(400).json({ message: 'Appointment cannot be acknowledged in current status' });
        return;
      }

      const appointment = await this.service.acknowledgeAppointment(id);
      res.status(200).json({ message: 'Appointment acknowledged', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to acknowledge' });
    }
  };

  getAppointmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const appt = await this.service.getAppointmentById(id);
      if (!appt) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      res.status(200).json({ data: appt });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch appointment' });
    }
  };

  payAppointment = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { amount, paymentMode } = req.body;
    try {
      const modeToUse = (paymentMode as PaymentMode) || PaymentMode.CASH;

      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) {
        res.status(404).json({ message: 'Not found' });
        return;
      }

      const { PaymentStrategyFactory } = require('../payment/payment.factory');
      const provider = PaymentStrategyFactory.getProvider(modeToUse);

      const paymentResult = await provider.createPayment(Number(amount), { appointmentId: id });

      if (!paymentResult.success) {
        res.status(400).json({ message: 'Payment processing failed with provider' });
        return;
      }

      const newPaid = appt.paidAmount + Number(amount);
      const newPending = Math.max(0, appt.totalAmount - newPaid);
      const newStatus = newPending === 0 ? PaymentStatus.PAID : newPaid > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING;

      await prisma.payment.create({
        data: {
          appointmentId: id,
          amount: Number(amount),
          paymentMode: modeToUse,
          status: paymentResult.status,
          transactionId: paymentResult.transactionId,
        },
      });

      const updated = await prisma.appointment.update({
        where: { id },
        data: { paidAmount: newPaid, pendingAmount: newPending, paymentStatus: newStatus },
      });

      res.status(200).json({ data: updated, transactionInfo: paymentResult });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Payment failed' });
    }
  };

  getVisit = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = String(req.params.id);
      const visit = await this.service.getVisit(appointmentId);
      res.status(200).json({ data: visit || null });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch visit' });
    }
  };

  updateVisit = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = String(req.params.id);
      const data = UpdateVisitDto.parse(req.body);
      const appt = await this.service.getAppointmentById(appointmentId);
      if (!appt) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }

      if (req.user?.role === 'DOCTOR' && !this.isSameDay(new Date(appt.startTime), new Date())) {
        res.status(400).json({ message: 'Doctors can edit consultation only on the appointment day' });
        return;
      }

      const visit = await this.service.upsertVisit(appointmentId, data);

      res.status(200).json({ message: 'Visit updated', data: visit });
    } catch (error: any) {
      if ((error.message || '').includes('Appointment not found')) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update visit' });
    }
  };

  completeAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const appointment = await this.service.completeAppointment(id);
      res.status(200).json({ message: 'Consultation completed', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to complete appointment' });
    }
  };

  getMedicines = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.getActiveMedicines();
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch medicines' });
    }
  };
}
