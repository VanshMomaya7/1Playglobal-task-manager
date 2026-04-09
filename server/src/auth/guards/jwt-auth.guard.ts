import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * When AUTH_BYPASS=true and AUTH_BYPASS_USER_ID is set, skips JWT and attaches a fixed user.
 * For intern/testing only — do not enable on a public production API without understanding the risk.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.AUTH_BYPASS === 'true') {
      const userId = process.env.AUTH_BYPASS_USER_ID?.trim();
      if (!userId) {
        throw new UnauthorizedException(
          'AUTH_BYPASS is enabled: set AUTH_BYPASS_USER_ID to a real User.id from the database',
        );
      }
      const email = process.env.AUTH_BYPASS_EMAIL?.trim() || 'test@local';
      const req = context.switchToHttp().getRequest();
      req.user = { id: userId, email };
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
