import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/context/theme-context';
import { ReptileGame } from '@/features/kids/reptile-game';

// Pantalla completa del juego. Al ser una ruta propia, el botón "atrás" de Android
// regresa a la pestaña Niños en lugar de cerrar la app.
export default function DibuGameScreen() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ReptileGame onExit={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, maxWidth: 800, width: '100%', alignSelf: 'center' },
});
