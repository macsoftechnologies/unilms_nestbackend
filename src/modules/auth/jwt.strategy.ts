import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  tenantId?: string;
  tenantCode?: string;
  role: string;
  name?: string;
  email?: string;
  studentId?: string;
  staffId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('FATAL: JWT_SECRET must be configured in production environment.');
        }
        return secret || 'unilms-super-secret-jwt-key-2026-production';
      })(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload: missing subject identifier.');
    }
    return {
      id: payload.sub,
      userId: payload.sub,
      tenantId: payload.tenantId,
      tenantCode: payload.tenantCode,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      studentId: payload.studentId,
      staffId: payload.staffId,
    };
  }
}

