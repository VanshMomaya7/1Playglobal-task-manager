import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

function envString(config: ConfigService, key: string): string {
  const raw = config.get<string>(key);
  if (raw == null) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const clientID = envString(configService, 'GOOGLE_CLIENT_ID');
    const clientSecret = envString(configService, 'GOOGLE_CLIENT_SECRET');
    if (!clientID || !clientSecret) {
      throw new Error(
        'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Ensure server/.env exists and ConfigModule loads it (restart the API from the server folder or use the updated envFilePath).',
      );
    }
    super({
      clientID,
      clientSecret,
      callbackURL:
        envString(configService, 'GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;
    const avatarUrl = photos[0]?.value;

    let user = await this.prisma.user.findUnique({ where: { providerId: id } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          avatarUrl,
          provider: 'google',
          providerId: id,
        },
      });
    }

    done(null, user);
  }
}
