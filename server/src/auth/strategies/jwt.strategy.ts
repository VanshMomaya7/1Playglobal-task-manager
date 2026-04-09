import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Cookie works when same-site / permissive browsers; Chrome may block cross-site
      // cookies (Vercel → Render). Authorization: Bearer is the reliable fallback.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => request?.cookies?.jwt ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback-test-secret',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
