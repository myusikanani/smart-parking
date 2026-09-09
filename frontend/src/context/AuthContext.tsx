import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'security';
  vehicleNumber?: string;
  vehicles?: string[];
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  pendingTwoFactor: string | null;
  login: (email: string, password: string) => Promise<{ user?: User; requiresTwoFactor?: boolean; requiresTwoFactorSetup?: boolean; qrCodeUrl?: string; secret?: string; userId?: string }>;
  verifyTwoFactor: (userId: string, code: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string, role?: string, vehicleNumber?: string) => Promise<{ user?: User; requiresTwoFactorSetup?: boolean; qrCodeUrl?: string; secret?: string; userId?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  clearPendingTwoFactor: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  pendingTwoFactor: null,
  login: async () => ({}),
  verifyTwoFactor: async () => ({} as User),
  register: async () => ({}),
  logout: () => {},
  updateUser: () => {},
  clearPendingTwoFactor: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      setUser(res.user as unknown as User);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);

    if (res.requiresTwoFactor || res.requiresTwoFactorSetup) {
      setPendingTwoFactor(res.userId || null);
      return {
        requiresTwoFactor: res.requiresTwoFactor || false,
        requiresTwoFactorSetup: res.requiresTwoFactorSetup || false,
        userId: res.userId,
        qrCodeUrl: res.qrCodeUrl,
        secret: res.secret
      };
    }

    localStorage.setItem('token', res.token!);
    setToken(res.token!);
    setUser(res.user as unknown as User);
    return { user: res.user as unknown as User };
  };

  const verifyTwoFactor = async (userId: string, code: string) => {
    const res = await authApi.verifyTwoFactor(userId, code);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user as unknown as User);
    setPendingTwoFactor(null);
    return res.user as unknown as User;
  };

  const register = async (name: string, email: string, phone: string, password: string, role?: string, vehicleNumber?: string) => {
    const res = await authApi.register(name, email, phone, password, role, vehicleNumber);

    if (res.requiresTwoFactorSetup) {
      setPendingTwoFactor(res.userId || null);
      return { requiresTwoFactorSetup: true, qrCodeUrl: res.qrCodeUrl, secret: res.secret, userId: res.userId };
    }

    localStorage.setItem('token', res.token!);
    setToken(res.token!);
    setUser(res.user as unknown as User);
    return { user: res.user as unknown as User };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingTwoFactor(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) setUser({ ...user, ...data });
  };

  const clearPendingTwoFactor = () => setPendingTwoFactor(null);

  return (
    <AuthContext.Provider value={{ user, token, loading, pendingTwoFactor, login, verifyTwoFactor, register, logout, updateUser, clearPendingTwoFactor }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
