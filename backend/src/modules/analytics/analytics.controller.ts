import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  private service = new AnalyticsService();

  getDailyRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getDailyRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch daily revenue' }); } };
  getWeeklyRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getWeeklyRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch weekly revenue' }); } };
  getMonthlyRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getMonthlyRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch monthly revenue' }); } };
  getYearlyRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getYearlyRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch yearly revenue' }); } };
  getPaymentMethods = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getPaymentMethods() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch payment analytics' }); } };
  getDepartmentRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getDepartmentRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch department revenue' }); } };
  getDoctorRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getDoctorRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch doctor revenue' }); } };
  getPatientRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getPatientRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch patient revenue' }); } };
  getLabRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getLabRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch lab revenue' }); } };
  getRadiologyRevenue = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getRadiologyRevenue() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch radiology revenue' }); } };
  getCashFlow = async (_req: Request, res: Response) => { try { res.status(200).json({ data: await this.service.getCashFlow() }); } catch (error: any) { res.status(500).json({ message: error.message || 'Failed to fetch cash flow analytics' }); } };
}

