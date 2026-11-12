import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/grid-background';
import { useLabColors } from '@/context/theme-context';
import { ReptileGame } from '@/features/kids/reptile-game';

// Pantalla completa del juego. Al ser una ruta propia, el botón "atrás" de Android
// regresa a la pestaña Niños en lugar de cerrar la app.
export default function DibuGameScreen() {
  const lab = useLabColors();
  // En iOS el scroll y el arrastre de la comida escuchan el mismo dedo a la vez;
  // mientras se arrastra la comida, congelamos el scroll para que la pantalla no se mueva.
  const [dragging, setDragging] = useState(false);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: lab.background }]} edges={['top', 'bottom']}>
      <GridBackground color={lab.grid} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!dragging}>
        <ReptileGame onDraggingChange={setDragging} onExit={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, maxWidth: 800, width: '100%', alignSelf: 'center' },
});
