import { prisma } from '../../config/prisma';
import { Prisma, Role } from '@prisma/client';

export class AdminRepository {
  async getAllAdmins() {
    return prisma.user.findMany({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        isActive: true,
        createdAt: true,
        adminProfile: true, // we want to see their profile & permissions
      }
    });
  }

  async getAdminById(id: string) {
    return prisma.user.findUnique({
      where: { id, role: Role.ADMIN },
      include: { adminProfile: true },
    });
  }

  async createAdmin(userData: Prisma.UserCreateInput, profileData: Prisma.AdminProfileCreateWithoutUserInput) {
    return prisma.user.create({
      data: {
        ...userData,
        adminProfile: {
          create: profileData
        }
      },
      include: { adminProfile: true }
    });
  }

  async updateAdmin(id: string,  data: { isActive?: boolean; name?: string; phone?: string; permissions?: any }) {
    return prisma.$transaction(async (tx) => {
      const { isActive, name, phone, permissions } = data;
      
      let userUpdateArgs: any = {};
      if (isActive !== undefined) userUpdateArgs.isActive = isActive;

      if (Object.keys(userUpdateArgs).length > 0) {
        await tx.user.update({
          where: { id },
          data: userUpdateArgs
        });
      }

      let profileUpdateArgs: any = {};
      if (name !== undefined) profileUpdateArgs.name = name;
      if (phone !== undefined) profileUpdateArgs.phone = phone;
      if (permissions !== undefined) profileUpdateArgs.permissions = permissions;

      if (Object.keys(profileUpdateArgs).length > 0) {
        await tx.adminProfile.update({
          where: { userId: id },
          data: profileUpdateArgs
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { adminProfile: true }
      });
    });
  }

  async deleteAdmin(id: string) {
    // Delete profile first, then user
    await prisma.adminProfile.delete({ where: { userId: id } });
    return prisma.user.delete({ where: { id } });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalDoctors,
      totalPatients,
      todayAppointments,
      recentDoctors,
      recentPatients,
      recentPayments
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.DOCTOR, isActive: true } }),
      prisma.user.count({ where: { role: Role.PATIENT } }),
      prisma.appointment.count({
        where: {
          // Appointments from today onwards (simple filter, assuming 'date' is string ISO or DateTime)
          createdAt: { gte: today } 
        }
      }),
      prisma.user.findMany({
        where: { role: Role.DOCTOR },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { 
          doctorProfile: {
            include: { department: true }
          }
        }
      }),
      prisma.user.findMany({
        where: { role: Role.PATIENT },
        orderBy: { createdAt: 'desc' },
        take: 5
        // Note: Patient profile data is stored directly on User or in external relational tables if added, but no explicit `patientProfile` exists in this schema.
      }),
      // Get recent payments to calculate revenue
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { paymentDate: 'desc' },
        take: 100, // Fetch last 100 to aggregate
        select: { amount: true, paymentDate: true }
      })
    ]);

    // Format revenue data (grouping by actual date string)
    const formattedRevenue = recentPayments.reduce((acc: Record<string, number>, curr) => {
      const dateStr = curr.paymentDate.toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + curr.amount;
      return acc;
    }, {});

    const mappedRevenue = Object.entries(formattedRevenue)
      .map(([date, amount]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: amount
      }))
      .reverse() // chronological order
      .slice(0, 7); // Last 7 days

    return {
      counts: {
        doctors: totalDoctors,
        patients: totalPatients,
        appointmentsToday: todayAppointments
      },
      recentDoctors,
      recentPatients,
      revenueChart: mappedRevenue.length > 0 ? mappedRevenue : [
        { name: 'Mon', revenue: 0 },
        { name: 'Tue', revenue: 0 },
        { name: 'Wed', revenue: 0 },
        { name: 'Thu', revenue: 0 },
        { name: 'Fri', revenue: 0 }
      ]
    };
  }
}
