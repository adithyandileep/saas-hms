import { Request, Response } from 'express';
import { PaymentMode } from '@prisma/client';
import { BookAppointmentDto, CreateBulkSlotsDto, CreateSlotDto, UpdateVisitDto } from './booking.dto';
import { BookingService } from './booking.service';

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
      const appointments = await this.service.getAppointmentsForUser(
        String(req.user?.userId || ''),
        String(req.user?.role || ''),
        req.query.patientId ? String(req.query.patientId) : undefined,
        req.query.doctorId ? String(req.query.doctorId) : undefined,
      );
      res.status(200).json({ data: appointments });
    } catch (error: any) {
      if ((error.message || '').includes('profile not found')) {
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
      const appt = await this.service.getAppointmentById(String(req.params.id));
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
    try {
      const result = await this.service.payAppointment(
        String(req.params.id),
        Number(req.body.amount),
        (req.body.paymentMode as PaymentMode) || PaymentMode.CASH,
      );
      res.status(200).json(result);
    } catch (error: any) {
      if ((error.message || '').includes('Appointment not found')) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || 'Payment failed' });
    }
  };

  getVisit = async (req: Request, res: Response): Promise<void> => {
    try {
      const visit = await this.service.getVisit(String(req.params.id));
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
      const appointment = await this.service.completeAppointment(String(req.params.id));
      res.status(200).json({ message: 'Consultation completed', data: appointment });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to complete appointment' });
    }
  };

  getMedicines = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.getActiveMedicines();
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch medicines' });
    }
  };
}
