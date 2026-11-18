import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAppTheme, useLabColors } from '@/context/theme-context';

// CELEBRACIÓN DE FIN DE JUEGO
// Fuegos artificiales y confeti que EXPLOTAN y luego caen como LLUVIA.
// Cada partícula tiene un solo valor animado de 0 a 1; su trayectoria (x, y) se calcula
// aquí con física sencilla y se "dibuja" con interpolate, así todo corre en el hilo nativo
// (useNativeDriver) y no traba el juego.

const STEPS = 16; // puntos de muestra de cada trayectoria
const SAMPLE_T = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

/** Números "al azar" pero reproducibles (misma semilla = misma celebración). */
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Posición con resistencia del aire: sale disparada (v), frena (k) y la gravedad (g) la lleva
 * a caer despacio a velocidad constante g/k: el momento en que la explosión "se vuelve lluvia".
 */
function ballistic(v: number, k: number, g: number, t: number) {
  const slow = (1 - Math.exp(-k * t)) / k;
  return v * slow + (g / k) * (t - slow);
}

type Spark = { burst: number; x0: number; y0: number; xs: number[]; ys: number[]; trailXs: number[]; trailYs: number[]; color: string; size: number };
type Burst = { delay: number; rise: number; x: number; y: number; color: string };
type Confetti = { delay: number; duration: number; xs: number[]; ys: number[]; spin: number; flips: number; color: string; w: number; h: number };

const BURST_MS = 2200;
const RISE_MS = 450;

const SPARKS_PER_BURST = 28;

function makeShow(seed: number, width: number, height: number, colors: string[], sparkColors: string[], dark: boolean) {
  const rand = seededRandom(seed);
  const pick = () => colors[Math.floor(rand() * colors.length)];
  const bursts: Burst[] = [];
  const sparks: Spark[] = [];
  const confetti: Confetti[] = [];

  // Fuegos artificiales: los dos del segundo 2 coinciden con el platillo de la fanfarria.
  const plan = [
    { at: 500, x: 0.3, y: 0.24 }, { at: 1100, x: 0.72, y: 0.18 }, { at: 2000, x: 0.5, y: 0.3 },
    { at: 2050, x: 0.18, y: 0.4 }, { at: 2650, x: 0.8, y: 0.36 },
  ];
  plan.forEach((b, burst) => {
    const x = width * (b.x + (rand() - 0.5) * 0.08);
    const y = height * (b.y + (rand() - 0.5) * 0.06);
    const color = sparkColors[Math.floor(rand() * sparkColors.length)];
    const delay = b.at - RISE_MS;
    bursts.push({ delay, rise: RISE_MS, x, y, color });
    const seconds = BURST_MS / 1000;
    for (let i = 0; i < SPARKS_PER_BURST; i += 1) {
      // Dos anillos: uno grande y otro interior más lento, como los fuegos de verdad.
      const ring = i % 2 === 0 ? 1 : 0.55;
      const angle = (i / SPARKS_PER_BURST) * Math.PI * 2 + rand() * 0.2;
      const speed = (380 + rand() * 120) * ring;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const at = (p: number) => Math.max(0, p) * seconds;
      sparks.push({
        burst, x0: x, y0: y,
        xs: SAMPLE_T.map((p) => ballistic(vx, 3, 0, at(p))),
        ys: SAMPLE_T.map((p) => ballistic(vy, 3, 270, at(p))),
        // La estela es la misma chispa un instante atrás (más chica y tenue).
        trailXs: SAMPLE_T.map((p) => ballistic(vx, 3, 0, at(p - 0.04))),
        trailYs: SAMPLE_T.map((p) => ballistic(vy, 3, 270, at(p - 0.04))),
        color: dark && rand() < 0.2 ? '#FFFFFF' : color,
        size: 7 + rand() * 3,
      });
    }
  });

  // Confeti: dos cañones en las esquinas de abajo que disparan hacia el centro...
  for (const side of [-1, 1]) {
    for (let i = 0; i < 22; i += 1) {
      const tilt = 0.12 + rand() * 0.7; // inclinación desde la vertical, hacia el centro
      const speed = 1100 + rand() * 700;
      const drag = 2.2 + rand() * 1.0; // cada papelito frena distinto: así se separan
      const gravity = drag * (80 + rand() * 40); // y cae a 80-120 px/s (lluvia)
      const vx = -side * Math.sin(tilt) * speed; // el izquierdo dispara a la derecha y viceversa
      const vy = -Math.cos(tilt) * speed; // hacia arriba (en pantalla, y crece hacia abajo)
      const duration = 4200 + rand() * 1200;
      const seconds = duration / 1000;
      const sway = 14 + rand() * 18;
      const wobble = 0.6 + rand() * 0.6;
      const startX = side < 0 ? 0 : width;
      confetti.push({
        delay: rand() * 120, duration,
        xs: SAMPLE_T.map((p) => startX + ballistic(vx, drag, 0, p * seconds) + sway * Math.sin(2 * Math.PI * wobble * p * seconds)),
        ys: SAMPLE_T.map((p) => height * 0.92 + ballistic(vy, drag, gravity, p * seconds)),
        spin: (rand() < 0.5 ? -1 : 1) * (360 + rand() * 540), flips: 3 + Math.floor(rand() * 4),
        color: pick(), w: 7 + rand() * 4, h: 11 + rand() * 6,
      });
    }
  }
  // ...y después una lluvia de confeti que cae desde arriba.
  for (let i = 0; i < 30; i += 1) {
    const duration = 3600 + rand() * 1800;
    const seconds = duration / 1000;
    const x0 = rand() * width;
    const sway = 12 + rand() * 22;
    const wobble = 0.5 + rand() * 0.6;
    const fall = height + 60;
    confetti.push({
      delay: 700 + rand() * 1900, duration,
      xs: SAMPLE_T.map((p) => x0 + sway * Math.sin(2 * Math.PI * wobble * p * seconds + i)),
      ys: SAMPLE_T.map((p) => -30 + fall * p),
      spin: (rand() < 0.5 ? -1 : 1) * (240 + rand() * 360), flips: 2 + Math.floor(rand() * 4),
      color: pick(), w: 7 + rand() * 4, h: 11 + rand() * 6,
    });
  }
  return { bursts, sparks, confetti };
}

