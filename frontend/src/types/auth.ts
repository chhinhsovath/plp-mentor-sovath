export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  locationScope: LocationScope;
  isActive: boolean;
  lastLogin: Date;
  officeLocation?: string;
  officeLatitude?: number;
  officeLongitude?: number;
}

export interface UserRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

export interface LocationScope {
  type: 'national' | 'zone' | 'provincial' | 'department' | 'cluster' | 'school';
  id: string;
  name: string;
  parentId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  locationScope: string;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}