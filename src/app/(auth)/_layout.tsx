import { Stack } from 'expo-router';

// Grupo (auth): pantallas para quien todavía no inicia sesión.
// Los paréntesis hacen que "(auth)" no aparezca en la URL: la ruta es /login.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
