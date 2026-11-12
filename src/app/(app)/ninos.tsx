import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { useColors } from '@/context/theme-context';
import { pressedStyle, textStyles } from '@/theme/common-styles';

// PESTAÑA NIÑAS Y NIÑOS: zona de juegos educativos.
export default function KidsScreen() {
  const colors = useColors();

  return (
    <AppScreen title="Niños" watermarkOpacity={0.12}>
      <View style={[styles.hero, { backgroundColor: colors.greenSoft }]}>
        <Text style={[textStyles.eyebrow, { color: colors.green }]}>ZONA SEGURA</Text>
        <Text style={[textStyles.pageTitle, { color: colors.text }]}>Aprender es jugar</Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>Elige una aventura y descubre la ciencia a tu ritmo.</Text>
      </View>
      <Text style={[textStyles.heading, { color: colors.text }]}>Juegos disponibles</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/juegos/dibu')}
        style={({ pressed }) => [styles.gameCard, { backgroundColor: colors.surface, borderColor: colors.green }, pressed && pressedStyle]}
      >
        <View style={[styles.gameIcon, { backgroundColor: colors.greenSoft }]}>
          <MaterialCommunityIcons color={colors.green} name="snake" size={34} />
        </View>
        <View style={styles.gameCopy}>
          <Text style={[styles.gameEyebrow, { color: colors.green }]}>AVENTURA 2D</Text>
          <Text style={[styles.gameTitle, { color: colors.text }]}>Dibu y su merienda</Text>
          <Text style={[styles.gameDescription, { color: colors.muted }]}>Ayuda a Dibu a identificar qué alimentos puede comer una serpiente.</Text>
        </View>
        <MaterialCommunityIcons color={colors.green} name="arrow-right-circle" size={28} />
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, padding: 24, marginBottom: 28 },
  gameCard: { minHeight: 128, borderRadius: 22, borderWidth: 1.5, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 24 },
  gameIcon: { width: 65, height: 65, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gameCopy: { flex: 1 },
  gameEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  gameTitle: { fontSize: 19, fontWeight: '900', marginTop: 4 },
  gameDescription: { fontSize: 12, lineHeight: 17, marginTop: 4 },
});
