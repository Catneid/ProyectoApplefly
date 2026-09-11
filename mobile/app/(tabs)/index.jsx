import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoCargando from '../../src/components/EstadoCargando';
import HeroBanner from '../../src/components/home/HeroBanner';
import SeccionCategorias from '../../src/components/home/SeccionCategorias';
import SeccionDestacados from '../../src/components/home/SeccionDestacados';
import SeccionBeneficios from '../../src/components/home/SeccionBeneficios';
import SeccionTestimonios from '../../src/components/home/SeccionTestimonios';
import { getCategorias, getProductos } from '../../src/services/products';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

export default function Home() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = async () => {
    try {
      setError(false);
      const [cats, prods] = await Promise.all([getCategorias(), getProductos()]);
      setCategorias(cats);
      setProductos(prods);
    } catch (e) {
      console.warn('[home] No se pudo cargar el catálogo:', e.message);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EstadoCargando />
      </SafeAreaView>
    );
  }

  const destacados = productos.filter((p) => p.featured);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={cargar} tintColor={colors.primary} />
        }
      >
        <HeroBanner />

        {error && (
          <Text style={styles.errorTexto}>
            No pudimos cargar el catálogo. Revisá tu conexión y deslizá hacia abajo para reintentar.
          </Text>
        )}

        <SeccionCategorias categorias={categorias} />
        <SeccionDestacados productos={destacados} />
        <SeccionBeneficios />
        <SeccionTestimonios />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contenido: {
    paddingBottom: 32,
  },
  errorTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.danger,
    textAlign: 'center',
    padding: 20,
  },
});
