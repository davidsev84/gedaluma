import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

export interface SystemUserConfig {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'evaluator' | 'ghost';
}

export const INITIAL_SYSTEM_USERS: SystemUserConfig[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Fernando Brito',
    username: 'fbrito',
    email: 'fbritonetica@gmail.com',
    password: 'FB2547',
    role: 'admin'
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Marcia Quintana',
    username: 'mquintana',
    email: 'azabachemarcia@hotmail.com',
    password: 'MQ5478',
    role: 'admin'
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Supervisor Richard',
    username: 'richard',
    email: 'richard@gedaluma.com',
    password: '5678',
    role: 'evaluator'
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    name: 'Cliente Fantasma',
    username: 'ghost',
    email: 'ghost@gedaluma.com',
    password: '0000',
    role: 'ghost'
  }
];

interface AuthContextType {
  user: User | null;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; resetUrl?: string }>;
  resetPassword: (email: string, token: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('gedaluma_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user session:', e);
      }
    }
  }, []);

  const getCustomPasswords = (): Record<string, string> => {
    try {
      const saved = localStorage.getItem('gedaluma_custom_passwords');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveCustomPassword = (email: string, newPass: string) => {
    const current = getCustomPasswords();
    current[email.toLowerCase().trim()] = newPass;
    localStorage.setItem('gedaluma_custom_passwords', JSON.stringify(current));
  };

  const login = async (identifier: string, pass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Try querying Supabase system_users
    try {
      // First attempt searching by username or email
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
        .eq('password', cleanPass);

      if (!error && data && data.length > 0) {
        const row = data[0];
        const loggedUser: User = {
          id: row.id,
          name: row.name,
          role: row.role as 'admin' | 'evaluator' | 'ghost',
          pin: row.password,
          username: row.username,
          email: row.email
        };
        setUser(loggedUser);
        localStorage.setItem('gedaluma_user', JSON.stringify(loggedUser));
        return { success: true };
      }

      // If email column wasn't queried or error, try username fallback
      const { data: userByUsername } = await supabase
        .from('system_users')
        .select('*')
        .ilike('username', cleanId)
        .eq('password', cleanPass);

      if (userByUsername && userByUsername.length > 0) {
        const row = userByUsername[0];
        const loggedUser: User = {
          id: row.id,
          name: row.name,
          role: row.role as 'admin' | 'evaluator' | 'ghost',
          pin: row.password,
          username: row.username,
          email: row.email
        };
        setUser(loggedUser);
        localStorage.setItem('gedaluma_user', JSON.stringify(loggedUser));
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase query error or offline, checking local configuration:', err);
    }

    // 2. Check local configured users with custom password override
    const customPassMap = getCustomPasswords();
    const localMatch = INITIAL_SYSTEM_USERS.find(u => {
      const usernameMatch = u.username.toLowerCase() === cleanId;
      const emailMatch = u.email.toLowerCase() === cleanId;
      const currentPassword = customPassMap[u.email.toLowerCase()] || u.password;
      return (usernameMatch || emailMatch) && currentPassword === cleanPass;
    });

    if (localMatch) {
      const loggedUser: User = {
        id: localMatch.id,
        name: localMatch.name,
        role: localMatch.role,
        pin: cleanPass,
        username: localMatch.username,
        email: localMatch.email
      };
      setUser(loggedUser);
      localStorage.setItem('gedaluma_user', JSON.stringify(loggedUser));

      // Attempt to sync to Supabase in the background
      try {
        await supabase.from('system_users').upsert({
          id: localMatch.id,
          username: localMatch.username,
          email: localMatch.email,
          name: localMatch.name,
          password: cleanPass,
          role: localMatch.role
        });
      } catch (e) {
        // silent fallback if offline
      }

      return { success: true };
    }

    return { success: false, error: 'Usuario, correo o contraseña incorrectos.' };
  };

  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user exists in local list or Supabase
    const userFound = INITIAL_SYSTEM_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    
    // Also check Supabase
    let existsInDb = false;
    try {
      const { data } = await supabase
        .from('system_users')
        .select('id, email, name')
        .or(`email.ilike.${cleanEmail},username.ilike.${cleanEmail}`);
      if (data && data.length > 0) {
        existsInDb = true;
      }
    } catch (e) {}

    if (!userFound && !existsInDb) {
      return { 
        success: false, 
        error: `El correo "${email}" no se encuentra registrado en el sistema GEDALUMA.` 
      };
    }

    // Generate token valid for 1 hour
    const tokenPayload = {
      email: cleanEmail,
      expiresAt: Date.now() + 3600000,
      salt: Math.random().toString(36).substring(2)
    };
    const token = btoa(JSON.stringify(tokenPayload));
    
    // Save to local storage for verification
    localStorage.setItem(`gedaluma_reset_${cleanEmail}`, JSON.stringify(tokenPayload));

    // Construct reset link
    const resetUrl = `${window.location.origin}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    // Attempt Supabase Auth reset if configured
    try {
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: resetUrl
      });
    } catch (e) {
      // Ignored if custom smtp is not configured on Supabase
    }

    return {
      success: true,
      resetUrl
    };
  };

  const resetPassword = async (email: string, token: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Verify token
    try {
      if (token) {
        try {
          const decoded = JSON.parse(atob(token));
          if (decoded.email && decoded.email !== cleanEmail) {
            return { success: false, error: 'El token de recuperación no coincide con el correo especificado.' };
          }
        } catch {
          // Ignore parse errors if raw token format differs
        }
      }
      const raw = localStorage.getItem(`gedaluma_reset_${cleanEmail}`);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.expiresAt && stored.expiresAt < Date.now()) {
          return { success: false, error: 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo.' };
        }
      }
    } catch (e) {
      console.warn('Token validation warning:', e);
    }

    // Save custom password locally
    saveCustomPassword(cleanEmail, newPass);
    localStorage.removeItem(`gedaluma_reset_${cleanEmail}`);

    // Update in Supabase system_users
    try {
      await supabase
        .from('system_users')
        .update({ password: newPass })
        .or(`email.ilike.${cleanEmail},username.ilike.${cleanEmail}`);
    } catch (e) {
      console.warn('Could not update Supabase system_users password:', e);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gedaluma_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, requestPasswordReset, resetPassword }}>
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
