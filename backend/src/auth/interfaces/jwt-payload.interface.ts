import { UserRole } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string; // User ID
  username: string;
  role: UserRole;
  locationScope?: string;
  iat?: number;
  exp?: number;
}
