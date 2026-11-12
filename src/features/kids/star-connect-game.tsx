import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { ArrowRightIcon, HandTapIcon, ShootingStarIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { GameButton, GameFinish, GameTopBar, MissionCard, stamp } from '@/features/kids/game-chrome';
import { fonts } from '@/theme/fonts';

type Constellation = {
  name: string;
  fact: string;
  /** Posición de cada estrella en el cielo (0 a 1 de ancho y alto). */
  stars: { x: number; y: number }[];
  /** Orden en que se tocan las estrellas. `null` = levantar el lápiz (la siguiente no se une con la anterior). */
  path: (number | null)[];
};

// Formas simplificadas para que niñas y niños las reconozcan.
const constellations: Constellation[] = [
  {
    name: 'Casiopea',
    fact: 'Tiene forma de W (o de M, según la hora). Ayuda a encontrar la Estrella Polar.',
    stars: [{ x: 0.1, y: 0.38 }, { x: 0.3, y: 0.66 }, { x: 0.5, y: 0.44 }, { x: 0.7, y: 0.7 }, { x: 0.9, y: 0.36 }],
    path: [0, 1, 2, 3, 4],
  },
  {
    name: 'Cruz del Sur',
    fact: 'Es la constelación más pequeña de todo el cielo y sirve para ubicar el sur.',
    stars: [{ x: 0.5, y: 0.14 }, { x: 0.53, y: 0.86 }, { x: 0.22, y: 0.46 }, { x: 0.8, y: 0.52 }],
    path: [0, 1, null, 2, 3],
  },
  {
    name: 'Osa Mayor',
    fact: 'Siete de sus estrellas forman "el Carro". Las dos del borde apuntan hacia la Estrella Polar.',
    stars: [{ x: 0.9, y: 0.22 }, { x: 0.73, y: 0.3 }, { x: 0.57, y: 0.38 }, { x: 0.42, y: 0.46 }, { x: 0.44, y: 0.7 }, { x: 0.17, y: 0.74 }, { x: 0.13, y: 0.48 }],
    path: [0, 1, 2, 3, 4, 5, 6, 3],
  },
  {
    name: 'Orión',
    fact: 'Representa a un cazador. Las tres estrellas en fila son su cinturón y se ven muy bien en las noches de invierno.',
    stars: [{ x: 0.28, y: 0.14 }, { x: 0.7, y: 0.2 }, { x: 0.6, y: 0.48 }, { x: 0.5, y: 0.52 }, { x: 0.4, y: 0.56 }, { x: 0.3, y: 0.88 }, { x: 0.74, y: 0.84 }],
    path: [0, 1, 2, 3, 4, 0, null, 4, 5, null, 2, 6],
  },
];

// Estrellitas de fondo (posiciones fijas para que el cielo no cambie en cada render).
const backgroundStars = Array.from({ length: 34 }, (_, i) => ({ x: ((i * 37) % 100) / 100, y: ((i * 61 + 13) % 100) / 100, r: i % 3 === 0 ? 1.4 : 0.9 }));

const SKY_HEIGHT = 300;
const SKY_COLOR = '#0B1530';
const LINE_COLOR = '#7DE3F4';

/** Índice del paso que sigue, saltando las pausas (`null`). */
function nextStep(path: (number | null)[], from: number) {
  let step = from;
  while (step < path.length && path[step] === null) step += 1;
  return step;
}

/** Juego "Une las estrellas": toca las estrellas en orden para dibujar constelaciones. */
export function StarConnectGame() {
  const lab = useLabColors();
  const [level, setLevel] = useState(0);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState(false);
  const [width, setWidth] = useState(0);
  const pulse = useAnimatedValue(0);
  const finished = level >= constellations.length;
  const constellation = constellations[Math.min(level, constellations.length - 1)];
  const current = nextStep(constellation.path, step);
  const complete = current >= constellation.path.length;
  const targetStar = complete ? null : constellation.path[current];

  // La estrella que sigue "late" para guiar al jugador.
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const tapStar = (starIndex: number) => {
    if (complete) return;
    if (starIndex !== targetStar) {
      setMiss(true);
      return;
    }
    setMiss(false);
    const following = nextStep(constellation.path, current + 1);
    setStep(current + 1);
    if (following >= constellation.path.length) setScore((value) => value + 1);
  };

  const goNext = () => {
    setLevel((value) => value + 1);
    setStep(0);
    setMiss(false);
  };

  const restart = () => {
    setLevel(0);
    setStep(0);
    setScore(0);
    setMiss(false);
  };

  // Líneas ya trazadas: pares consecutivos del recorrido (ya tocados) que no cruzan una pausa.
  const lines: { from: number; to: number }[] = [];
  for (let i = 1; i < step; i += 1) {
    const from = constellation.path[i - 1];
    const to = constellation.path[i];
    if (from !== null && to !== null) lines.push({ from, to });
  }
  const touched = new Set(constellation.path.slice(0, step).filter((value): value is number => value !== null));
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <View>
      <GameTopBar score={score} total={constellations.length} />
      <MissionCard
        label="// experimento 03 · astronomía"
        title="Une las estrellas"
        text="Toca la estrella que brilla para trazar la constelación. ¡Descubre qué figura se esconde en el cielo!"
        art={<ShootingStarIcon color={lab.label} size={44} weight="duotone" />}
      />

      {finished ? (
        <GameFinish title="¡Mapa estelar completo!" text="Dibujaste Casiopea, la Cruz del Sur, la Osa Mayor y Orión. Búscalas en el cielo una noche despejada." onRestart={restart} />
      ) : (
        <>
          <Text style={[styles.progress, { color: lab.label }]}>{`// constelación ${level + 1} de ${constellations.length}`}</Text>
          <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={[styles.sky, stamp(lab, 5, SKY_COLOR)]}>
            {width > 0 ? (
              <>
                <Svg height={SKY_HEIGHT} pointerEvents="none" style={StyleSheet.absoluteFill} width={width}>
                  {backgroundStars.map((star, i) => <Circle cx={star.x * width} cy={star.y * SKY_HEIGHT} fill="#FFFFFF" key={i} opacity={0.35} r={star.r} />)}
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      stroke={LINE_COLOR}
                      strokeLinecap="round"
                      strokeWidth={3}
                      x1={constellation.stars[line.from].x * width}
                      x2={constellation.stars[line.to].x * width}
                      y1={constellation.stars[line.from].y * SKY_HEIGHT}
                      y2={constellation.stars[line.to].y * SKY_HEIGHT}
                    />
                  ))}
                </Svg>
                {constellation.stars.map((star, i) => {
                  const isTarget = i === targetStar;
                  const isLit = touched.has(i);
                  return (
                    <Pressable
                      accessibilityLabel={isTarget ? `Estrella ${i + 1}, toca aquí` : `Estrella ${i + 1}`}
                      accessibilityRole="button"
                      hitSlop={6}
                      key={i}
                      onPress={() => tapStar(i)}
                      style={[styles.starHit, { left: star.x * width - 22, top: star.y * SKY_HEIGHT - 22 }]}
                    >
                      {isTarget ? <Animated.View style={[styles.halo, { backgroundColor: lab.lime, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} /> : null}
                      <View style={[styles.star, { backgroundColor: isLit || isTarget ? '#FFFFFF' : '#9FB4D9', width: isLit ? 16 : 13, height: isLit ? 16 : 13 }]} />
                    </Pressable>
                  );
                })}
                {complete ? (
                  <View style={styles.skyLabel}>
                    <Text style={styles.skyLabelText}>{constellation.name.toUpperCase()}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>

          {complete ? (
            <>
              <View style={[styles.result, stamp(lab, 5, lab.lime)]}>
                <Text style={[styles.resultTitle, { color: lab.onBright }]}>{`¡Encontraste ${constellation.name}!`}</Text>
                <Text style={[styles.resultText, { color: lab.onBright }]}>{constellation.fact}</Text>
              </View>
              <GameButton
                icon={<ArrowRightIcon color={lab.onBright} size={18} weight="bold" />}
                label={level + 1 < constellations.length ? 'Siguiente constelación' : 'Ver resultado'}
                onPress={goNext}
              />
            </>
          ) : (
            <View style={[styles.hint, { backgroundColor: miss ? lab.pink : lab.specimen, borderColor: lab.line }]}>
              <HandTapIcon color={miss ? lab.onBright : lab.text} size={22} weight="duotone" />
              <Text style={[styles.hintText, { color: miss ? lab.onBright : lab.text }]}>
                {miss ? 'Esa no. Busca la estrella que brilla en verde.' : 'Toca la estrella que brilla en verde.'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { fontFamily: fonts.monoBold, fontSize: 11, marginBottom: 10 },
  sky: { height: SKY_HEIGHT, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  starHit: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  star: { borderRadius: 999, shadowColor: '#FFFFFF', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  skyLabel: { position: 'absolute', left: 12, bottom: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(125, 227, 244, 0.18)' },
  skyLabelText: { color: LINE_COLOR, fontFamily: fonts.monoBold, fontSize: 12 },
  result: { borderRadius: 20, padding: 16, marginBottom: 14 },
  resultTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  resultText: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, marginTop: 6 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  hintText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
});
