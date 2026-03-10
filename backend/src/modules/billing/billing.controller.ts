import { Request, Response } from 'express';
import { CreateBillingItemDto, UpdateBillingItemDto } from './billing.dto';
import { BillingService } from './billing.service';

export class BillingController {
  private service = new BillingService();
  getByAppointment = async (req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getItemsByAppointmentId(String(req.params.id)) }); } catch (err: any) { res.status(500).json({ message: err.message || 'Failed to fetch billing items' }); } };
  getByPatient = async (req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getItemsByPatientId(String(req.params.patientId)) }); } catch (err: any) { res.status(500).json({ message: err.message || 'Failed to fetch patient billing history' }); } };
  createItem = async (req: Request, res: Response) => { try { res.status(201).json({ message: 'Billing item added', data: await this.service.createItem(CreateBillingItemDto.parse(req.body)) }); } catch (err: any) { res.status(400).json({ message: err.message || 'Failed to add billing item' }); } };
  updateItem = async (req: Request, res: Response) => { try { res.status(200).json({ message: 'Billing item updated', data: await this.service.updateItem(String(req.params.id), UpdateBillingItemDto.parse(req.body)) }); } catch (err: any) { res.status(400).json({ message: err.message || 'Failed to update billing item' }); } };
  deleteItem = async (req: Request, res: Response) => { try { await this.service.deleteItem(String(req.params.id)); res.status(200).json({ message: 'Billing item removed' }); } catch (err: any) { res.status(400).json({ message: err.message || 'Failed to remove billing item' }); } };
}
