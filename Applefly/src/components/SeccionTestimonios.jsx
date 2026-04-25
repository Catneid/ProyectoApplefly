import { testimonials } from '../data/testimonials.js';
import './SeccionTestimonios.css';

const SeccionTestimonios = () => {
  return (
    <section className="testimonios">
      <div className="container">
        <h2 className="testimonios__titulo">Lo que dicen nuestros clientes</h2>
        <div className="testimonios__grid">
          {testimonials.map((t) => (
            <article key={t.id} className="testimonio">
              <div className="testimonio__estrellas">
                {'★'.repeat(t.rating)}
                {'☆'.repeat(5 - t.rating)}
              </div>
              <p className="testimonio__texto">"{t.text}"</p>
              <div className="testimonio__autor">
                <div className="testimonio__avatar">{t.avatar}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeccionTestimonios;
