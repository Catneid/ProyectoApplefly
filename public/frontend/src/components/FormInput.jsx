import './FormInput.css';

/**
 * Campo de formulario reutilizable (input / textarea).
 */
const FormInput = ({
  label,
  name,
  tipo = 'text',
  valor,
  onChange,
  placeholder,
  requerido = false,
  error = null,
  esTextarea = false,
  filas = 4,
}) => {
  return (
    <div className="form-input">
      {label && (
        <label htmlFor={name} className="form-input__label">
          {label}
          {requerido && <span className="form-input__required"> *</span>}
        </label>
      )}
      {esTextarea ? (
        <textarea
          id={name}
          name={name}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          required={requerido}
          rows={filas}
          className={`form-input__field form-input__field--textarea ${error ? 'form-input__field--error' : ''}`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={tipo}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          required={requerido}
          className={`form-input__field ${error ? 'form-input__field--error' : ''}`}
        />
      )}
      {error && <span className="form-input__error">{error}</span>}
    </div>
  );
};

export default FormInput;
