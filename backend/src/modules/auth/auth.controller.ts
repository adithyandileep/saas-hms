import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, SetupDto } from './auth.dto';

// For cross-origin deployments (e.g. Vercel frontend + Railway backend),
// cookies MUST be sameSite:'none' and secure:true regardless of NODE_ENV.
// Use env vars to override; defaults are safe for cross-origin HTTPS production.
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'none') as 'strict' | 'lax' | 'none';
const cookieSecure = process.env.COOKIE_SECURE !== 'false'; // default true; set COOKIE_SECURE=false only for local dev
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  domain: cookieDomain,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
});

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = LoginDto.parse(req.body);
      const result = await this.service.login(data);

      res.cookie('token', result.token, buildCookieOptions());

      res.status(200).json({ message: 'Login successful', user: result.user });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Login failed' });
    }
  };

  logout = (req: Request, res: Response): void => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain,
      path: '/',
    });
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