/** Capa de celebración a pantalla completa (no bloquea los toques). Se monta una vez por partida terminada. */
export function Celebration({ seed }: { seed: number }) {
  const lab = useLabColors();
  const { width, height } = useWindowDimensions();
  const { mode } = useAppTheme();
  const [show] = useState(() => makeShow(
    seed, width, height,
    [lab.cyan, lab.lime, lab.amber, lab.pink, '#A78BFA', '#FB7185'],
    // Chispas con colores intensos: los pastel se pierden sobre el fondo claro.
    mode === 'dark' ? ['#22D3EE', '#A3E635', '#FBBF24', '#F472B6', '#C084FC', '#FB7185'] : ['#0891B2', '#65A30D', '#F59E0B', '#DB2777', '#7C3AED', '#E11D48'],
    mode === 'dark',
  ));
  // Un valor animado por cohete (subida), por explosión y por confeti.
  const [values] = useState(() => ({
    rise: show.bursts.map(() => new Animated.Value(0)),
    burst: show.bursts.map(() => new Animated.Value(0)),
    confetti: show.confetti.map(() => new Animated.Value(0)),
  }));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Respeta "Reducir movimiento" del teléfono (accesibilidad): sin animaciones grandes.
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        setReduceMotion(true);
        return;
      }
      const animations = [
        ...show.bursts.map((b, i) => Animated.sequence([
          Animated.delay(Math.max(0, b.delay)),
          Animated.timing(values.rise[i], { toValue: 1, duration: b.rise, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(values.burst[i], { toValue: 1, duration: BURST_MS, easing: Easing.linear, useNativeDriver: true }),
        ])),
        ...show.confetti.map((c, i) => Animated.sequence([
          Animated.delay(c.delay),
          Animated.timing(values.confetti[i], { toValue: 1, duration: c.duration, easing: Easing.linear, useNativeDriver: true }),
        ])),
      ];
      Animated.parallel(animations).start();
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [show, values]);

  if (reduceMotion) return null;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={StyleSheet.absoluteFill}>
      {show.bursts.map((b, i) => {
        // Cohete: un punto que sube dejando estela y desaparece al explotar.
        const rocketY = values.rise[i].interpolate({ inputRange: [0, 1], outputRange: [height + 10, b.y] });
        const rocketOpacity = values.rise[i].interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] });
        // Destello: un círculo que crece y se apaga al explotar.
        const flashScale = values.burst[i].interpolate({ inputRange: [0, 0.16], outputRange: [0.15, 3.4], extrapolate: 'clamp' });
        const flashOpacity = values.burst[i].interpolate({ inputRange: [0, 0.02, 0.18], outputRange: [0, 0.9, 0], extrapolate: 'clamp' });
        const coreOpacity = values.burst[i].interpolate({ inputRange: [0, 0.01, 0.08], outputRange: [0, 1, 0], extrapolate: 'clamp' });
        return (
          <View key={`b${i}`}>
            <Animated.View style={[styles.rocket, { backgroundColor: b.color, left: b.x - 2, opacity: rocketOpacity, transform: [{ translateY: rocketY }] }]} />
            {/* Anillo de luz que se expande y un destello en el centro. */}
            <Animated.View style={[styles.ring, { borderColor: b.color, left: b.x - 30, top: b.y - 30, opacity: flashOpacity, transform: [{ scale: flashScale }] }]} />
            <Animated.View style={[styles.core, { backgroundColor: b.color, left: b.x - 14, top: b.y - 14, opacity: coreOpacity }]} />
          </View>
        );
      })}
      {show.sparks.map((s, i) => {
        const value = values.burst[s.burst];
        const translateX = value.interpolate({ inputRange: SAMPLE_T, outputRange: s.xs });
        const translateY = value.interpolate({ inputRange: SAMPLE_T, outputRange: s.ys });
        const trailX = value.interpolate({ inputRange: SAMPLE_T, outputRange: s.trailXs });
        const trailY = value.interpolate({ inputRange: SAMPLE_T, outputRange: s.trailYs });
        // Brilla, titila mientras cae como lluvia y se apaga.
        const opacity = value.interpolate({ inputRange: [0, 0.01, 0.5, 0.62, 0.72, 0.82, 0.9, 1], outputRange: [0, 1, 1, 0.45, 0.95, 0.35, 0.7, 0] });
        const trailOpacity = value.interpolate({ inputRange: [0, 0.02, 0.35, 0.6], outputRange: [0, 0.55, 0.3, 0], extrapolate: 'clamp' });
        const scale = value.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1.3, 1, 0.45] });
        const dot = { backgroundColor: s.color, width: s.size, height: s.size, borderRadius: s.size / 2, left: s.x0 - s.size / 2, top: s.y0 - s.size / 2 };
        return (
          <View key={`s${i}`}>
            <Animated.View style={[styles.spark, dot, { opacity: trailOpacity, transform: [{ translateX: trailX }, { translateY: trailY }, { scale: 0.7 }] }]} />
            <Animated.View style={[styles.spark, dot, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]} />
          </View>
        );
      })}
      {show.confetti.map((c, i) => {
        const value = values.confetti[i];
        const translateX = value.interpolate({ inputRange: SAMPLE_T, outputRange: c.xs });
        const translateY = value.interpolate({ inputRange: SAMPLE_T, outputRange: c.ys });
        const rotate = value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.spin}deg`] });
        // El papelito "aletea": se aplana y se abre varias veces al caer.
        const scaleY = value.interpolate({ inputRange: SAMPLE_T, outputRange: SAMPLE_T.map((p) => Math.max(0.15, Math.abs(Math.cos(Math.PI * c.flips * p)))) });
        const opacity = value.interpolate({ inputRange: [0, 0.02, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View
            key={`c${i}`}
            style={[styles.confetti, {
              backgroundColor: c.color, width: c.w, height: c.h, left: -c.w / 2, top: -c.h / 2,
              opacity, transform: [{ translateX }, { translateY }, { rotate }, { scaleY }],
            }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rocket: { position: 'absolute', top: 0, width: 4, height: 14, borderRadius: 2 },
  ring: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
  core: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  spark: { position: 'absolute' },
  confetti: { position: 'absolute', borderRadius: 2 },
});
