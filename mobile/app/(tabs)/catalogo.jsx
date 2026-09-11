import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoCargando from '../../src/components/EstadoCargando';
import EstadoError from '../../src/components/EstadoError';
import ProductCard from '../../src/components/ProductCard';
import { getCategorias, getProductos } from '../../src/services/products';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';

const CONDICIONES = ['Nuevo', 'Reacondicionado'];

const FILTROS_VACIOS = {
  categorias: [],
  condiciones: [],
  precioMin: '',
  precioMax: '',
};

function Chip({ label, seleccionado, onPress }) {
  return (
    <Pressable
      style={[styles.chip, seleccionado && styles.chipActivo]}
      onPress={onPress}
    >
      <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  );
}

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [modalVisible, setModalVisible] = useState(false);

  const cargar = async () => {
    try {
      setError(false);
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()]);
      setProductos(prods);
      setCategorias(cats);
    } catch (e) {
      console.warn('[catalogo] No se pudo cargar:', e.message);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirFiltros = () => {
    setBorrador(filtros);
    setModalVisible(true);
  };

  const toggleArray = (clave, valor) => {
    setBorrador((prev) => {
      const actual = prev[clave];
      const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor];
      return { ...prev, [clave]: nuevo };
    });
  };

  const aplicarFiltros = () => {
    setFiltros(borrador);
    setModalVisible(false);
  };

  const limpiarFiltros = () => {
    setBorrador(FILTROS_VACIOS);
    setFiltros(FILTROS_VACIOS);
  };

  const cantidadFiltrosActivos =
    filtros.categorias.length +
    filtros.condiciones.length +
    (filtros.precioMin ? 1 : 0) +
    (filtros.precioMax ? 1 : 0);

  const resultados = useMemo(() => {
    let arr = [...productos];

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q)
      );
    }

    if (filtros.categorias.length > 0) {
      arr = arr.filter((p) => filtros.categorias.includes(p.categoryName));
    }

    if (filtros.condiciones.length > 0) {
      arr = arr.filter((p) => filtros.condiciones.includes(p.condition));
    }

    const min = filtros.precioMin ? Number(filtros.precioMin) : 0;
    const max = filtros.precioMax ? Number(filtros.precioMax) : Infinity;
    arr = arr.filter((p) => (p.price ?? 0) >= min && (p.price ?? 0) <= max);

    return arr;
  }, [productos, busqueda, filtros]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EstadoCargando />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.titulo}>Catálogo</Text>

      <View style={styles.toolbar}>
        <View style={styles.busqueda}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.busquedaInput}
            placeholder="Buscar por nombre, categoría o color..."
            placeholderTextColor={colors.textDim}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <Pressable style={styles.botonFiltros} onPress={abrirFiltros}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
          <Text style={styles.botonFiltrosTexto}>Filtros</Text>
          {cantidadFiltrosActivos > 0 && (
            <View style={styles.badgeFiltros}>
              <Text style={styles.badgeFiltrosTexto}>{cantidadFiltrosActivos}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Text style={styles.resultadosMeta}>
        {resultados.length} {resultados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
      </Text>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <ProductCard
            producto={item}
            style={styles.tarjeta}
            onPress={() => router.push(`/producto/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={cargar} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          error ? (
            <EstadoError
              full={false}
              mensaje="No pudimos cargar el catálogo."
              onReintentar={cargar}
              style={styles.vacio}
            />
          ) : (
            <Text style={styles.vacio}>
              {productos.length === 0
                ? 'Todavía no hay productos cargados. Corré el script de importación (Fase 4).'
                : 'No encontramos productos con esos filtros. Probá con otros o limpiá la búsqueda.'}
            </Text>
          )
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitulo}>Filtros</Text>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContenido}>
            {categorias.length > 0 && (
              <View style={styles.grupo}>
                <Text style={styles.grupoTitulo}>Categoría</Text>
                <View style={styles.chips}>
                  {categorias.map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      seleccionado={borrador.categorias.includes(cat.name)}
                      onPress={() => toggleArray('categorias', cat.name)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.grupo}>
              <Text style={styles.grupoTitulo}>Condición</Text>
              <View style={styles.chips}>
                {CONDICIONES.map((cond) => (
                  <Chip
                    key={cond}
                    label={cond}
                    seleccionado={borrador.condiciones.includes(cond)}
                    onPress={() => toggleArray('condiciones', cond)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.grupo}>
              <Text style={styles.grupoTitulo}>Rango de precio</Text>
              <View style={styles.rangoFila}>
                <View style={styles.rangoCampo}>
                  <Text style={styles.rangoLabel}>Mínimo</Text>
                  <TextInput
                    style={styles.rangoInput}
                    placeholder="$0"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={borrador.precioMin}
                    onChangeText={(v) => setBorrador((prev) => ({ ...prev, precioMin: v.replace(/[^0-9]/g, '') }))}
                  />
                </View>
                <View style={styles.rangoCampo}>
                  <Text style={styles.rangoLabel}>Máximo</Text>
                  <TextInput
                    style={styles.rangoInput}
                    placeholder="Sin tope"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={borrador.precioMax}
                    onChangeText={(v) => setBorrador((prev) => ({ ...prev, precioMax: v.replace(/[^0-9]/g, '') }))}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.sheetAcciones}>
            <Pressable style={styles.botonLimpiar} onPress={limpiarFiltros}>
              <Text style={styles.botonLimpiarTexto}>Limpiar filtros</Text>
            </Pressable>
            <Pressable style={styles.botonAplicar} onPress={aplicarFiltros}>
              <Text style={styles.botonAplicarTexto}>Ver resultados</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  busqueda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  busquedaInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.text,
  },
  botonFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  botonFiltrosTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.primaryDark,
  },
  badgeFiltros: {
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeFiltrosTexto: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
  resultadosMeta: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.textMuted,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  lista: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  fila: {
    justifyContent: 'space-between',
  },
  tarjeta: {
    width: '48%',
    marginBottom: 16,
  },
  vacio: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.textDim,
    textAlign: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.text,
  },
  sheetContenido: {
    padding: 20,
    gap: 24,
  },
  grupo: {
    gap: 10,
  },
  grupoTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  chipActivo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipTexto: {
    fontFamily: fonts.medium,
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  chipTextoActivo: {
    color: colors.primaryDark,
    fontFamily: fonts.semiBold,
  },
  rangoFila: {
    flexDirection: 'row',
    gap: 12,
  },
  rangoCampo: {
    flex: 1,
    gap: 6,
  },
  rangoLabel: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
  rangoInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    color: colors.text,
  },
  sheetAcciones: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  botonLimpiar: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonLimpiarTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  botonAplicar: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonAplicarTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.sm,
    color: colors.white,
  },
});
