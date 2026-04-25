import HeroBanner from '../components/HeroBanner.jsx';
import SeccionDestacados from '../components/SeccionDestacados.jsx';
import SeccionCategorias from '../components/SeccionCategorias.jsx';
import SeccionBeneficios from '../components/SeccionBeneficios.jsx';
import SeccionTestimonios from '../components/SeccionTestimonios.jsx';
import SeccionPromos from '../components/SeccionPromos.jsx';

const Inicio = () => {
  return (
    <div className="page-enter">
      <HeroBanner />
      <SeccionCategorias />
      <SeccionDestacados />
      <SeccionPromos />
      <SeccionBeneficios />
      <SeccionTestimonios />
    </div>
  );
};

export default Inicio;
