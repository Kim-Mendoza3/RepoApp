import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/loading-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider, useAppTheme } from '@/context/theme-context';
import { fontAssets } from '@/theme/fonts';

// Mantiene la pantalla de arranque nativa hasta que las fuentes estén listas.
SplashScreen.preventAutoHideAsync();

// Tiempo mínimo de la animación de bienvenida, para que no parpadee si la sesión carga rápido.
const INTRO_MS = 2400;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || Boolean(fontError);

  // Quitamos la pantalla nativa cuando las fuentes cargaron (o fallaron: en ese caso la app
  // usa la fuente del sistema). Sin esta llamada, Android se queda para siempre en el logo.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

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
        y Expo Router lo manda a `redirectTo`. Aquí solo el login está protegido: con
        sesión iniciada deja de existir y la app regresa a Inicio.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* MODO INVITADO: el contenido público se puede usar sin cuenta (lo exigen las tiendas). */}
        <Stack.Screen name="(app)" />
        <Stack.Screen name="workshop/[id]" />
        {/* Sin gesto de "deslizar para regresar" (iOS): chocaba con arrastrar. Se sale con "Salir". */}
        <Stack.Screen name="juegos/divu" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
        <Stack.Screen name="juegos/insectos" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
        <Stack.Screen name="juegos/estrellas" />
        {/* El login solo existe sin sesión; al iniciar sesión desaparece y se vuelve a Inicio. */}
        <Stack.Protected guard={!isLoggedIn} redirectTo="/">
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
      </Stack>
      {(!introDone || loading) && <LoadingScreen />}
    </NavigationThemeProvider>
  );
}
