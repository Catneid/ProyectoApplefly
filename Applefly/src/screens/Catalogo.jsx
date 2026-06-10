import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { phones } from '../data/phones.js';
import TelefonoCard from '../components/TelefonoCard.jsx';
import FiltrosSidebar from '../components/FiltrosSidebar.jsx';
import Boton from '../components/Boton.jsx';
import './Catalogo.css';

const PRECIO_MAX = 2500;

const Catalogo = () => {
  const [searchParams] = useSearchParams();
  const categoriaInicial = searchParams.get('categoria');
  const busquedaInicial = searchParams.get('q') || '';

  const [filtros, setFiltros] = useState({
    categorias: categoriaInicial ? [categoriaInicial] : [],
    condiciones: [],
    precioMin: 0,
    precioMax: PRECIO_MAX,
  });
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [orden, setOrden] = useState('destacado');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Sincronizar cuando cambia la URL (?categoria= o ?q=)
  useEffect(() => {
    if (categoriaInicial) {
      setFiltros((f) => ({ ...f, categorias: [categoriaInicial] }));
    }
    setBusqueda(busquedaInicial);
  }, [categoriaInicial, busquedaInicial]);

  const resultados = useMemo(() => {
    let arr = [...phones];

    // Búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q)
      );
    }

    // Filtro por categoría
    if (filtros.categorias.length > 0) {
      arr = arr.filter((p) => filtros.categorias.includes(p.category));
    }

    // Filtro por condición
    if (filtros.condiciones.length > 0) {
      arr = arr.filter((p) => filtros.condiciones.includes(p.condition));
    }

    // Filtro por precio
    arr = arr.filter(
      (p) => p.price >= filtros.precioMin && p.price <= filtros.precioMax
    );

    // Ordenamiento
    switch (orden) {
      case 'precio-asc':
        arr.sort((a, b) => a.price - b.price);
        break;
      case 'precio-desc':
        arr.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        arr.sort((a, b) => b.rating - a.rating);
        break;
      case 'nombre':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return arr;
  }, [busqueda, filtros, orden]);

  return (
    <div className="catalogo page-enter">
      <div className="catalogo__header">
        <div className="container">
          <h1>Catálogo Apple</h1>
          <p>Explora nuestra selección de dispositivos Apple reacondicionados certificados</p>
        </div>
      </div>

      <div className="container catalogo__contenido">
        {filtrosAbiertos && (
          <div className="catalogo__overlay" onClick={() => setFiltrosAbiertos(false)} />
        )}
        <div className={`catalogo__sidebar ${filtrosAbiertos ? 'catalogo__sidebar--abierto' : ''}`}>
          <FiltrosSidebar
            filtros={filtros}
            setFiltros={setFiltros}
            precioMax={PRECIO_MAX}
            onCerrar={() => setFiltrosAbiertos(false)}
          />
        </div>

        <div className="catalogo__principal">
          <div className="catalogo__toolbar">
            <div className="catalogo__busqueda">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, categoría o color..."
              />
            </div>

            <div className="catalogo__orden">
              <label>Ordenar:</label>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="destacado">Destacados</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="nombre">Nombre (A-Z)</option>
              </select>
            </div>

            <Boton
              texto="Filtros"
              variante="outline"
              tamano="sm"
              onClick={() => setFiltrosAbiertos(true)}
              className="catalogo__btn-filtros"
            />
          </div>

          <div className="catalogo__resultados-meta">
            {resultados.length} {resultados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </div>

          {resultados.length === 0 ? (
            <div className="catalogo__vacio">
              <h3>No encontramos productos con esos filtros</h3>
              <p>Prueba con otros filtros o limpia la búsqueda.</p>
            </div>
          ) : (
            <div className="catalogo__grid">
              {resultados.map((telefono) => (
                <TelefonoCard key={telefono.id} telefono={telefono} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
