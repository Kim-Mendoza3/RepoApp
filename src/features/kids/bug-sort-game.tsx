import { useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useAnimatedValue, useAnimatedValueXY, View } from 'react-native';

import { ArrowRightIcon, HandSwipeRightIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { GameButton, GameFinish, GameTopBar, MissionCard, stamp } from '@/features/kids/game-chrome';
import { pressedStyle } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type Group = 'insecto' | 'aracnido';
type Creature = { name: string; emoji: string; group: Group; fact: string };

// Datos revisados para el taller de Insectos y el de Arácnidos.
const creatures: Creature[] = [
  { name: 'Hormiga', emoji: '🐜', group: 'insecto', fact: 'Tiene 6 patas y su cuerpo se divide en 3 partes: cabeza, tórax y abdomen.' },
  { name: 'Araña', emoji: '🕷️', group: 'aracnido', fact: 'Tiene 8 patas y su cuerpo tiene solo 2 partes. ¡No es un insecto!' },
  { name: 'Abeja', emoji: '🐝', group: 'insecto', fact: 'Tiene 6 patas, alas y antenas, como la mayoría de los insectos.' },
  { name: 'Alacrán', emoji: '🦂', group: 'aracnido', fact: 'Tiene 8 patas. Sus pinzas no son patas: se llaman pedipalpos.' },
  { name: 'Mariposa', emoji: '🦋', group: 'insecto', fact: 'Tiene 6 patas. De pequeña fue oruga y se transformó dentro de una crisálida.' },
  { name: 'Catarina', emoji: '🐞', group: 'insecto', fact: 'Tiene 6 patas y se come a los pulgones que dañan las plantas.' },
  { name: 'Grillo', emoji: '🦗', group: 'insecto', fact: 'Tiene 6 patas. Los machos cantan frotando sus alas.' },
  { name: 'Mosquito', emoji: '🦟', group: 'insecto', fact: 'Tiene 6 patas y 2 alas. Solo las hembras pican.' },
  { name: 'Tarántula', emoji: '🕷️', group: 'aracnido', fact: 'Tiene 8 patas y pelos que le ayudan a sentir lo que pasa a su alrededor.' },
];

const jars: { group: Group; label: string; legs: string; emoji: string }[] = [
  { group: 'insecto', label: 'INSECTO', legs: '6 patas', emoji: '🐜' },
  { group: 'aracnido', label: 'ARÁCNIDO', legs: '8 patas', emoji: '🕷️' },
];

/** Devuelve los bichos en un orden al azar (algoritmo de Fisher-Yates). */
function shuffled() {
  const list = [...creatures];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

type BugSortGameProps = {
  /** Avisa cuando el dedo toma o suelta el bicho, para congelar el scroll (necesario en iOS). */
  onDraggingChange?: (dragging: boolean) => void;
};

/** Juego "¿Insecto o arácnido?": lleva cada bicho al frasco correcto contando sus patas. */
export function BugSortGame({ onDraggingChange }: BugSortGameProps) {
  const lab = useLabColors();
  const [deck, setDeck] = useState(shuffled);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const position = useAnimatedValueXY({ x: 0, y: 0 });
  const pop = useAnimatedValue(1);
  const creature = deck[index];
  const finished = index >= deck.length;

  const classify = (group: Group) => {
    if (!creature || result) return;
    const correct = creature.group === group;
    if (correct) setScore((value) => value + 1);
    setResult({ correct });
    pop.setValue(0.85);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 10 }).start();
  };

  const next = () => {
    position.setValue({ x: 0, y: 0 });
    setResult(null);
    setIndex((value) => value + 1);
  };

  const restart = () => {
    position.setValue({ x: 0, y: 0 });
    setDeck(shuffled());
    setIndex(0);
    setScore(0);
    setResult(null);
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => onDraggingChange?.(true),
    onPanResponderMove: (_event, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_event, gesture) => {
      onDraggingChange?.(false);
      // Se suelta sobre un frasco si bajó lo suficiente; el lado (izquierda o derecha) elige cuál.
      if (gesture.dy > 90 && Math.abs(gesture.dx) > 25) {
        classify(gesture.dx < 0 ? 'insecto' : 'aracnido');
        return;
      }
      Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
    },
    onPanResponderTerminate: () => {
      onDraggingChange?.(false);
      Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
    // classify depende del bicho actual; se vuelve a crear cuando cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [creature, result, onDraggingChange, position]);

  return (
    <View>
      <GameTopBar score={score} total={deck.length} />
      <MissionCard
        label="// experimento 02 · clasificar"
        title="¿Insecto o arácnido?"
        text="Cuenta las patas y lleva cada animal a su frasco: los insectos tienen 6 y los arácnidos 8."
        art={<Text style={styles.missionArt}>🔍</Text>}
      />

      {finished ? (
        <GameFinish
          title={score === deck.length ? '¡Clasificación perfecta!' : '¡Experimento terminado!'}
          text={`Clasificaste bien ${score} de ${deck.length} animales. Recuerda: 6 patas = insecto, 8 patas = arácnido.`}
          onRestart={restart}
        />
      ) : (
        <>
          <Text style={[styles.progress, { color: lab.label }]}>{`// muestra ${index + 1} de ${deck.length}`}</Text>

          {/* Zona del bicho: se arrastra hacia abajo, a la izquierda o a la derecha. */}
          <View style={styles.stage}>
            {!result && creature ? (
              <Animated.View
                {...panResponder.panHandlers}
                accessibilityHint="Arrástralo al frasco correcto o toca un frasco"
                accessibilityLabel={`Muestra: ${creature.name}`}
                style={[styles.specimen, stamp(lab, 5), { transform: position.getTranslateTransform() }]}
              >
                <Text style={styles.specimenEmoji}>{creature.emoji}</Text>
                <Text style={[styles.specimenName, { color: lab.text }]}>{creature.name}</Text>
              </Animated.View>
            ) : null}
            {result && creature ? (
              <Animated.View style={[styles.feedback, stamp(lab, 5, result.correct ? lab.lime : lab.pink), { transform: [{ scale: pop }] }]}>
                <Text style={styles.feedbackEmoji}>{result.correct ? '🎉' : '🤔'}</Text>
                <Text style={[styles.feedbackTitle, { color: lab.onBright }]}>
                  {result.correct ? '¡Correcto!' : `¡Casi! Es ${creature.group === 'insecto' ? 'un insecto' : 'un arácnido'}`}
                </Text>
                <Text style={[styles.feedbackText, { color: lab.onBright }]}>{`${creature.emoji} ${creature.name}: ${creature.fact}`}</Text>
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.jars}>
            {jars.map((jar) => (
              <Pressable
                accessibilityLabel={`Frasco de ${jar.label.toLowerCase()}s, ${jar.legs}`}
                accessibilityRole="button"
                disabled={Boolean(result)}
                key={jar.group}
                onPress={() => classify(jar.group)}
                style={({ pressed }) => [styles.jar, stamp(lab, 4, jar.group === 'insecto' ? lab.amber : lab.cyan), pressed && pressedStyle]}
              >
                <View style={[styles.jarLid, { backgroundColor: lab.line }]} />
                <Text style={styles.jarEmoji}>{jar.emoji}</Text>
                <Text style={[styles.jarLabel, { color: lab.onBright }]}>{jar.label}</Text>
                <Text style={[styles.jarLegs, { color: lab.onBright }]}>{jar.legs}</Text>
              </Pressable>
            ))}
          </View>

          {result ? (
            <GameButton icon={<ArrowRightIcon color={lab.onBright} size={18} weight="bold" />} label={index + 1 < deck.length ? 'Siguiente muestra' : 'Ver resultado'} onPress={next} />
          ) : (
            <View style={[styles.hint, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
              <HandSwipeRightIcon color={lab.text} size={22} weight="duotone" />
              <Text style={[styles.hintText, { color: lab.text }]}>Arrastra el animal hasta un frasco o toca el frasco que elijas.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  missionArt: { fontSize: 44 },
  progress: { fontFamily: fonts.monoBold, fontSize: 11, marginBottom: 10 },
  stage: { minHeight: 190, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  specimen: { width: 150, height: 150, borderRadius: 26, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  specimenEmoji: { fontSize: 70 },
  specimenName: { fontFamily: fonts.display, fontSize: 18, marginTop: 2 },
  feedback: { alignSelf: 'stretch', borderRadius: 22, padding: 16, alignItems: 'center' },
  feedbackEmoji: { fontSize: 36 },
  feedbackTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, marginTop: 4, textAlign: 'center' },
  feedbackText: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: 'center' },
  jars: { flexDirection: 'row', gap: 14, marginTop: 16, marginBottom: 16 },
  jar: { flex: 1, minHeight: 138, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  jarLid: { position: 'absolute', top: -8, width: '54%', height: 12, borderRadius: 6 },
  jarEmoji: { fontSize: 34 },
  jarLabel: { fontFamily: fonts.monoBold, fontSize: 13, marginTop: 6 },
  jarLegs: { fontFamily: fonts.bodySemi, fontSize: 13, marginTop: 2 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  hintText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
});
