import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    setAdmin(userData);
    localStorage.setItem("adminUser", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch("/api/logout/admin", { method: "POST", credentials: "include" });
    } catch {}
    setAdmin(null);
    localStorage.removeItem("adminUser");
  };

  useEffect(() => {
    if (!admin) return;
    // El servidor lee al empleado en la base: la sesión deja de valer si lo
    // borraron, y el rol que devuelve es el ACTUAL (el guardado en el navegador
    // puede ser el de cuando inició sesión). Un fallo de red o un 500 no cierra
    // la sesión, solo un 401/403.
    fetch("/api/loginAdmin/verify", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setAdmin(null);
          localStorage.removeItem("adminUser");
          return;
        }
        if (!r.ok) return;

        const data = await r.json();
        setAdmin(data.user);
        localStorage.setItem("adminUser", JSON.stringify(data.user));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider");
  return ctx;
};
