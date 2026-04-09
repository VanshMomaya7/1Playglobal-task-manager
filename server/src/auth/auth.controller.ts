import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  private frontendUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow natively
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // Extract authenticated user mapping from GoogleStrategy
    const user = req.user;
    
    // Generate secure JWT token
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    // Send HTTP-Only Cookie to intrinsically secure against XSS
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // For Vercel (frontend) + Render/Railway/etc (API) on different domains,
      // cross-site requests require SameSite=None + Secure in production.
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send the user to the React front-end application Dashboard
    res.redirect(`${this.frontendUrl()}/dashboard`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    // Decode user mapping out of cookie to populate global context via API
    return req.user;
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Successfully logged out' });
  }
}
