import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cerrarMenu = () => setMenuAbierto(false);

  const manejarBusqueda = (e) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`);
      setBusqueda('');
      cerrarMenu();
    }
  };

  const manejarLogout = () => {
    logout();
    cerrarMenu();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__logo" onClick={cerrarMenu}>
          <img src={logo} alt="Applefly" />
          <span className="navbar__brand">
            Apple<span className="navbar__brand-accent">fly</span>
          </span>
        </Link>

        <button
          className="navbar__toggle"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`navbar__nav ${menuAbierto ? 'navbar__nav--abierto' : ''}`}>
          <ul className="navbar__links">
            <li>
              <NavLink to="/" end onClick={cerrarMenu}>Inicio</NavLink>
            </li>
            <li>
              <NavLink to="/catalogo" onClick={cerrarMenu}>Catálogo</NavLink>
            </li>
            <li>
              <NavLink to="/nosotros" onClick={cerrarMenu}>Nosotros</NavLink>
            </li>
            <li>
              <NavLink to="/contacto" onClick={cerrarMenu}>Contacto</NavLink>
            </li>
          </ul>

          <form className="navbar__search" onSubmit={manejarBusqueda} role="search">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar teléfonos..."
              aria-label="Buscar"
            />
            <button type="submit" aria-label="Buscar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          <div className="navbar__actions">
            <Link to="/carrito" className="navbar__cart" onClick={cerrarMenu} aria-label="Carrito">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="navbar__cart-badge">{totalItems}</span>
              )}
            </Link>

            {user ? (
              <div className="navbar__user">
                <Link to="/perfil" className="navbar__user-name" onClick={cerrarMenu}>
                  Hola, {user.name}
                </Link>
                <Link to="/mis-pedidos" className="navbar__pedidos" onClick={cerrarMenu}>
                  Mis pedidos
                </Link>
                <button className="navbar__logout" onClick={manejarLogout}>
                  Salir
                </button>
              </div>
            ) : (
              <div className="navbar__auth">
                <Link to="/login" onClick={cerrarMenu} className="navbar__login">
                  Iniciar sesión
                </Link>
                <Link to="/registro" onClick={cerrarMenu} className="navbar__register">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
