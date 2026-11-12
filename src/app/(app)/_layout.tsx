import { Tabs } from 'expo-router/js-tabs';

import { BottomNav } from '@/components/bottom-nav';
import { useColors } from '@/context/theme-context';

// Grupo (app): la app para usuarios con sesión, organizada en pestañas.
// Cada archivo de esta carpeta es una pestaña: index = Inicio, talleres, ninos, admin.
//
// Notas sobre esta versión de Expo Router (v58):
// - Las pantallas se declaran en el MISMO orden que usa Expo Router internamente
//   (index primero y luego alfabético). Declararlas en otro orden desincronizaba el estado
//   inicial y abría la pestaña equivocada. El orden visual de los botones lo decide BottomNav.
// - La pestaña admin siempre está registrada; BottomNav oculta su botón si el usuario no es
//   staff y admin.tsx redirige a Inicio. (No usamos Tabs.Protected porque el rol llega de
//   Supabase después de montar las pestañas.)
export default function AppTabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="admin" />
      <Tabs.Screen name="ninos" />
      <Tabs.Screen name="talleres" />
    </Tabs>
  );
}
