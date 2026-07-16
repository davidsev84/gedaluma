import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('gedaluma_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('username', username)
        .eq('password', pass)
        .single();
        
      if (error || !data) {
        return { success: false, error: 'Usuario o contraseña incorrectos.' };
      }
      
      const loggedUser: User = {
        id: data.id,
        name: data.name,
        role: data.role as 'admin' | 'evaluator' | 'ghost',
        pin: data.password // keeping the interface happy, or we can update User type
      };
      
      setUser(loggedUser);
      localStorage.setItem('gedaluma_user', JSON.stringify(loggedUser));
      return { success: true };
      
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Error de conexión con el servidor.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gedaluma_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
