import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('applflyUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const register = async ({ name, lastName, birthdate, email, password }) => {
    try {
      const res = await fetch('/api/registerCustomers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, lastName, birthdate, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message };
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, message: 'Error de conexión con el servidor' };
    }
  };

  const verifyCode = async (code) => {
    try {
      const res = await fetch('/api/registerCustomers/verifyCodeEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationCodeRequest: code }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message };
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, message: 'Error de conexión con el servidor' };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await fetch('/api/loginCustomers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message };
      setUser(data.user);
      localStorage.setItem('applflyUser', JSON.stringify(data.user));
      return { ok: true };
    } catch {
      return { ok: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout/customer', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    localStorage.removeItem('applflyUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
