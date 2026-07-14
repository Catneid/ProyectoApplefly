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
    fetch("/api/loginAdmin/verify", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          setAdmin(null);
          localStorage.removeItem("adminUser");
        }
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
