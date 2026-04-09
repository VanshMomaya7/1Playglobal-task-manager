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
    try {
      // Extract authenticated user mapping from GoogleStrategy
      const user = req.user;
      if (!user?.id || !user?.email) {
        console.error('OAuth callback missing user payload:', user);
        return res.status(500).json({ message: 'OAuth user payload missing' });
      }

      // Generate secure JWT token
      const token = this.jwtService.sign({ sub: user.id, email: user.email });

      // Send HTTP-Only Cookie to intrinsically secure against XSS
      res.cookie('jwt', token, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // For Vercel (frontend) + Render/Railway/etc (API) on different domains,
        // cross-site requests require SameSite=None + Secure in production.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Fragment bootstrap: Chrome often blocks cross-site cookies to the API origin;
      // Edge may allow them. Client reads #session= once → sessionStorage + Bearer header.
      const target = `${this.frontendUrl()}/dashboard#session=${encodeURIComponent(token)}`;
      console.log('OAuth success, redirecting to dashboard (with fragment bootstrap)');
      return res.redirect(target);
    } catch (err) {
      console.error('OAuth callback failed:', err);
      return res.status(500).json({ message: 'OAuth callback failed' });
    }
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
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Successfully logged out' });
  }
}
