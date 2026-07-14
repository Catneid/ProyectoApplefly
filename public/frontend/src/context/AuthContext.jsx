import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const guardado = localStorage.getItem('applflyUser');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  // Mientras revalidamos la sesión todavía no sabemos si el usuario sigue
  // dentro. Sin esta bandera, una ruta protegida lo mandaría al login por
  // un instante antes de confirmarlo, y se vería como un parpadeo.
  const [cargando, setCargando] = useState(true);

  // Lo de localStorage solo sirve para pintar el nombre de inmediato.
  // La sesión real es la cookie httpOnly, y solo el backend puede decir si
  // sigue viva: si expiró, hay que sacar al usuario aunque localStorage
  // todavía diga que estaba dentro.
  useEffect(() => {
    const revalidarSesion = async () => {
      try {
        const { user: vigente } = await api('/loginCustomers/verify');
        const datos = { id: vigente.id, name: vigente.name, email: vigente.email };
        setUser(datos);
        localStorage.setItem('applflyUser', JSON.stringify(datos));
      } catch {
        setUser(null);
        localStorage.removeItem('applflyUser');
      } finally {
        setCargando(false);
      }
    };

    revalidarSesion();
  }, []);

  const register = async ({ name, lastName, birthdate, email, password }) => {
    const datos = await api('/registerCustomers', {
      method: 'POST',
      body: JSON.stringify({ name, lastName, birthdate, email, password }),
    });
    return datos.message;
  };

  const verifyCode = async (codigo) => {
    const datos = await api('/registerCustomers/verifyCodeEmail', {
      method: 'POST',
      body: JSON.stringify({ verificationCodeRequest: codigo }),
    });
    return datos.message;
  };

  const login = async ({ email, password }) => {
    const datos = await api('/loginCustomers', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(datos.user);
    localStorage.setItem('applflyUser', JSON.stringify(datos.user));
    return datos.user;
  };

  const logout = async () => {
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      // Aunque el servidor no conteste, localmente cerramos la sesión igual
    }
    setUser(null);
    localStorage.removeItem('applflyUser');
  };

  return (
    <AuthContext.Provider value={{ user, cargando, login, register, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
