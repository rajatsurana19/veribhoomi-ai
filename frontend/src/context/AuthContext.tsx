import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('veribhoomi_token'));
  const [role, setRole] = useState<UserRole | null>((localStorage.getItem('veribhoomi_role') as UserRole) || null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('veribhoomi_token');
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          setRole(userData.role);
          localStorage.setItem('veribhoomi_role', userData.role);
        } catch (err) {
          localStorage.removeItem('veribhoomi_token');
          localStorage.removeItem('veribhoomi_role');
          setUser(null);
          setToken(null);
          setRole(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authApi.login(email, pass);
    localStorage.setItem('veribhoomi_token', data.access_token);
    localStorage.setItem('veribhoomi_role', data.role);
    setToken(data.access_token);
    setRole(data.role as UserRole);
    setUser({
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role as UserRole
    });
  };

  const logout = () => {
    localStorage.removeItem('veribhoomi_token');
    localStorage.removeItem('veribhoomi_role');
    setUser(null);
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
