import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useAnimatedValue, useAnimatedValueXY, View } from 'react-native';

import { useColors } from '@/context/theme-context';

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

/** Juego "Dibu y su merienda": arrastra cada comida hasta la serpiente si es algo que puede comer. */
export function ReptileGame({ onExit }: { onExit: () => void }) {
  const colors = useColors();
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
      foodPosition.extractOffset();
      setFeedback(null);
    },
    onPanResponderMove: (_event, gestureState) => foodPosition.setValue({ x: gestureState.dx, y: gestureState.dy }),
    onPanResponderRelease: (_event, gestureState) => {
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
  }), [currentFood, foodPosition, reactionScale]);

  const correct = feedback === 'correct';

  return (
    <View>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.backButton}>
          <MaterialCommunityIcons color={colors.text} name="arrow-left" size={20} />
          <Text style={[styles.backText, { color: colors.text }]}>Salir</Text>
        </Pressable>
        <View style={styles.scorePill}><Text style={styles.scoreEmoji}>⭐</Text><Text style={styles.scoreText}>{score} aciertos</Text></View>
      </View>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>MISIÓN: ALIMENTAR</Text>
          <Text style={styles.headerTitle}>¿Qué puede comer?</Text>
          <Text style={styles.headerText}>Observa la comida y llévala hasta la serpiente.</Text>
        </View>
        <Image contentFit="contain" source={snakeSource} style={styles.headerSnake} />
      </View>
      <View style={styles.scene}>
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
          <Text style={[styles.roundLabel, { color: colors.green }]}>APARECIÓ...</Text>
          <Text style={[styles.foodName, { color: colors.text }]}>{currentFood.name}</Text>
        </View>
        <Text style={styles.foodTimer}>⏱️ Cada ronda</Text>
      </View>
      <View style={styles.dragHint}>
        <MaterialCommunityIcons color="#F97316" name="gesture-swipe" size={24} />
        <Text style={styles.dragHintText}>Arrastra la comida por todo el hábitat. Acércala a Dibu para alimentarlo.</Text>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '800' },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: '#FEF3C7' },
  scoreEmoji: { fontSize: 16 },
  scoreText: { color: '#92400E', fontSize: 12, fontWeight: '900' },
  // Fondo verde oscuro para que el texto claro del encabezado tenga contraste.
  header: { minHeight: 126, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 14, backgroundColor: '#166534' },
  headerCopy: { flex: 1 },
  kicker: { color: '#BBF7D0', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  headerTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 4 },
  headerText: { color: '#DCFCE7', fontSize: 12, lineHeight: 17, marginTop: 5 },
  headerSnake: { width: 82, height: 72, transform: [{ rotate: '-12deg' }] },
  scene: { height: 230, borderRadius: 24, borderWidth: 2, marginTop: 14, overflow: 'hidden', position: 'relative' },
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
  snakeName: { backgroundColor: '#166534', borderRadius: 10, color: '#FFFFFF', fontSize: 11, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, marginTop: -14 },
  reactionBubble: { position: 'absolute', right: 63, bottom: 96, width: 58, height: 48, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FBBF24' },
  reactionEmoji: { fontSize: 22 },
  roundRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 8 },
  roundLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  foodName: { fontSize: 21, fontWeight: '900', marginTop: 2 },
  foodTimer: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  dragHint: { minHeight: 47, borderRadius: 15, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  dragHintText: { color: '#9A3412', fontSize: 13, fontWeight: '900' },
  feedbackCard: { borderRadius: 18, borderWidth: 2, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  feedbackEmoji: { fontSize: 31 },
  feedbackCopy: { flex: 1 },
  feedbackTitle: { fontSize: 16, fontWeight: '900' },
  feedbackText: { color: '#334155', fontSize: 12, lineHeight: 17, marginTop: 2 },
});
