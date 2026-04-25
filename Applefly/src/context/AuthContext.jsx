import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = ({ email, password }) => {

    if (!email || !password || password.length < 6) {
      return { ok: false, message: 'Credenciales inválidas (mínimo 6 caracteres en la contraseña).' };
    }
    setUser({
      name: email.split('@')[0],
      email,
    });
    return { ok: true };
  };

  const register = ({ name, email, password }) => {
    if (!name || !email || !password || password.length < 6) {
      return { ok: false, message: 'Todos los campos son requeridos. Contraseña mínima 6 caracteres.' };
    }
    setUser({ name, email });
    return { ok: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
