import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Inicio from './screens/Inicio.jsx';
import Catalogo from './screens/Catalogo.jsx';
import DetalleProducto from './screens/DetalleProducto.jsx';
import Carrito from './screens/Carrito.jsx';
import Login from './screens/Login.jsx';
import Registro from './screens/Registro.jsx';
import Nosotros from './screens/Nosotros.jsx';
import Contacto from './screens/Contacto.jsx';
import NoEncontrado from './screens/NoEncontrado.jsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
