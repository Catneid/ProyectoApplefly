import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import logo from "../../assets/logo.png";
import toast from "react-hot-toast";
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const { login, admin } = useAdminAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  if (admin) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/loginAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Error al iniciar sesión");
        return;
      }

      login(result.user);
      toast.success("Bienvenido, " + result.user.name);
      navigate("/dashboard");
    } catch {
      toast.error("Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-admin">
      <div className="login-admin__card">
        <div className="login-admin__brand">
          <img src={logo} alt="Applefly" className="login-admin__logo" />
          <h1>Applefly Admin</h1>
          <p>Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="admin@applefly.com"
              {...register("email", {
                required: "El correo es requerido",
                pattern: { value: /^\S+@\S+$/i, message: "Correo inválido" },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className={`form-input ${errors.password ? "error" : ""}`}
              placeholder="••••••••"
              {...register("password", {
                required: "La contraseña es requerida",
                minLength: { value: 6, message: "Mínimo 6 caracteres" },
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn--primary login-admin__submit" disabled={isSubmitting}>
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;
