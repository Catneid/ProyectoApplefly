import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { colors } from '../../theme/colors';
import { fonts, sizes } from '../../theme/typography';

const banner = require('../../../assets/banner.jpg');

export default function HeroBanner() {
  return (
    <ImageBackground source={banner} style={styles.fondo} imageStyle={styles.fondoImagen}>
      {/* La foto de fondo es clara (fondo blanco, pantalla de MacBook con
          colores vivos) — un overlay plano no la oscurecía lo suficiente
          para leer el texto blanco encima. Un degradado más oscuro arriba
          (donde cae el título, justo sobre la pantalla más colorida) y
          algo más suave hacia abajo, igual que el wash de la web pero
          resuelto con foto en vez de un solo color plano. */}
      <LinearGradient
        colors={['rgba(15,23,42,0.9)', 'rgba(15,23,42,0.78)', 'rgba(15,23,42,0.88)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.contenido}>
        <View style={styles.etiqueta}>
          <Text style={styles.etiquetaTexto}>Apple reacondicionado · Garantía 12 meses</Text>
        </View>

        <Text style={styles.titulo}>
          Premium.{'\n'}
          <Text style={styles.tituloAccent}>Reacondicionado.</Text>{'\n'}
          Como nuevo.
        </Text>

        <Text style={styles.descripcion}>
          Dispositivos Apple certificados a un precio más accesible. iPhone, iPad, MacBook, Apple
          Watch y AirPods — todos con garantía y envío a todo El Salvador.
        </Text>

        <Pressable style={styles.boton} onPress={() => router.push('/(tabs)/catalogo')}>
          <Text style={styles.botonTexto}>Ver catálogo</Text>
        </Pressable>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumero}>12 meses</Text>
            <Text style={styles.statTexto}>de garantía</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumero}>+5,000</Text>
            <Text style={styles.statTexto}>clientes felices</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumero}>98%</Text>
            <Text style={styles.statTexto}>satisfacción</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    width: '100%',
    minHeight: 420,
    justifyContent: 'center',
  },
  fondoImagen: {
    resizeMode: 'cover',
  },
  contenido: {
    padding: 24,
    gap: 14,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  etiquetaTexto: {
    fontFamily: fonts.medium,
    fontSize: sizes.xs,
    color: colors.white,
  },
  titulo: {
    fontFamily: fonts.extraBold,
    fontSize: sizes.xxl,
    lineHeight: sizes.xxl * 1.15,
    color: colors.white,
  },
  tituloAccent: {
    color: colors.primary,
  },
  descripcion: {
    fontFamily: fonts.regular,
    fontSize: sizes.sm,
    lineHeight: sizes.sm * 1.5,
    color: 'rgba(255,255,255,0.85)',
  },
  boton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 4,
  },
  botonTexto: {
    fontFamily: fonts.bold,
    fontSize: sizes.base,
    color: colors.white,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  stat: {
    gap: 2,
  },
  statNumero: {
    fontFamily: fonts.bold,
    fontSize: sizes.lg,
    color: colors.white,
  },
  statTexto: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: 'rgba(255,255,255,0.75)',
  },
});
