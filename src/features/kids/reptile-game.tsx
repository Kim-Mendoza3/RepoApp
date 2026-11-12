import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useAnimatedValue, useAnimatedValueXY, View } from 'react-native';

import { ArrowLeftIcon, HandSwipeRightIcon, StarIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { pressedStyle } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type FoodItem = { name: string; emoji: string; edible: boolean; color: string };

const foods: FoodItem[] = [
  { name: 'Ratón', emoji: '🐭', edible: true, color: '#A7F3D0' },
  { name: 'Pizza', emoji: '🍕', edible: false, color: '#FECDD3' },
  { name: 'Huevo', emoji: '🥚', edible: true, color: '#DBEAFE' },
  { name: 'Hamburguesa', emoji: '🍔', edible: false, color: '#FED7AA' },
  { name: 'Pollito', emoji: '🐣', edible: true, color: '#FEF08A' },
  { name: 'Papas fritas', emoji: '🍟', edible: false, color: '#FDE68A' },
];

const ROUND_MS = 8500;
const snakeSource = require('@/assets/images/serpiente-normal.png');
const habitatSource = require('@/assets/images/habitat-serpiente.jpg');

type ReptileGameProps = {
  onExit: () => void;
  /** Avisa cuando el dedo toma o suelta la comida, para que la pantalla congele su scroll. */
  onDraggingChange?: (dragging: boolean) => void;
};

/** Juego "Dibu y su merienda": arrastra cada comida hasta la serpiente si es algo que puede comer. */
export function ReptileGame({ onExit, onDraggingChange }: ReptileGameProps) {
  const lab = useLabColors();
  // Estilo "estampa" de laboratorio: borde grueso y sombra sólida.
  const stamp = { borderColor: lab.line, borderWidth: 2, shadowColor: lab.shadow, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 0 };
  const [foodIndex, setFoodIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const reactionScale = useAnimatedValue(1);
  const snakeMotion = useAnimatedValue(0);
  const foodDrop = useAnimatedValue(0);
  const foodPosition = useAnimatedValueXY({ x: 0, y: 0 });
  const currentFood = foods[foodIndex];

  // Dibu se balancea y cada ronda aparece una comida nueva.
  useEffect(() => {
    const snakeAnimation = Animated.loop(Animated.sequence([
      Animated.timing(snakeMotion, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(snakeMotion, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ]));
    snakeAnimation.start();
    const foodTimer = setInterval(() => {
      setFoodIndex((index) => (index + 1) % foods.length);
      setFeedback(null);
      foodPosition.setValue({ x: 0, y: 0 });
    }, ROUND_MS);
    return () => {
      snakeAnimation.stop();
      clearInterval(foodTimer);
    };
  }, [foodPosition, snakeMotion]);

  // La comida "cae" al inicio de cada ronda.
  useEffect(() => {
    foodDrop.setValue(0);
    Animated.timing(foodDrop, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [foodDrop, foodIndex]);

  const foodPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    // Una vez que el dedo toma la comida, no se la cedemos al scroll ni a otros gestos.
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      onDraggingChange?.(true);
      foodPosition.extractOffset();
      setFeedback(null);
    },
    onPanResponderMove: (_event, gestureState) => foodPosition.setValue({ x: gestureState.dx, y: gestureState.dy }),
    onPanResponderTerminate: () => {
      onDraggingChange?.(false);
      foodPosition.flattenOffset();
    },
    onPanResponderRelease: (_event, gestureState) => {
      onDraggingChange?.(false);
      foodPosition.flattenOffset();
      const reachedSnake = gestureState.dx > 55 && Math.abs(gestureState.dy) < 105;
      if (!reachedSnake) return;
      setFeedback(currentFood.edible ? 'correct' : 'wrong');
      if (currentFood.edible) setScore((value) => value + 1);
      reactionScale.setValue(0.82);
      Animated.sequence([
        Animated.spring(reactionScale, { toValue: 1.12, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.spring(reactionScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 5 }),
      ]).start();
    },
  }), [currentFood, foodPosition, reactionScale, onDraggingChange]);

  const correct = feedback === 'correct';

  return (
    <View>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onExit} style={({ pressed }) => [styles.backButton, stamp, { backgroundColor: lab.surface }, pressed && pressedStyle]}>
          <ArrowLeftIcon color={lab.text} size={18} weight="bold" />
          <Text style={[styles.backText, { color: lab.text }]}>Salir</Text>
        </Pressable>
        <View accessibilityLabel={`${score} aciertos`} style={[styles.scorePill, stamp, { backgroundColor: lab.amber }]}>
          <StarIcon color={lab.onBright} size={16} weight="fill" />
          <Text style={[styles.scoreText, { color: lab.onBright }]}>{score} aciertos</Text>
        </View>
      </View>
      <View style={[styles.header, stamp, { backgroundColor: lab.surface }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: lab.label }]}>{'// misión 01 · alimentar'}</Text>
          <Text style={[styles.headerTitle, { color: lab.text }]}>¿Qué puede comer?</Text>
          <Text style={[styles.headerText, { color: lab.muted }]}>Observa la comida y llévala hasta la serpiente.</Text>
        </View>
        <Image contentFit="contain" source={snakeSource} style={styles.headerSnake} />
      </View>
      <View style={[styles.scene, { borderColor: lab.line }]}>
        <Image contentFit="cover" pointerEvents="none" source={habitatSource} style={StyleSheet.absoluteFill} />
        <Text style={[styles.cloud, styles.cloudOne]}>☁️</Text>
        <Text style={[styles.cloud, styles.cloudTwo]}>☁️</Text>
        <Text style={styles.sun}>☀️</Text>
        <Text style={[styles.tree, styles.treeOne]}>🌳</Text>
        <Text style={[styles.tree, styles.treeTwo]}>🌴</Text>
        <Text style={styles.flowerOne}>🌼</Text>
        <Text style={styles.flowerTwo}>🌸</Text>
        <Text style={styles.grass}>🌿 🌱 🌿 🌱 🌿</Text>
        <Animated.View style={[styles.snakeCharacter, { transform: [{ translateY: snakeMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}>
          <Image contentFit="contain" source={snakeSource} style={styles.snakeImage} />
          <Text style={styles.snakeName}>Dibu</Text>
        </Animated.View>
        <Animated.View
          {...foodPanResponder.panHandlers}
          accessibilityLabel={`Comida: ${currentFood.name}. Arrástrala hasta Dibu.`}
          style={[styles.food, {
            backgroundColor: currentFood.color,
            opacity: foodDrop.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 1] }),
            transform: [...foodPosition.getTranslateTransform(), { translateY: foodDrop.interpolate({ inputRange: [0, 1], outputRange: [-170, 0] }) }],
          }]}
        >
          <Text style={styles.foodEmoji}>{currentFood.emoji}</Text>
        </Animated.View>
        <Animated.View style={[styles.reactionBubble, { transform: [{ scale: reactionScale }] }]}>
          <Text style={styles.reactionEmoji}>{feedback ? (correct ? '✨ ✅' : '❌') : '👀'}</Text>
        </Animated.View>
      </View>
      <View style={styles.roundRow}>
        <View>
          <Text style={[styles.roundLabel, { color: lab.label }]}>{'// apareció…'}</Text>
          <Text style={[styles.foodName, { color: lab.text }]}>{currentFood.name}</Text>
        </View>
        <Text style={[styles.foodTimer, { color: lab.muted }]}>nueva cada ronda</Text>
      </View>
      <View style={[styles.dragHint, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
        <HandSwipeRightIcon color={lab.text} size={24} weight="duotone" />
        <Text style={[styles.dragHintText, { color: lab.text }]}>Arrastra la comida por el hábitat y acércala a Dibu para alimentarlo.</Text>
      </View>
      {feedback && (
        <View style={[styles.feedbackCard, { backgroundColor: correct ? '#DCFCE7' : '#FFE4E6', borderColor: correct ? '#16A34A' : '#E11D48' }]}>
          <Text style={styles.feedbackEmoji}>{correct ? '🎉' : '🙅‍♀️'}</Text>
          <View style={styles.feedbackCopy}>
            <Text style={[styles.feedbackTitle, { color: correct ? '#166534' : '#BE123C' }]}>{correct ? '¡Muy bien!' : '¡Cuidado!'}</Text>
            <Text style={styles.feedbackText}>{correct ? 'Las serpientes sí pueden comer este alimento.' : 'La pizza y la comida rápida no son para las serpientes.'}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, borderRadius: 14, paddingHorizontal: 14 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, borderRadius: 999, paddingHorizontal: 12 },
  scoreText: { fontFamily: fonts.monoBold, fontSize: 12 },
  header: { minHeight: 120, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 12 },
  headerCopy: { flex: 1 },
  kicker: { fontFamily: fonts.monoBold, fontSize: 11 },
  headerTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, marginTop: 4 },
  headerText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginTop: 4 },
  headerSnake: { width: 82, height: 72, transform: [{ rotate: '-12deg' }] },
  scene: { height: 230, borderRadius: 22, borderWidth: 2, marginTop: 14, overflow: 'hidden', position: 'relative' },
  cloud: { position: 'absolute', fontSize: 25, opacity: 0.8 },
  cloudOne: { left: 80, top: 16 },
  cloudTwo: { left: 190, top: 42, transform: [{ scale: 0.75 }] },
  sun: { position: 'absolute', right: 20, top: 14, fontSize: 28 },
  tree: { position: 'absolute', fontSize: 58 },
  treeOne: { left: 12, top: 55 },
  treeTwo: { right: 8, top: 70, fontSize: 55 },
  flowerOne: { position: 'absolute', left: 65, bottom: 29, fontSize: 23 },
  flowerTwo: { position: 'absolute', right: 92, bottom: 26, fontSize: 22 },
  grass: { position: 'absolute', bottom: 5, left: 72, fontSize: 23, letterSpacing: 3 },
  food: { position: 'absolute', left: 26, bottom: 24, width: 68, height: 68, borderRadius: 24, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#14532D', shadowOpacity: 0.25, shadowRadius: 5, elevation: 4, zIndex: 4 },
  foodEmoji: { fontSize: 42 },
  snakeCharacter: { position: 'absolute', left: '42%', bottom: 25, alignItems: 'center' },
  snakeImage: { width: 158, height: 112, transform: [{ rotate: '-7deg' }] },
  snakeName: { backgroundColor: '#166534', borderRadius: 10, color: '#FFFFFF', fontFamily: fonts.monoBold, fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, marginTop: -14, overflow: 'hidden' },
  reactionBubble: { position: 'absolute', right: 63, bottom: 96, width: 58, height: 48, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FBBF24' },
  reactionEmoji: { fontSize: 22 },
  roundRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 8 },
  roundLabel: { fontFamily: fonts.monoBold, fontSize: 11 },
  foodName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, marginTop: 2 },
  foodTimer: { fontFamily: fonts.mono, fontSize: 11 },
  dragHint: { minHeight: 50, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 },
  dragHintText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  feedbackCard: { borderRadius: 18, borderWidth: 2, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  feedbackEmoji: { fontSize: 31 },
  feedbackCopy: { flex: 1 },
  feedbackTitle: { fontFamily: fonts.display, fontSize: 17 },
  feedbackText: { color: '#334155', fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
