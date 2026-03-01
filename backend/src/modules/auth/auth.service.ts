import { AuthRepository } from './auth.repository';
import { comparePassword, hashPassword } from '../../utils/hash';
import { generateToken, JwtPayload } from '../../utils/jwt';
import { Role, User } from '@prisma/client';
import { z } from 'zod';
import { LoginDto, SetupDto } from './auth.dto';

export class AuthService {
  private repository = new AuthRepository();

  async login(data: z.infer<typeof LoginDto>) {
    const user = await this.repository.findUserByUsername(data.username);
    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }
    if (!user.isActive) {
      throw new Error('Account disabled');
    }

    const payload: JwtPayload = { userId: user.id, role: user.role };
    const token = generateToken(payload);

    const resultUser: any = { id: user.id, username: user.username, role: user.role };
    
    // Attach permissions if admin
    if (user.role === Role.ADMIN) {
      const adminProfile = (user as any).adminProfile;
      resultUser.permissions = adminProfile?.permissions ? (adminProfile.permissions as string[]) : [];
    }

    return { user: resultUser, token };
  }

  async checkSetupRequired(): Promise<boolean> {
    const superAdminExists = await this.repository.checkSuperAdminExists();
    return !superAdminExists;
  }

  async setupSystem(data: z.infer<typeof SetupDto>) {
    const isSetupRequired = await this.checkSetupRequired();
    if (!isSetupRequired) {
      throw new Error('System is already configured');
    }

    const passwordHash = await hashPassword(data.superAdminPassword);
    
    // Create the default SuperAdmin user
    const superAdmin = await this.repository.createSuperAdmin({
      username: data.superAdminUsername,
      passwordHash,
      role: Role.SUPERADMIN,
      isActive: true,
    });

    const organization = await this.repository.createOrganization({
      organizationName: data.organizationName,
      timezone: data.timezone,
      currency: data.currency
    });

    return {
      message: 'Setup completed successfully',
      superAdmin: { id: superAdmin.id, username: superAdmin.username },
      organization
    };
  }
}
