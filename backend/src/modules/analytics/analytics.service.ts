import { AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  private repository = new AnalyticsRepository();

  private buildRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  getDailyRevenue() {
    const { start, end } = this.buildRange(30);
    return this.repository.getDailyRevenue(start, end);
  }

  getWeeklyRevenue() {
    const { start, end } = this.buildRange(84);
    return this.repository.getWeeklyRevenue(start, end);
  }

  getMonthlyRevenue() {
    const { start, end } = this.buildRange(365);
    return this.repository.getMonthlyRevenue(start, end);
  }

  getYearlyRevenue() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 5);
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return this.repository.getYearlyRevenue(start, end);
  }

  getPaymentMethods() {
    return this.repository.getPaymentMethodRevenue();
  }

  getDepartmentRevenue() {
    return this.repository.getDepartmentRevenue();
  }

  getDoctorRevenue() {
    return this.repository.getDoctorRevenue();
  }

  getPatientRevenue() {
    return this.repository.getPatientRevenue();
  }

  async getLabRevenue() {
    const result = await this.repository.getLabRevenue();
    return {
      totalRevenue: result._sum.priceSnapshot ?? 0,
      totalRequests: result._count.id ?? 0,
    };
  }

  async getRadiologyRevenue() {
    const result = await this.repository.getRadiologyRevenue();
    return {
      totalRevenue: result._sum.priceSnapshot ?? 0,
      totalRequests: result._count.id ?? 0,
    };
  }

  async getCashFlow() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    const rows = await this.repository.getCashFlowSummary(start, end);
    const summary = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.paymentMode] = row._sum.amount ?? 0;
      return acc;
    }, {});

    return {
      totalCollectedToday: Object.values(summary).reduce((sum, value) => sum + value, 0),
      byMode: summary,
    };
  }
}

