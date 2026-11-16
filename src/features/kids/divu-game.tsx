import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  useAnimatedValueXY,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ArrowRightIcon, ConfettiIcon, HandSwipeRightIcon, HeartIcon, StarIcon, TimerIcon, TrashIcon, XCircleIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { Cloud, SavannaBackground, TRASH_LID, TRASH_RATIO, TrashCanBody, TrashCanLid } from '@/features/kids/divu-scene-art';
import { FoodArt, type FoodKind } from '@/features/kids/food-art';
import { GameButton, GameFinish, GameTopBar, MissionCard, stamp } from '@/features/kids/game-chrome';
import { useBackgroundMusic, useSfx } from '@/features/kids/sound';
import { pressedStyle } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type Food = { kind: FoodKind; name: string; edible: boolean; fact: string };
type Target = 'divu' | 'trash';
type Result = { outcome: 'correct' | 'wrong' | 'timeout'; target?: Target };

// Las serpientes son carnívoras y tragan a sus presas enteras: nada de comida procesada.
const foods: Food[] = [
  { kind: 'raton', name: 'Ratón', edible: true, fact: 'Los roedores son el alimento favorito de muchas serpientes: los tragan enteros.' },
  { kind: 'huevo', name: 'Huevo', edible: true, fact: 'Algunas serpientes comen huevos y los tragan completos, ¡con todo y cascarón!' },
  { kind: 'pollito', name: 'Pollito', edible: true, fact: 'Las aves pequeñas también forman parte de la dieta de muchas serpientes.' },
  { kind: 'pizza', name: 'Pizza', edible: false, fact: 'Las serpientes solo comen animales. La pizza podría enfermar a Divu.' },
  { kind: 'hamburguesa', name: 'Hamburguesa', edible: false, fact: 'La comida preparada para personas no es alimento para una serpiente.' },
  { kind: 'papas', name: 'Papas fritas', edible: false, fact: 'La sal y el aceite de las papas fritas le harían daño a Divu.' },
];

const ROUNDS = 8;
const ROUND_MS = 9000;
// Escenario vertical (3:4) para aprovechar la pantalla del teléfono; con tope para tabletas.
const SCENE_RATIO = 4 / 3;
const MAX_SCENE_HEIGHT = 560;
const FOOD_SIZE = 96;
const FOOD_TOP = 28;
const DIVU = { width: 184, height: 130, right: 0, bottom: 40 };
const TRASH = { size: 86, left: 14, bottom: 22 };

const divuSource = require('@/assets/images/serpiente-normal.png');
// Caras de Divu. Las tres imágenes están alineadas (el cuerpo ocupa los mismos píxeles):
// al cambiar de una a otra solo se mueve la cabeza.
type Face = 'normal' | 'happy' | 'disgust';
const faces: { face: Face; source: number; label: string }[] = [
  { face: 'normal', source: divuSource, label: 'Divu, la serpiente' },
  { face: 'happy', source: require('@/assets/images/divu-masticando.png'), label: 'Divu masticando feliz' },
  { face: 'disgust', source: require('@/assets/images/divu-disgustado.png'), label: 'Divu con cara de disgusto' },
];
const sounds = {
  music: require('@/assets/sounds/music-divu.wav'),
  pop: require('@/assets/sounds/pop.wav'),
  grab: require('@/assets/sounds/grab.wav'),
  chomp: require('@/assets/sounds/chomp.wav'),
  trash: require('@/assets/sounds/trash.wav'),
  lid: require('@/assets/sounds/lid.wav'),
  correct: require('@/assets/sounds/correct.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  timeout: require('@/assets/sounds/timeout.wav'),
  win: require('@/assets/sounds/win.wav'),
};

/** 8 comidas al azar: las 6 una vez y 2 repetidas, barajadas (Fisher-Yates). */
function makeDeck() {
  const list = [...foods, foods[Math.floor(Math.random() * foods.length)], foods[Math.floor(Math.random() * foods.length)]];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, ROUNDS);
}

type DivuGameProps = {
  /** Avisa cuando el dedo toma o suelta la comida, para congelar el scroll (necesario en iOS). */
  onDraggingChange?: (dragging: boolean) => void;
};

/**
 * Juego "Divu y su merienda": en cada ronda cae una comida. Si es algo que una serpiente come,
 * se arrastra hasta Divu; si no, al bote de basura. Hay tiempo límite por ronda.
 */
