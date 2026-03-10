import { Request, Response } from 'express';
import { GenerateInvoiceDto, UpdateInvoiceStatusDto } from './invoice.dto';
import { InvoiceService } from './invoice.service';

export class InvoiceController {
  private service = new InvoiceService();

  generate = async (req: Request, res: Response) => {
    try {
      const data = await this.service.generateInvoice(String(req.params.appointmentId), GenerateInvoiceDto.parse(req.body ?? {}));
      res.status(201).json({ message: 'Invoice generated', data });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to generate invoice' });
    }
  };

  getByAppointment = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getByAppointmentId(String(req.params.appointmentId));
      if (!data) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch invoice' });
    }
  };

  getByPatient = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getByPatientId(String(req.params.patientId));
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch invoices' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getById(String(req.params.id));
      if (!data) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch invoice' });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const data = await this.service.updateStatus(String(req.params.id), UpdateInvoiceStatusDto.parse(req.body).status);
      res.status(200).json({ message: 'Invoice status updated', data });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update invoice status' });
    }
  };
}

