import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, SetupDto } from './auth.dto';

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = LoginDto.parse(req.body);
      const result = await this.service.login(data);
      // Return token in body — frontend stores it in localStorage and sends as Bearer header
      res.status(200).json({ message: 'Login successful', user: result.user, token: result.token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Login failed' });
    }
  };

  logout = (_req: Request, res: Response): void => {
    // Token is stored client-side; logout is handled by the frontend clearing it
    res.status(200).json({ message: 'Logged out successfully' });
  };

  checkSetup = async (req: Request, res: Response): Promise<void> => {
    try {
      const isRequired = await this.service.checkSetupRequired();
      res.status(200).json({ setupRequired: isRequired });
    } catch (error: any) {
      res.status(500).json({ message: 'Error checking setup status', error: error });
    }
  };

  setup = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = SetupDto.parse(req.body);
      const result = await this.service.setupSystem(data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Setup failed' });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
       res.status(401).json({ message: 'Not authenticated' });
       return;
    }
    res.status(200).json({ user: req.user });
  };
}