export function DivuGame({ onDraggingChange }: DivuGameProps) {
  const lab = useLabColors();
  const [deck, setDeck] = useState(makeDeck);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'drop' | 'play' | 'result'>('drop');
  const [result, setResult] = useState<Result | null>(null);
  const [sceneWidth, setSceneWidth] = useState(0);
  // Al caer al bote, la comida pasa DETRÁS del frente del bote para que se vea entrar por la boca.
  const [foodBehindTrash, setFoodBehindTrash] = useState(false);
  const sceneHeight = sceneWidth ? Math.min(sceneWidth * SCENE_RATIO, MAX_SCENE_HEIGHT) : 440;
  const finished = round >= ROUNDS;
  const food = deck[Math.min(round, ROUNDS - 1)];

  // Sonido
  useBackgroundMusic(sounds.music, 0.32);
  const playPop = useSfx(sounds.pop, 0.6);
  const playGrab = useSfx(sounds.grab, 0.5);
  const playChomp = useSfx(sounds.chomp, 0.9);
  const playTrash = useSfx(sounds.trash, 0.8);
  const playLid = useSfx(sounds.lid, 0.7);
  const playCorrect = useSfx(sounds.correct, 0.8);
  const playWrong = useSfx(sounds.wrong, 0.7);
  const playTimeout = useSfx(sounds.timeout, 0.7);
  const playWin = useSfx(sounds.win, 0.8);

  // Valores animados
  const position = useAnimatedValueXY({ x: 0, y: 0 });
  const drop = useAnimatedValue(0); // caída de la comida al iniciar la ronda
  const lift = useAnimatedValue(1); // la comida "se levanta" al tomarla
  const vanish = useAnimatedValue(1); // se encoge al entrar a Divu o al bote
  const bob = useAnimatedValue(0); // vaivén mientras espera
  const timer = useAnimatedValue(1); // barra de tiempo (1 → 0)
  const sway = useAnimatedValue(0); // Divu se balancea siempre
  const happy = useAnimatedValue(0); // salto de alegría
  const shake = useAnimatedValue(0); // Divu niega con la cabeza
  const sparkle = useAnimatedValue(0); // chispas de festejo
  // Opacidad de cada cara de Divu (se funden entre sí).
  const faceNormal = useAnimatedValue(1);
  const faceHappy = useAnimatedValue(0);
  const faceDisgust = useAnimatedValue(0);
  const [face, setFace] = useState<Face>('normal');

  /** Cambia la cara de Divu con un fundido suave. */
  const showFace = (next: Face) => {
    setFace(next);
    const to = (value: Animated.Value, visible: boolean) => Animated.timing(value, { toValue: visible ? 1 : 0, duration: 160, useNativeDriver: true });
    Animated.parallel([to(faceNormal, next === 'normal'), to(faceHappy, next === 'happy'), to(faceDisgust, next === 'disgust')]).start();
  };
  const faceOpacity: Record<Face, Animated.Value> = { normal: faceNormal, happy: faceHappy, disgust: faceDisgust };
  const cloudA = useAnimatedValue(0);
  const cloudB = useAnimatedValue(0);
  const resultIn = useAnimatedValue(0); // la tarjeta de resultado entra con un rebote
  const lidOpen = useAnimatedValue(0); // tapa del bote: 0 cerrada, 1 abierta
  const trashShake = useAnimatedValue(0); // sacudida del bote al recibir la comida
  const roundToken = useRef(0); // invalida temporizadores de rondas anteriores
  const lidIsOpen = useRef(false); // evita repetir la animación de la tapa en cada movimiento del dedo

  /** Abre o cierra la tapa del bote (solo si cambia de estado). */
  const setLid = (open: boolean) => {
    if (lidIsOpen.current === open) return;
    lidIsOpen.current = open;
    Animated.spring(lidOpen, { toValue: open ? 1 : 0, useNativeDriver: true, speed: open ? 22 : 16, bounciness: open ? 10 : 4 }).start();
  };

  // Animaciones de ambiente: Divu se balancea, la comida se mece y las nubes cruzan el cielo.
  useEffect(() => {
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.timing(cloudA, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.timing(cloudB, { toValue: 1, duration: 38000, easing: Easing.linear, useNativeDriver: true })),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [bob, cloudA, cloudB, sway]);

  // Inicio de cada ronda: la comida cae rebotando y arranca el reloj.
  useEffect(() => {
    if (finished) return;
    const token = roundToken.current + 1;
    roundToken.current = token;
    position.setValue({ x: 0, y: 0 });
    vanish.setValue(1);
    lift.setValue(1);
    drop.setValue(0);
    timer.setValue(1);
    lidIsOpen.current = false;
    lidOpen.setValue(0);
    playPop();
    Animated.spring(drop, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 12 }).start(() => {
      if (roundToken.current !== token) return;
      setPhase('play');
      Animated.timing(timer, { toValue: 0, duration: ROUND_MS, easing: Easing.linear, useNativeDriver: true }).start(({ finished: done }) => {
        if (!done || roundToken.current !== token) return;
        roundToken.current += 1;
        setResult({ outcome: 'timeout' });
        setPhase('result');
        playTimeout();
      });
    });
    // Solo debe correr al cambiar de ronda o reiniciar la partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deck]);

  // La tarjeta de resultado aparece con un pequeño rebote.
  useEffect(() => {
    if (phase !== 'result') return;
    resultIn.setValue(0);
    Animated.spring(resultIn, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [phase, resultIn]);

  // Música final al terminar la partida.
  useEffect(() => {
    if (finished) playWin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Centros (en el escenario) de la comida, Divu y el bote, para saber dónde se soltó.
  const foodCenter = { x: sceneWidth / 2, y: FOOD_TOP + FOOD_SIZE / 2 };
  const divuCenter = { x: sceneWidth - DIVU.right - DIVU.width * 0.55, y: sceneHeight - DIVU.bottom - DIVU.height * 0.5 };
  const trashCenter = { x: TRASH.left + TRASH.size / 2, y: sceneHeight - TRASH.bottom - TRASH.size * 0.55 };
  // Boca del bote (donde termina la tapa): ahí cae la comida.
  const trashHeight = TRASH.size * TRASH_RATIO;
  const trashMouth = { x: TRASH.left + TRASH.size / 2, y: sceneHeight - TRASH.bottom - trashHeight + (trashHeight * 35) / 115 };

  /** La comida entra al bote: se abre la tapa, cae adentro, el bote se sacude y la tapa se cierra. */
  const dropIntoTrash = () => {
    setLid(true);
    const offset = (point: { x: number; y: number }) => ({ x: point.x - foodCenter.x, y: point.y - foodCenter.y });
    Animated.sequence([
      // Sube un poco sobre la boca del bote…
      Animated.timing(position, { toValue: offset({ x: trashMouth.x, y: trashMouth.y - 34 }), duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      // …y cae adentro mientras se encoge.
      Animated.parallel([
        Animated.timing(position, { toValue: offset({ x: trashMouth.x, y: trashMouth.y + 12 }), duration: 190, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(vanish, { toValue: 0, duration: 190, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
    setTimeout(() => setFoodBehindTrash(true), 200); // empieza a caer: ya va dentro del bote
    setTimeout(playTrash, 300);
    // El golpe sacude el bote y después se cierra la tapa.
    setTimeout(() => {
      trashShake.setValue(0);
      Animated.sequence([
        Animated.timing(trashShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: 0.6, duration: 80, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start(() => {
        setLid(false);
        setTimeout(playLid, 120);
      });
    }, 390);
  };

  const resolve = (target: Target) => {
    if (phase !== 'play' || !food) return;
    roundToken.current += 1; // detiene el reloj de esta ronda
    timer.stopAnimation();
    const correct = (target === 'divu') === food.edible;

    if (target === 'divu') {
      // La comida vuela hasta Divu y se encoge.
      Animated.parallel([
        Animated.timing(position, { toValue: { x: divuCenter.x - foodCenter.x, y: divuCenter.y - foodCenter.y }, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(vanish, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
      playChomp();
    } else {
      dropIntoTrash();
    }

    setTimeout(() => {
      if (correct) {
        playCorrect();
        setScore((value) => value + 1);
        sparkle.setValue(0);
        Animated.timing(sparkle, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        happy.setValue(0);
        Animated.sequence([
          Animated.spring(happy, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
          Animated.spring(happy, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
        ]).start();
      } else {
        playWrong();
        shake.setValue(0);
        Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: 110, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
      }
      // Masticando si comió algo bueno; disgustado si le diste chatarra o tiraste su comida.
      showFace(!correct ? 'disgust' : target === 'divu' ? 'happy' : 'normal');
      setResult({ outcome: correct ? 'correct' : 'wrong', target });
      setPhase('result');
    }, target === 'divu' ? 280 : 480);
  };

  const next = () => {
    showFace('normal');
    setFoodBehindTrash(false);
    setResult(null);
    setPhase('drop');
    setRound((value) => value + 1);
  };

  const restart = () => {
    showFace('normal');
    setFoodBehindTrash(false);
    setScore(0);
    setResult(null);
    setPhase('drop');
    setRound(0);
    setDeck(makeDeck());
  };

  // roundToken (un ref) solo se lee dentro de los manejadores del gesto, nunca al dibujar:
  // el aviso de react-hooks/refs aquí es un falso positivo.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => phase === 'play',
    onMoveShouldSetPanResponder: () => phase === 'play',
    // Una vez que el dedo toma la comida, no se la cedemos al scroll ni a otros gestos.
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      onDraggingChange?.(true);
      playGrab();
      Animated.spring(lift, { toValue: 1.18, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
    },
    onPanResponderMove: (_event, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      // La tapa se abre cuando la comida se acerca al bote y se cierra si se aleja.
      const x = foodCenter.x + gesture.dx;
      const y = foodCenter.y + gesture.dy;
      setLid(Math.hypot(x - trashMouth.x, y - trashMouth.y) < 125);
    },
    onPanResponderRelease: (_event, gesture) => {
      onDraggingChange?.(false);
      Animated.spring(lift, { toValue: 1, useNativeDriver: true }).start();
      const x = foodCenter.x + gesture.dx;
      const y = foodCenter.y + gesture.dy;
      if (Math.hypot(x - divuCenter.x, y - divuCenter.y) < 88) return resolve('divu');
      if (Math.hypot(x - trashCenter.x, y - trashCenter.y) < 80) return resolve('trash');
      setLid(false);
      Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, speed: 16, bounciness: 9 }).start();
    },
    onPanResponderTerminate: () => {
      onDraggingChange?.(false);
      setLid(false);
      Animated.spring(lift, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
    // `resolve` usa la ronda y el tamaño actuales; el responder se vuelve a crear cuando cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [phase, food, sceneWidth, onDraggingChange]);

  if (finished) {
    return (
      <View>
        <GameTopBar score={score} total={ROUNDS} />
        <GameFinish
          title={score === ROUNDS ? '¡Divu está feliz y sano!' : '¡Merienda terminada!'}
          text={`Acertaste ${score} de ${ROUNDS}. Recuerda: las serpientes solo comen animales, como ratones, huevos y aves pequeñas.`}
          onRestart={restart}
        />
      </View>
    );
  }

  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [-150, 0] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const bobRotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  const swayY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const happyY = happy.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const happyScale = happy.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const shakeRotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const cloudAX = cloudA.interpolate({ inputRange: [0, 1], outputRange: [-110, Math.max(sceneWidth, 300) + 20] });
  const cloudBX = cloudB.interpolate({ inputRange: [0, 1], outputRange: [Math.max(sceneWidth, 300) * 0.4, Math.max(sceneWidth, 300) * 1.4] });
  const sparkleScale = sparkle.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.1, 0.6] });
  const sparkleOpacity = sparkle.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const plusY = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, -46] });
  const resultScale = resultIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const lidRotate = lidOpen.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-62deg'] });
  const trashShakeRotate = trashShake.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  const outcome = result?.outcome;
  const feedback = outcome === 'correct'
    ? { title: result?.target === 'divu' ? '¡Ñam! Divu lo disfrutó' : '¡Bien! Eso no era para Divu', color: lab.lime, Icon: ConfettiIcon }
    : outcome === 'wrong'
      ? { title: result?.target === 'divu' ? '¡Uy! Eso no es comida para Divu' : '¡Divu sí podía comer eso!', color: lab.pink, Icon: XCircleIcon }
      : { title: '¡Se acabó el tiempo!', color: lab.amber, Icon: TimerIcon };

  return (
    <View>
      <GameTopBar score={score} total={ROUNDS} />
      <MissionCard
        label="// misión 01 · alimentar"
        title="¿Qué puede comer Divu?"
        text="Divu es una pitón bola y vive en la sabana africana. Llévale lo que come una serpiente; lo demás, ¡al bote!"
        art={<Image contentFit="contain" source={divuSource} style={styles.missionSnake} />}
      />

      {/* Ronda y tiempo (arriba del escenario para verlos mientras se juega) */}
      <View style={styles.roundRow}>
        <View style={styles.roundCopy}>
          <Text style={[styles.roundLabel, { color: lab.label }]}>{`// comida ${round + 1} de ${ROUNDS}`}</Text>
          <Text style={[styles.foodName, { color: lab.text }]}>{food?.name}</Text>
        </View>
        <View style={[styles.timerTrack, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
          <Animated.View style={[styles.timerFill, { backgroundColor: lab.cyan, transform: [{ scaleX: timer }] }]} />
        </View>
      </View>

      {/* ESCENARIO */}
      <View onLayout={(event: LayoutChangeEvent) => setSceneWidth(event.nativeEvent.layout.width)} style={[styles.scene, { height: sceneHeight, borderColor: lab.line }]}>
        <SavannaBackground />
        <Animated.View pointerEvents="none" style={[styles.cloud, { top: 10, transform: [{ translateX: cloudAX }] }]}><Cloud width={96} /></Animated.View>
        <Animated.View pointerEvents="none" style={[styles.cloud, { top: 46, opacity: 0.8, transform: [{ translateX: cloudBX }, { scale: 0.7 }] }]}><Cloud width={96} /></Animated.View>

        {/* Bote de basura */}
        <Animated.View pointerEvents="none" style={[styles.trash, { left: TRASH.left, bottom: TRASH.bottom, transform: [{ rotate: trashShakeRotate }] }]}>
          <TrashCanBody size={TRASH.size} />
          {/* La tapa gira desde su bisagra (lado izquierdo). */}
          <Animated.View
            style={[styles.trashLid, {
              top: (TRASH.size * TRASH_LID.top) / 100,
              transformOrigin: [(TRASH.size * TRASH_LID.hingeX) / 100, (TRASH.size * (TRASH_LID.hingeY - TRASH_LID.top)) / 100, 0],
              transform: [{ rotate: lidRotate }],
            }]}
          >
            <TrashCanLid size={TRASH.size} />
          </Animated.View>
        </Animated.View>

        {/* Divu */}
        <Animated.View
          pointerEvents="none"
          style={[styles.divu, { right: DIVU.right, bottom: DIVU.bottom, transform: [{ translateY: swayY }, { translateY: happyY }, { scale: happyScale }, { rotate: shakeRotate }] }]}
        >
          {/* Las tres caras están cargadas y encimadas; solo cambia cuál se ve. */}
          <View accessibilityLabel={faces.find((item) => item.face === face)?.label} style={{ width: DIVU.width, height: DIVU.height }}>
            {faces.map((item) => (
              <Animated.View key={item.face} style={[StyleSheet.absoluteFill, { opacity: faceOpacity[item.face] }]}>
                <Image contentFit="contain" source={item.source} style={StyleSheet.absoluteFill} />
              </Animated.View>
            ))}
          </View>
          <Text style={styles.divuName}>Divu</Text>
        </Animated.View>

        {/* Chispas y "+1" al acertar */}
        {sceneWidth > 0 ? (
          <View pointerEvents="none" style={[styles.sparkles, { left: divuCenter.x - 60, top: divuCenter.y - 70 }]}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i / 8) * Math.PI * 2;
              const distance = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, 54] });
              return (
                <Animated.View
                  key={i}
                  style={[styles.sparkle, {
                    opacity: sparkleOpacity,
                    transform: [
                      { translateX: Animated.multiply(distance, Math.cos(angle)) },
                      { translateY: Animated.multiply(distance, Math.sin(angle)) },
                      { scale: sparkleScale },
                    ],
                  }]}
                >
                  <StarIcon color={i % 2 ? '#FFD54F' : '#FFFFFF'} size={18} weight="fill" />
                </Animated.View>
              );
            })}
            <Animated.Text style={[styles.plusOne, { opacity: sparkleOpacity, transform: [{ translateY: plusY }] }]}>+1</Animated.Text>
          </View>
        ) : null}

        {/* Comida */}
        {phase !== 'result' && food ? (
          <Animated.View
            {...panResponder.panHandlers}
            accessibilityHint="Arrástrala hasta Divu o al bote de basura, o usa los botones de abajo"
            accessibilityLabel={`Comida: ${food.name}`}
            style={[styles.food, foodBehindTrash && styles.foodBehind, {
              left: sceneWidth / 2 - FOOD_SIZE / 2,
              opacity: vanish,
              transform: [
                ...position.getTranslateTransform(),
                { translateY: dropY },
                { translateY: bobY },
                { rotate: bobRotate },
                { scale: Animated.multiply(lift, vanish) },
              ],
            }]}
          >
            <FoodArt kind={food.kind} size={FOOD_SIZE} />
          </Animated.View>
        ) : null}

        {/* Resultado DENTRO del escenario (sobre el cielo), para que no quede fuera de la pantalla. */}
        {phase === 'result' && result && food ? (
          <Animated.View style={[styles.resultOverlay, { opacity: resultIn, transform: [{ scale: resultScale }] }]}>
            <View style={[styles.feedback, stamp(lab, 5, feedback.color)]}>
              <feedback.Icon color={lab.onBright} size={30} weight="duotone" />
              <View style={styles.feedbackCopy}>
                <Text style={[styles.feedbackTitle, { color: lab.onBright }]}>{feedback.title}</Text>
                <Text style={[styles.feedbackText, { color: lab.onBright }]}>{`${food.name}: ${food.fact}`}</Text>
              </View>
            </View>
            <GameButton icon={<ArrowRightIcon color={lab.onBright} size={18} weight="bold" />} label={round + 1 < ROUNDS ? 'Siguiente comida' : 'Ver resultado'} onPress={next} />
          </Animated.View>
        ) : null}
      </View>

      {phase === 'result' ? null : (
        <>
          {/* Alternativa con botones (accesibilidad y quien prefiera tocar en vez de arrastrar). */}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={phase !== 'play'}
              onPress={() => resolve('divu')}
              style={({ pressed }) => [styles.action, stamp(lab, 4, lab.lime), phase !== 'play' && styles.disabled, pressed && pressedStyle]}
            >
              <HeartIcon color={lab.onBright} size={20} weight="fill" />
              <Text style={[styles.actionText, { color: lab.onBright }]}>Dar a Divu</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={phase !== 'play'}
              onPress={() => resolve('trash')}
              style={({ pressed }) => [styles.action, stamp(lab, 4, lab.pink), phase !== 'play' && styles.disabled, pressed && pressedStyle]}
            >
              <TrashIcon color={lab.onBright} size={20} weight="fill" />
              <Text style={[styles.actionText, { color: lab.onBright }]}>Al bote</Text>
            </Pressable>
          </View>
          <View style={[styles.hint, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
            <HandSwipeRightIcon color={lab.text} size={22} weight="duotone" />
            <Text style={[styles.hintText, { color: lab.text }]}>Arrastra la comida hasta Divu o al bote antes de que se acabe el tiempo.</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  missionSnake: { width: 82, height: 72, transform: [{ rotate: '-12deg' }] },
  scene: { borderRadius: 22, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  cloud: { position: 'absolute', left: 0 },
  trash: { position: 'absolute', transformOrigin: 'bottom', zIndex: 5 },
  trashLid: { position: 'absolute', left: 0 },
  divu: { position: 'absolute', alignItems: 'center' },
  divuName: { backgroundColor: '#166534', borderRadius: 10, color: '#FFFFFF', fontFamily: fonts.monoBold, fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, marginTop: -16, overflow: 'hidden' },
  sparkles: { position: 'absolute', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute' },
  plusOne: { position: 'absolute', color: '#FFFFFF', fontFamily: fonts.display, fontSize: 26, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  food: { position: 'absolute', top: FOOD_TOP, width: FOOD_SIZE, height: FOOD_SIZE, zIndex: 10 },
  foodBehind: { zIndex: 2 },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  resultOverlay: { position: 'absolute', top: 14, left: 12, right: 12, zIndex: 20 },
  roundCopy: { flexShrink: 1 },
  roundLabel: { fontFamily: fonts.monoBold, fontSize: 11 },
  foodName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, marginTop: 2 },
  timerTrack: { flex: 1, height: 14, borderRadius: 7, borderWidth: 2, overflow: 'hidden' },
  timerFill: { flex: 1, transformOrigin: 'left' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 12 },
  action: { flex: 1, minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  disabled: { opacity: 0.5 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  hintText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, marginBottom: 12 },
  feedbackCopy: { flex: 1 },
  feedbackTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  feedbackText: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
