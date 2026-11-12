import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/grid-background';
import { ArrowClockwiseIcon, ArrowLeftIcon, StarIcon, TrophyIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { pressedStyle } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';
import type { LabColors } from '@/theme/palette';

// Piezas compartidas por los minijuegos de la pestaña Niños (estilo "laboratorio de juegos").

/**
 * Estilo "estampa": borde grueso y sombra sólida desplazada hacia abajo.
 * Con `background` (un color vivo) usa `brightLine`/`brightShadow` para que el contorno
 * nunca sea del mismo color que el relleno (pasaba con el cian en modo oscuro).
 */
export function stamp(lab: LabColors, depth = 4, background?: string) {
  return {
    backgroundColor: background ?? lab.surface,
    borderColor: background ? lab.brightLine : lab.line,
    borderWidth: 2,
    shadowColor: background ? lab.brightShadow : lab.shadow,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: depth },
    elevation: 0,
  };
}

/** Pantalla completa de un juego: fondo cuadriculado, área segura y scroll (que se puede congelar). */
export function GameScreen({ children, scrollEnabled = true }: { children: ReactNode; scrollEnabled?: boolean }) {
  const lab = useLabColors();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: lab.background }]} edges={['top', 'bottom']}>
      <GridBackground color={lab.grid} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>{children}</ScrollView>
    </SafeAreaView>
  );
}

/** Botón "Salir" y marcador de aciertos. */
export function GameTopBar({ score, total }: { score: number; total?: number }) {
  const lab = useLabColors();
  const text = total ? `${score} / ${total}` : `${score} aciertos`;
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.back, stamp(lab), pressed && pressedStyle]}>
        <ArrowLeftIcon color={lab.text} size={18} weight="bold" />
        <Text style={[styles.backText, { color: lab.text }]}>Salir</Text>
      </Pressable>
      <View accessibilityLabel={`Aciertos: ${text}`} style={[styles.score, stamp(lab, 4, lab.amber)]}>
        <StarIcon color={lab.onBright} size={16} weight="fill" />
        <Text style={[styles.scoreText, { color: lab.onBright }]}>{text}</Text>
      </View>
    </View>
  );
}

/** Tarjeta de misión: etiqueta tipo código, pregunta y explicación breve. */
export function MissionCard({ label, title, text, art }: { label: string; title: string; text: string; art?: ReactNode }) {
  const lab = useLabColors();
  return (
    <View style={[styles.mission, stamp(lab)]}>
      <View style={styles.flex}>
        <Text style={[styles.missionLabel, { color: lab.label }]}>{label}</Text>
        <Text style={[styles.missionTitle, { color: lab.text }]}>{title}</Text>
        <Text style={[styles.missionText, { color: lab.muted }]}>{text}</Text>
      </View>
      {art}
    </View>
  );
}

/** Pantalla final con el resultado y la opción de volver a jugar. */
export function GameFinish({ title, text, onRestart }: { title: string; text: string; onRestart: () => void }) {
  const lab = useLabColors();
  return (
    <View style={[styles.finish, stamp(lab, 6)]}>
      <View style={[styles.trophy, stamp(lab, 4, lab.lime)]}>
        <TrophyIcon color={lab.onBright} size={40} weight="duotone" />
      </View>
      <Text style={[styles.finishTitle, { color: lab.text }]}>{title}</Text>
      <Text style={[styles.missionText, styles.center, { color: lab.muted }]}>{text}</Text>
      <Pressable accessibilityRole="button" onPress={onRestart} style={({ pressed }) => [styles.action, stamp(lab, 4, lab.cyan), pressed && pressedStyle]}>
        <ArrowClockwiseIcon color={lab.onBright} size={18} weight="bold" />
        <Text style={[styles.actionText, { color: lab.onBright }]}>Jugar otra vez</Text>
      </Pressable>
    </View>
  );
}

/** Botón principal de los juegos (cian, tipo estampa). */
export function GameButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  const lab = useLabColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, stamp(lab, 4, lab.cyan), pressed && pressedStyle]}>
      {icon}
      <Text style={[styles.actionText, { color: lab.onBright }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, maxWidth: 800, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, borderRadius: 14, paddingHorizontal: 14 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, borderRadius: 999, paddingHorizontal: 12 },
  scoreText: { fontFamily: fonts.monoBold, fontSize: 12 },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16, marginBottom: 16 },
  missionLabel: { fontFamily: fonts.monoBold, fontSize: 11 },
  missionTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, marginTop: 4 },
  missionText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 4 },
  finish: { alignItems: 'center', borderRadius: 24, padding: 22, marginTop: 4 },
  trophy: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  finishTitle: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, textAlign: 'center' },
  center: { textAlign: 'center', marginBottom: 18 },
  action: { alignSelf: 'stretch', minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
