import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

import DateField from '../../src/components/DateField';
import EstadoError from '../../src/components/EstadoError';
import PrimaryButton from '../../src/components/PrimaryButton';
import RutaProtegida from '../../src/components/RutaProtegida';
import TextField from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { db } from '../../src/services/firebase';
import { mapearPerfil } from '../../src/services/adaptadores';
import { apiFetch } from '../../src/services/api';
import { sincronizarPerfilEnMongo } from '../../src/services/perfilSync';
import { subirFotoPerfil } from '../../src/services/profileApi';
import { colors } from '../../src/theme/colors';
import { fonts, sizes } from '../../src/theme/typography';
import { LONGITUD_MAX, validarDatosPersonales } from '../../src/utils/validaciones';

// Vive dentro de RutaProtegida, así que acá adentro siempre hay user.
function PerfilContenido() {
  const { user, logout } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [form, setForm] = useState({ name: '', lastName: '', phone: '', address: '', photoURL: null });
  const [birthdate, setBirthdate] = useState(null);
  const [errores, setErrores] = useState({});

  // Mensaje si no se pudo cargar el perfil (sin red, correo sin verificar...)
  const [errorCarga, setErrorCarga] = useState('');

  const aplicarPerfil = (perfil) => {
    setForm({
      name: perfil.name,
      lastName: perfil.lastName,
      phone: perfil.phone,
      address: perfil.address,
      photoURL: perfil.photoURL,
    });
    setBirthdate(perfil.birthdate);
  };

  // El perfil sale de la API (GET /api/profile, con el token de Firebase):
  // MongoDB es la fuente de verdad. Firestore ya no se lee acá.
  const cargarPerfil = async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      let datos = await apiFetch('/profile', { auth: true });

      // Cliente recién creado desde Firebase, con el perfil todavía vacío: los
      // datos del registro están en Firestore y perfilSync los copia a Mongo.
      // Se espera esa copia una vez antes de mostrar el formulario vacío.
      if (mapearPerfil(datos).sinCompletar && (await sincronizarPerfilEnMongo(user))) {
        datos = await apiFetch('/profile', { auth: true });
      }

      aplicarPerfil(mapearPerfil(datos));
    } catch (e) {
      console.warn('[perfil] No se pudo cargar el perfil:', e.message);
      setErrorCarga(e.message || 'No pudimos cargar tu perfil.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [user]);

  const actualizar = (campo) => (valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    // El error de un campo se quita en cuanto la persona lo vuelve a editar
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const cambiarFecha = (fecha) => {
    setBirthdate(fecha);
    setErrores((prev) => ({ ...prev, birthdate: undefined }));
  };

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Falta el permiso', 'Necesitamos acceso a tus fotos para cambiar tu foto de perfil.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const uri = resultado.assets[0].uri;
    setSubiendoFoto(true);
    try {
      const idToken = await user.getIdToken();
      // El backend sube la imagen a Cloudinary y guarda la URL en el cliente
      // de Mongo (la misma que devuelve GET /api/profile)
      const secureUrl = await subirFotoPerfil({ idToken, uri });
      setForm((prev) => ({ ...prev, photoURL: secureUrl }));

      // Copia en Firestore (users/{uid}.photoURL). Si falla no pasa nada: la
      // foto ya quedó guardada en el servidor.
      try {
        await setDoc(doc(db, 'users', user.uid), { photoURL: secureUrl }, { merge: true });
      } catch (e) {
        console.warn('[perfil] No se pudo copiar la foto a Firestore:', e.message);
      }
    } catch (e) {
      Alert.alert('No se pudo cambiar la foto', e.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarCambios = async () => {
    // Mismas reglas que en el registro: nada se guarda si algo no sirve
    // (antes se podía guardar el nombre vacío).
    const nuevos = validarDatosPersonales({ ...form, birthdate });
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      // Se espera la respuesta de la API: si el servidor rechaza algo (400 de
      // validación) se muestra su mensaje y NO se avisa de que se guardó.
      const { customer } = await apiFetch('/profile', {
        method: 'PUT',
        auth: true,
        body: {
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          birthdate,
        },
      });

      // Lo que quedó guardado manda: se muestra lo que devolvió el servidor
      aplicarPerfil(mapearPerfil(customer));

      // Espejo del nombre en Firestore, solo después de que la API respondió
      // bien. Si falla, no se hace nada.
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { name: customer.name, lastName: customer.lastName },
          { merge: true }
        );
      } catch (e) {
        console.warn('[perfil] No se pudo copiar el nombre a Firestore:', e.message);
      }

      Alert.alert('Listo', 'Tu perfil se actualizó.');
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  };

  // La contraseña se cambia con el mismo flujo de la web: código por correo
  // (API /api/recoveryPassword). Esa pantalla cambia la de la web y la de Firebase.
  const cambiarPassword = () => router.push('/recuperar-password');

  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (errorCarga) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EstadoError mensaje={errorCarga} onReintentar={cargarPerfil} />
        <Pressable style={styles.errorSalir} onPress={logout}>
          <Text style={styles.errorSalirTexto}>Cerrar sesión</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Perfil</Text>

      <View style={styles.avatarContenedor}>
        <Pressable style={styles.avatar} onPress={elegirFoto} disabled={subiendoFoto}>
          {form.photoURL ? (
            <Image source={{ uri: form.photoURL }} style={styles.avatarImagen} />
          ) : (
            <Ionicons name="person" size={36} color={colors.primary} />
          )}

          {subiendoFoto && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}

          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        </Pressable>

        <View style={styles.emailBloque}>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>
          {!user?.emailVerified && <Text style={styles.sinVerificar}>Correo sin verificar</Text>}
        </View>
      </View>

      <View style={styles.fila2}>
        <View style={styles.mitad}>
          <TextField
            label="Nombre"
            value={form.name}
            onChangeText={actualizar('name')}
            maxLength={LONGITUD_MAX.nombre}
            error={errores.name}
          />
        </View>
        <View style={styles.mitad}>
          <TextField
            label="Apellido"
            value={form.lastName}
            onChangeText={actualizar('lastName')}
            maxLength={LONGITUD_MAX.nombre}
            error={errores.lastName}
          />
        </View>
      </View>

      <DateField
        label="Fecha de nacimiento"
        value={birthdate}
        onChange={cambiarFecha}
        error={errores.birthdate}
      />

      <TextField
        label="Teléfono"
        placeholder="7777-7777"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={actualizar('phone')}
        maxLength={9}
        error={errores.phone}
      />

      <TextField
        label="Dirección"
        value={form.address}
        onChangeText={actualizar('address')}
        maxLength={LONGITUD_MAX.direccion}
        error={errores.address}
      />

      <PrimaryButton
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardarCambios}
        loading={guardando}
        style={styles.botonGuardar}
      />

      <Pressable style={styles.botonSecundario} onPress={cambiarPassword}>
        <Ionicons name="key-outline" size={18} color={colors.text} />
        <Text style={styles.botonSecundarioTexto}>Cambiar contraseña</Text>
      </Pressable>

      <Text style={styles.masTitulo}>Más</Text>

      <Pressable style={styles.botonSecundario} onPress={() => router.push('/nosotros')}>
        <Ionicons name="information-circle-outline" size={18} color={colors.text} />
        <Text style={styles.botonSecundarioTexto}>Nosotros</Text>
      </Pressable>

      <Pressable style={styles.botonSecundario} onPress={() => router.push('/contacto')}>
        <Ionicons name="mail-outline" size={18} color={colors.text} />
        <Text style={styles.botonSecundarioTexto}>Contáctanos</Text>
      </Pressable>

        <Pressable style={[styles.botonSecundario, styles.botonSalir]} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.botonSecundarioTexto, styles.botonSalirTexto]}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Perfil() {
  return (
    <RutaProtegida>
      <PerfilContenido />
    </RutaProtegida>
  );
}

const styles = StyleSheet.create({
  errorSalir: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  errorSalirTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.danger,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: colors.bg,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: sizes.xl,
    color: colors.text,
    marginBottom: 20,
  },
  avatarContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImagen: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBloque: {
    flex: 1,
    gap: 2,
  },
  email: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.base,
    color: colors.text,
  },
  sinVerificar: {
    fontFamily: fonts.regular,
    fontSize: sizes.xs,
    color: colors.warning,
  },
  fila2: {
    flexDirection: 'row',
    gap: 12,
  },
  mitad: {
    flex: 1,
  },
  botonGuardar: {
    marginTop: 8,
    marginBottom: 20,
  },
  masTitulo: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 12,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    marginBottom: 12,
  },
  botonSalir: {
    marginTop: 8,
  },
  botonSecundarioTexto: {
    fontFamily: fonts.semiBold,
    fontSize: sizes.sm,
    color: colors.text,
  },
  botonSalirTexto: {
    color: colors.danger,
  },
});
