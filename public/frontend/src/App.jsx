import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';

import Inicio from './screens/Inicio.jsx';
import Catalogo from './screens/Catalogo.jsx';
import DetalleProducto from './screens/DetalleProducto.jsx';
import Carrito from './screens/Carrito.jsx';
import Checkout from './screens/Checkout.jsx';
import MisPedidos from './screens/MisPedidos.jsx';
import Perfil from './screens/Perfil.jsx';
import Login from './screens/Login.jsx';
import Registro from './screens/Registro.jsx';
import VerificarCodigo from './screens/VerificarCodigo.jsx';
import RecuperarPassword from './screens/RecuperarPassword.jsx';
import Nosotros from './screens/Nosotros.jsx';
import Contacto from './screens/Contacto.jsx';
import NoEncontrado from './screens/NoEncontrado.jsx';

import './App.css';

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main className="app__main">
        <Routes>
          {/* Rutas públicas: cualquiera puede entrar */}
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/verificar-codigo" element={<VerificarCodigo />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Rutas privadas: exigen sesión de cliente iniciada.
              Comprar, ver el historial y editar el perfil son cosas que
              solo tienen sentido con una cuenta detrás. */}
          <Route path="/checkout" element={<RutaProtegida><Checkout /></RutaProtegida>} />
          <Route path="/mis-pedidos" element={<RutaProtegida><MisPedidos /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />

          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
