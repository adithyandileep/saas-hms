import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

type RevenueRow = { bucket: Date; amount: number };

export class AnalyticsRepository {
  private async revenueByBucket(unit: 'day' | 'week' | 'month' | 'year', start: Date, end: Date) {
    return prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
      SELECT date_trunc(${unit}, "paymentDate") AS bucket, COALESCE(SUM(amount), 0)::float AS amount
      FROM "Payment"
      WHERE "paymentDate" >= ${start} AND "paymentDate" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `);
  }

  getDailyRevenue(start: Date, end: Date) {
    return this.revenueByBucket('day', start, end);
  }

  getWeeklyRevenue(start: Date, end: Date) {
    return this.revenueByBucket('week', start, end);
  }

  getMonthlyRevenue(start: Date, end: Date) {
    return this.revenueByBucket('month', start, end);
  }

  getYearlyRevenue(start: Date, end: Date) {
    return this.revenueByBucket('year', start, end);
  }

  getPaymentMethodRevenue(start?: Date, end?: Date) {
    return prisma.payment.groupBy({
      by: ['paymentMode'],
      where: start && end ? { paymentDate: { gte: start, lte: end } } : undefined,
      _sum: { amount: true },
      orderBy: { paymentMode: 'asc' },
    });
  }

  getCashFlowSummary(start: Date, end: Date) {
    return prisma.payment.groupBy({
      by: ['paymentMode'],
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
    });
  }

  getDepartmentRevenue(start?: Date, end?: Date) {
    return prisma.$queryRaw<Array<{ departmentId: string; departmentName: string; revenue: number }>>(Prisma.sql`
      SELECT d.id AS "departmentId", d.name AS "departmentName", COALESCE(SUM(bi."totalPrice"), 0)::float AS revenue
      FROM "BillingItem" bi
      JOIN "Appointment" a ON a.id = bi."appointmentId"
      JOIN "DoctorProfile" dp ON dp.id = a."doctorId"
      JOIN "Department" d ON d.id = dp."departmentId"
      WHERE ${start && end ? Prisma.sql`bi."createdAt" >= ${start} AND bi."createdAt" <= ${end}` : Prisma.sql`TRUE`}
      GROUP BY d.id, d.name
      ORDER BY revenue DESC, d.name ASC
    `);
  }

  getDoctorRevenue(start?: Date, end?: Date) {
    return prisma.$queryRaw<Array<{ doctorId: string; doctorName: string; consultationRevenue: number; diagnosticRevenue: number; totalRevenue: number }>>(Prisma.sql`
      SELECT
        dp.id AS "doctorId",
        dp.name AS "doctorName",
        COALESCE(SUM(CASE WHEN bi.category = 'CONSULTATION' THEN bi."totalPrice" ELSE 0 END), 0)::float AS "consultationRevenue",
        COALESCE(SUM(CASE WHEN bi.category IN ('LAB_TEST', 'RADIOLOGY_TEST') THEN bi."totalPrice" ELSE 0 END), 0)::float AS "diagnosticRevenue",
        COALESCE(SUM(bi."totalPrice"), 0)::float AS "totalRevenue"
      FROM "BillingItem" bi
      JOIN "Appointment" a ON a.id = bi."appointmentId"
      JOIN "DoctorProfile" dp ON dp.id = a."doctorId"
      WHERE ${start && end ? Prisma.sql`bi."createdAt" >= ${start} AND bi."createdAt" <= ${end}` : Prisma.sql`TRUE`}
      GROUP BY dp.id, dp.name
      ORDER BY "totalRevenue" DESC, dp.name ASC
    `);
  }

  getPatientRevenue(start?: Date, end?: Date) {
    return prisma.$queryRaw<Array<{ patientId: string; patientName: string; totalBilled: number; totalPaid: number; outstandingBalance: number }>>(Prisma.sql`
      SELECT
        p.id AS "patientId",
        p.name AS "patientName",
        COALESCE(SUM(a."totalAmount"), 0)::float AS "totalBilled",
        COALESCE(SUM(a."paidAmount"), 0)::float AS "totalPaid",
        COALESCE(SUM(a."pendingAmount"), 0)::float AS "outstandingBalance"
      FROM "Appointment" a
      JOIN "Patient" p ON p.id = a."patientId"
      WHERE ${start && end ? Prisma.sql`a."createdAt" >= ${start} AND a."createdAt" <= ${end}` : Prisma.sql`TRUE`}
      GROUP BY p.id, p.name
      ORDER BY "totalBilled" DESC, p.name ASC
    `);
  }

  getLabRevenue(start?: Date, end?: Date) {
    return prisma.labRequest.aggregate({
      where: start && end ? { orderedAt: { gte: start, lte: end } } : undefined,
      _sum: { priceSnapshot: true },
      _count: { id: true },
    });
  }

  getRadiologyRevenue(start?: Date, end?: Date) {
    return prisma.radiologyRequest.aggregate({
      where: start && end ? { orderedAt: { gte: start, lte: end } } : undefined,
      _sum: { priceSnapshot: true },
      _count: { id: true },
    });
  }
}

