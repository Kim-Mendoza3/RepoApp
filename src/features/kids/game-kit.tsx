import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, useAnimatedValue, View, type ViewStyle } from 'react-native';

import { HandTapIcon, HeartBreakIcon, HeartIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { stamp } from '@/features/kids/game-chrome';
import { fonts } from '@/theme/fonts';

// PIEZAS COMPARTIDAS POR LOS MINIJUEGOS DE ARRASTRAR (Divu, insectos…)
// - Vidas (corazones) y el texto que dice Divu al perder una.
// - Burbuja de diálogo de Divu.
// - Cálculo del "lanzamiento": hacia dónde iba lo que el niño arrastraba al soltarlo.

export const LIVES = 3;

/** Lo que dice Divu en su burbuja al perder una vida. */
export const livesLeftText = (left: number) => (left === 0 ? '¡Ya no me quedan vidas!' : left === 1 ? '¡Uy! Me queda 1 vida' : `¡Uy! Me quedan ${left} vidas`);

/** Tiempo de cada ronda con velocidad progresiva: de `start` (primera) a `end` (última). */
export const progressiveMs = (round: number, rounds: number, start: number, end: number) =>
  Math.round(start - ((start - end) * round) / Math.max(1, rounds - 1));

/** Las 3 vidas. La que se pierde "se rompe": crece, tiembla y queda como corazón vacío. */
export function Hearts({ lives }: { lives: number }) {
  const lab = useLabColors();
  const first = useAnimatedValue(0);
  const second = useAnimatedValue(0);
  const third = useAnimatedValue(0);
  const breaks = [first, second, third];
  const previous = useRef(lives);

  useEffect(() => {
    if (lives < previous.current) {
      const lost = breaks[lives];
      lost.setValue(0);
      Animated.timing(lost, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
    if (lives === LIVES) breaks.forEach((value) => value.setValue(0));
    previous.current = lives;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives]);

  return (
    <View accessibilityLabel={`Vidas: ${lives} de ${LIVES}`} style={styles.hearts}>
      {breaks.map((value, index) => {
        const alive = index < lives;
        const scale = value.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1, 1.5, 1] });
        const rotate = value.interpolate({ inputRange: [0, 0.3, 0.45, 0.6, 0.75, 1], outputRange: ['0deg', '-14deg', '12deg', '-8deg', '4deg', '0deg'] });
        return (
          <Animated.View key={index} style={{ transform: [{ scale }, { rotate }] }}>
            {alive
              ? <HeartIcon color="#E11D48" size={22} weight="fill" />
              : <HeartBreakIcon color={lab.muted} size={22} weight="duotone" />}
          </Animated.View>
        );
      })}
    </View>
  );
}

type SpeechBubbleProps = {
  text: string;
  /** Pie de la burbuja ("Toca para continuar · 1/4"); sin él, es un mensaje breve. */
  hint?: string;
  /** Valor animado de entrada (0 → 1): escala y opacidad. */
  appear: Animated.Value;
  /** Posición dentro del escenario (bottom, left/right, maxWidth…). */
  style: ViewStyle;
  /** Distancia del piquito al borde derecho de la burbuja (para apuntar a la cabeza de Divu). */
  tailRight?: number;
  children?: ReactNode;
};

/** Burbuja de diálogo de Divu, con piquito hacia su cabeza. */
export function SpeechBubble({ text, hint, appear, style, tailRight = 104 }: SpeechBubbleProps) {
  const lab = useLabColors();
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bubble, stamp(lab, 4), style, {
        opacity: appear.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
        transform: [{ scale: appear }],
      }]}
    >
      <Text style={[styles.bubbleText, { color: lab.text }]}>{text}</Text>
      {hint ? (
        <View style={styles.bubbleFooter}>
          <HandTapIcon color={lab.label} size={16} weight="duotone" />
          <Text style={[styles.bubbleHint, { color: lab.label }]}>{hint}</Text>
        </View>
      ) : null}
      <View style={[styles.bubbleTail, { right: tailRight, backgroundColor: lab.surface, borderColor: lab.line }]} />
    </Animated.View>
  );
}

type TrailPoint = { t: number; x: number; y: number };

/**
 * Recuerda las últimas posiciones del dedo para calcular la velocidad al soltar.
 * (El gesto reporta velocidad 0 si el dedo se detuvo un instante antes de levantarse.)
 */
export function useDragTrail() {
  const trail = useRef<TrailPoint[]>([]);
  return {
    reset: () => {
      trail.current = [];
    },
    push: (x: number, y: number) => {
      const now = Date.now();
      trail.current = [...trail.current.filter((point) => now - point.t < 160), { t: now, x, y }];
    },
    /** Velocidad (px/s) de los últimos ~120 ms, ignorando la pausa final del dedo. */
    velocity: (fallback: { x: number; y: number }) => {
      const points = trail.current;
      const last = points[points.length - 1];
      const moving = last ? points.filter((point) => point.x !== last.x || point.y !== last.y) : [];
      const from = moving.find((point) => last.t - point.t <= 120) ?? moving[moving.length - 1];
      if (!from || !last || last.t <= from.t) return fallback;
      const dt = (last.t - from.t) / 1000;
      return { x: (last.x - from.x) / dt, y: (last.y - from.y) / dt };
    },
  };
}

/**
 * Lanzamiento rápido: el niño suele soltar ANTES de llegar al blanco. Seguimos la dirección y
 * velocidad del dedo hasta 0,25 s, en pasos de máximo ~15 px para no "saltarnos" el blanco.
 */
export function projectTarget<T>(x: number, y: number, velocity: { x: number; y: number }, targetAt: (px: number, py: number) => T | null): T | null {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed <= 300) return null;
  const step = Math.min(0.01, 15 / speed);
  for (let seconds = step; seconds <= 0.25; seconds += step) {
    const target = targetAt(x + velocity.x * seconds, y + velocity.y * seconds);
    if (target) return target;
  }
  return null;
}

const styles = StyleSheet.create({
  hearts: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  bubble: { position: 'absolute', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, zIndex: 25 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bubbleHint: { fontFamily: fonts.monoBold, fontSize: 11 },
  bubbleTail: { position: 'absolute', bottom: -9, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }] },
});
