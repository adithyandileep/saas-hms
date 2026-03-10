import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

export class VisitController {
  private isSameDay = (dateA: Date, dateB: Date): boolean =>
    dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();

  // POST /visits - create or get existing visit for an appointment (idempotent)
  create = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.body;
    try {
      const existing = await prisma.visit.findUnique({ where: { appointmentId } });
      if (existing) {
        res.status(200).json({ data: existing });
        return;
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { patientId: true, doctorId: true, startTime: true },
      });
      if (!appointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }

      if (req.user?.role === 'DOCTOR' && !this.isSameDay(new Date(appointment.startTime), new Date())) {
        res.status(400).json({ message: 'Doctors can acknowledge only on the appointment day' });
        return;
      }

      const visit = await prisma.visit.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          status: 'in_progress',
        },
      });

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CHECKED_IN' },
      });

      res.status(201).json({ data: visit });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Failed to create visit' });
    }
  };

  // GET /visits/:id
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const visitId = String(req.params.id);
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          appointment: {
            include: {
              patient: { select: { id: true, name: true, uhid: true, age: true, gender: true } },
              doctor: { select: { id: true, name: true, department: true } },
            },
          },
        },
      });
      if (!visit) {
        res.status(404).json({ message: 'Visit not found' });
        return;
      }
      res.status(200).json({ data: visit });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  // PUT /visits/:id - save clinical notes
  update = async (req: Request, res: Response): Promise<void> => {
    const { chiefComplaint, diagnosis, medications, notes, status } = req.body;
    const visitId = String(req.params.id);
    try {
      const existing = await prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          appointment: {
            select: {
              startTime: true,
            },
          },
        },
      });

      if (!existing) {
        res.status(404).json({ message: 'Visit not found' });
        return;
      }

      if (
        req.user?.role === 'DOCTOR'
        && !this.isSameDay(new Date(existing.appointment.startTime), new Date())
      ) {
        res.status(400).json({ message: 'Doctors can edit consultation only on the appointment day' });
        return;
      }

      const updated = await prisma.visit.update({
        where: { id: visitId },
        data: {
          chiefComplaint: chiefComplaint ?? undefined,
          diagnosis: diagnosis ?? undefined,
          medications: medications ?? undefined,
          notes: notes ?? undefined,
          status: status ?? undefined,
        },
      });

      if (status === 'completed') {
        await prisma.appointment.update({
          where: { id: updated.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      res.status(200).json({ data: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to update visit' });
    }
  };
}
