import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/loading-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider, useAppTheme } from '@/context/theme-context';

// Mantiene la pantalla de arranque nativa hasta que el primer render de React esté listo.
SplashScreen.preventAutoHideAsync();

// Tiempo mínimo de la animación de bienvenida, para que no parpadee si la sesión carga rápido.
const INTRO_MS = 2400;

export default function RootLayout() {
  // Al montar el layout raíz quitamos la pantalla nativa; a partir de aquí
  // la animación de carga propia (LoadingScreen) toma el relevo.
  // Sin esta llamada, Android se queda para siempre en el logo.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { mode } = useAppTheme();
  const { session, loading } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const isLoggedIn = Boolean(session);

  useEffect(() => {
    const timeout = setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <NavigationThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {/*
        Rutas protegidas: si `guard` es false, esas pantallas no existen para el usuario
        y Expo Router lo manda a `redirectTo`. Así, sin sesión solo se ve el login,
        y al iniciar sesión el login desaparece y se abre la app.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn} redirectTo="/login">
          <Stack.Screen name="(app)" />
          <Stack.Screen name="workshop/[id]" />
          {/* Sin gesto de "deslizar para regresar" (iOS): chocaba con arrastrar la comida. Se sale con "Salir". */}
          <Stack.Screen name="juegos/dibu" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
      </Stack>
      {(!introDone || loading) && <LoadingScreen />}
    </NavigationThemeProvider>
  );
}
