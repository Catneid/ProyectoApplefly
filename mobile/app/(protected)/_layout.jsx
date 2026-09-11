import { Slot } from 'expo-router';

import RutaProtegida from '../../src/components/RutaProtegida';

// Grupo para las pantallas que exigen sesión (checkout, mis-pedidos, perfil
// — se van a agregar acá en fases siguientes). RutaProtegida se encarga de
// mandar a /login si no hay usuario.
export default function ProtectedLayout() {
  return (
    <RutaProtegida>
      <Slot />
    </RutaProtegida>
  );
}
