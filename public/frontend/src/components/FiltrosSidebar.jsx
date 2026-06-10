import Boton from './Boton.jsx';
import './FiltrosSidebar.css';

const conditions = ['Nuevo', 'Reacondicionado'];

const FiltrosSidebar = ({ filtros, setFiltros, precioMax = 2500, categorias = [], onCerrar }) => {
  const toggleArray = (clave, valor) => {
    const actual = filtros[clave];
    const nuevo = actual.includes(valor)
      ? actual.filter((v) => v !== valor)
      : [...actual, valor];
    setFiltros({ ...filtros, [clave]: nuevo });
  };

  const limpiarFiltros = () => {
    setFiltros({
      categorias: [],
      condiciones: [],
      precioMin: 0,
      precioMax: precioMax,
    });
  };

  return (
    <aside className="filtros">
      <div className="filtros__header">
        <h3>Filtros</h3>
        <button className="filtros__cerrar" onClick={onCerrar} aria-label="Cerrar filtros">×</button>
      </div>

      {categorias.length > 0 && (
        <div className="filtros__grupo">
          <h4>Categoría</h4>
          <div className="filtros__opciones">
            {categorias.map((cat) => (
              <label key={cat} className="filtros__check">
                <input
                  type="checkbox"
                  checked={filtros.categorias.includes(cat)}
                  onChange={() => toggleArray('categorias', cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filtros__grupo">
        <h4>Condición</h4>
        <div className="filtros__opciones">
          {conditions.map((cond) => (
            <label key={cond} className="filtros__check">
              <input
                type="checkbox"
                checked={filtros.condiciones.includes(cond)}
                onChange={() => toggleArray('condiciones', cond)}
              />
              <span>{cond}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filtros__grupo">
        <h4>Precio máximo: ${filtros.precioMax}</h4>
        <input
          type="range"
          min="0"
          max={precioMax}
          step="50"
          value={filtros.precioMax}
          onChange={(e) =>
            setFiltros({ ...filtros, precioMax: Number(e.target.value) })
          }
          className="filtros__range"
        />
        <div className="filtros__rango-labels">
          <span>$0</span>
          <span>${precioMax}</span>
        </div>
      </div>

      <Boton
        texto="Limpiar filtros"
        variante="outline"
        tamano="full"
        onClick={limpiarFiltros}
      />
    </aside>
  );
};

export default FiltrosSidebar;
