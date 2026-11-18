import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  useAnimatedValueXY,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { ArrowRightIcon, ConfettiIcon, HandTapIcon, StarIcon, TimerIcon, XCircleIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { Cloud, SavannaBackground, TRASH_LID, TRASH_RATIO, TrashCanBody, TrashCanLid } from '@/features/kids/divu-scene-art';
import { FoodArt, type FoodKind } from '@/features/kids/food-art';
import { GameButton, GameFinish, GameTopBar, stamp } from '@/features/kids/game-chrome';
import { useBackgroundMusic, useSfx } from '@/features/kids/sound';
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
// El escenario ocupa TODO el alto que quede libre en la pantalla (los Android suelen ser más
// alargados que los iPhone), con un mínimo para pantallas muy bajas y un tope para tabletas.
const MIN_SCENE_HEIGHT = 380;
const MAX_SCENE_HEIGHT = 700;
const FOOD_SIZE = 96;
const FOOD_TOP = 28;
const DIVU = { width: 184, height: 130, right: 0, bottom: 40 };
const TRASH = { size: 86, left: 14, bottom: 22 };

// Lo que dice Divu en su burbuja al empezar (se avanza tocando en cualquier parte).
const INTRO = [
  '¡Hola! Soy Divu, una pitón bola de la sabana africana… ¡y tengo mucha hambre!',
  'Arrastra con tu dedo hasta mí la comida que puede comer una serpiente.',
  'Si no es comida para serpiente, ¡llévala al bote de basura!',
  'Hazlo antes de que se acabe el tiempo. ¿Me ayudas?',
];
const CHEER = '¡Más comida, por favor!';

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
  chew: require('@/assets/sounds/chew.wav'),
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
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const sceneWidth = scene.width;
  // Burbuja de Divu: primero las instrucciones (introStep), luego un ánimo breve al reiniciar.
  const [introStep, setIntroStep] = useState(0);
  const started = introStep >= INTRO.length;
  const [cheer, setCheer] = useState(false);
  // Al caer al bote, la comida pasa DETRÁS del frente del bote para que se vea entrar por la boca.
  const [foodBehindTrash, setFoodBehindTrash] = useState(false);
  const sceneHeight = scene.height || 440;
  const finished = round >= ROUNDS;
  const food = deck[Math.min(round, ROUNDS - 1)];

  // Sonido
  useBackgroundMusic(sounds.music, 0.32, !finished); // se apaga al terminar, antes de la fanfarria
  const playPop = useSfx(sounds.pop, 0.6);
  const playGrab = useSfx(sounds.grab, 0.5);
  const playChew = useSfx(sounds.chew, 0.85);
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
  const bubbleIn = useAnimatedValue(1); // la burbuja de Divu "salta" al cambiar de texto
  const lidOpen = useAnimatedValue(0); // tapa del bote: 0 cerrada, 1 abierta
  const trashShake = useAnimatedValue(0); // sacudida del bote al recibir la comida
  const roundToken = useRef(0); // invalida temporizadores de rondas anteriores
  const lidIsOpen = useRef(false); // evita repetir la animación de la tapa en cada movimiento del dedo
  // Últimas posiciones del dedo (con su hora), para calcular hacia dónde y qué tan rápido
  // iba al soltar: el gesto reporta velocidad 0 si el dedo se detuvo un instante antes.
  const dragTrail = useRef<{ t: number; x: number; y: number }[]>([]);

  /** Abre o cierra la tapa. Al cerrar cae con fuerza; `onShut` se llama justo cuando golpea el bote. */
  const setLid = (open: boolean, onShut?: () => void) => {
    if (lidIsOpen.current === open) return;
    lidIsOpen.current = open;
    if (open) {
      Animated.spring(lidOpen, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }).start();
      return;
    }
    // Cae acelerando (como por gravedad), golpea y rebota un poquito.
    Animated.timing(lidOpen, { toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      onShut?.();
      Animated.sequence([
        Animated.timing(lidOpen, { toValue: 0.07, duration: 55, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(lidOpen, { toValue: 0, duration: 75, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
    });
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
    if (finished || !started) return;
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
    // Se puede arrastrar en cuanto el rebote ya no se nota (~0,4 s): con los umbrales por defecto,
    // el resorte esperaba a quedar perfectamente quieto y la comida no respondía al tocarla.
    Animated.spring(drop, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 12, restDisplacementThreshold: 0.02, restSpeedThreshold: 0.2 }).start(() => {
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
    // Solo debe correr al cambiar de ronda, reiniciar la partida o terminar la introducción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deck, started]);

  // Cada texto nuevo de la burbuja entra con un pequeño salto.
  useEffect(() => {
    bubbleIn.setValue(0.6);
    Animated.spring(bubbleIn, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  }, [bubbleIn, introStep, cheer]);

  /** Toque en cualquier parte durante la introducción: siguiente mensaje (o empieza el juego). */
  const advanceIntro = () => {
    if (introStep < INTRO.length - 1) return setIntroStep((step) => step + 1);
    Animated.timing(bubbleIn, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setIntroStep(INTRO.length));
  };

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
    // Cuando la comida toca el fondo (fin de la caída, 200 + 190 ms): suena el golpe y el bote se sacude.
    setTimeout(() => {
      playTrash();
      trashShake.setValue(0);
      Animated.sequence([
        Animated.timing(trashShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: 0.6, duration: 80, useNativeDriver: true }),
        Animated.timing(trashShake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start(() => setLid(false, playLid)); // el "clanc" suena justo cuando la tapa golpea
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
      // Solo mastica si la acepta (algo que sí come); la chatarra la rechaza con cara de disgusto.
      if (food.edible) setTimeout(playChew, 270); // junto con su cara de masticar (cambia a los 280 ms)
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
    // Divu pide más comida en su burbuja, que se desvanece sola (sin detener el juego).
    setCheer(true);
    setTimeout(() => {
      Animated.timing(bubbleIn, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setCheer(false));
    }, 1800);
  };

  /** La comida regresa a su lugar (se soltó lejos o el gesto se canceló). */
  const returnFood = () => {
    setLid(false);
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, speed: 16, bounciness: 9 }).start();
  };

  // Arrastre con react-native-gesture-handler: el gesto se reconoce en el lado nativo desde que
  // el dedo toca la comida. Con PanResponder (JavaScript), en Android un arrastre rápido se lo
  // "robaba" el scroll de la pantalla antes de que JavaScript alcanzara a reclamarlo.
  const pan = usePanGesture({
    enabled: phase === 'play' && !!food,
    minDistance: 0, // se activa al tocar, sin esperar a que el dedo se mueva
    runOnJS: true, // los callbacks corren en JavaScript (usan estado y sonidos del juego)
    disableReanimated: true,
    onActivate: () => {
      dragTrail.current = [];
      onDraggingChange?.(true);
      playGrab();
      Animated.spring(lift, { toValue: 1.18, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
    },
    onUpdate: (event) => {
      position.setValue({ x: event.translationX, y: event.translationY });
      const now = Date.now();
      dragTrail.current = [...dragTrail.current.filter((point) => now - point.t < 160), { t: now, x: event.translationX, y: event.translationY }];
      // La tapa se abre cuando la comida se acerca al bote y se cierra si se aleja.
      const x = foodCenter.x + event.translationX;
      const y = foodCenter.y + event.translationY;
      setLid(Math.hypot(x - trashMouth.x, y - trashMouth.y) < 125);
    },
    onDeactivate: (event) => {
      onDraggingChange?.(false);
      Animated.spring(lift, { toValue: 1, useNativeDriver: true }).start();
      if (event.canceled) return returnFood();
      const x = foodCenter.x + event.translationX;
      const y = foodCenter.y + event.translationY;
      const targetAt = (px: number, py: number): Target | null => {
        if (Math.hypot(px - divuCenter.x, py - divuCenter.y) < 92) return 'divu';
        if (Math.hypot(px - trashCenter.x, py - trashCenter.y) < 84) return 'trash';
        return null;
      };
      // Si la tapa ya se abrió (la comida está cerca de la boca), soltarla ahí también cuenta.
      let target = targetAt(x, y) ?? (lidIsOpen.current ? 'trash' : null);
      // Lanzamiento rápido: el niño suelta ANTES de llegar. Seguimos la dirección y velocidad
      // del dedo hasta 0,25 s, en pasos pequeños (de máximo ~15 px) para no "saltarnos" el blanco.
      // Velocidad = distancia recorrida en los últimos ~80 ms (ignorando la pausa final del dedo).
      const trail = dragTrail.current;
      const last = trail[trail.length - 1];
      const moving = last ? trail.filter((point) => point.x !== last.x || point.y !== last.y) : [];
      const from = moving.find((point) => last.t - point.t <= 120) ?? moving[moving.length - 1];
      const velocity = from && last && last.t > from.t
        ? { x: ((last.x - from.x) * 1000) / (last.t - from.t), y: ((last.y - from.y) * 1000) / (last.t - from.t) }
        : { x: event.velocityX, y: event.velocityY };
      const speed = Math.hypot(velocity.x, velocity.y);
      if (!target && speed > 300) {
        const step = Math.min(0.01, 15 / speed);
        for (let seconds = step; seconds <= 0.25 && !target; seconds += step) {
          target = targetAt(x + velocity.x * seconds, y + velocity.y * seconds);
        }
      }
      if (target) return resolve(target);
      returnFood();
    },
  });

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

  const bubbleText = !started ? INTRO[introStep] : cheer ? CHEER : null;

  return (
    <View style={styles.root}>
      <GameTopBar score={score} total={ROUNDS} />

      {/* Ronda y tiempo (arriba del escenario para verlos mientras se juega) */}
      <View style={styles.roundRow}>
        <View style={styles.roundCopy}>
          <Text style={[styles.roundLabel, { color: lab.label }]}>{`// comida ${round + 1} de ${ROUNDS}`}</Text>
          <Text style={[styles.foodName, { color: lab.text }]}>{started ? food?.name : '¡A comer!'}</Text>
        </View>
        <View style={[styles.timerTrack, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
          <Animated.View style={[styles.timerFill, { backgroundColor: lab.cyan, transform: [{ scaleX: timer }] }]} />
        </View>
      </View>

      {/* ESCENARIO */}
      <View
        onLayout={(event: LayoutChangeEvent) => setScene({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        style={[styles.scene, { borderColor: lab.line }]}
      >
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
        {started && phase !== 'result' && food ? (
          <GestureDetector gesture={pan}>
            <Animated.View
              // Sin botones en pantalla: quien usa lector de pantalla tiene estas dos acciones.
              accessibilityActions={[{ name: 'divu', label: 'Dar a Divu' }, { name: 'trash', label: 'Tirar al bote' }]}
              accessibilityHint="Arrástrala hasta Divu o al bote de basura"
              accessibilityLabel={`Comida: ${food.name}`}
              onAccessibilityAction={(event) => {
                if (phase === 'play') resolve(event.nativeEvent.actionName === 'divu' ? 'divu' : 'trash');
              }}
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
          </GestureDetector>
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

        {/* Burbuja de diálogo de Divu (arriba de su cabeza). */}
        {bubbleText ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.bubble, stamp(lab, 4), {
              bottom: DIVU.bottom + DIVU.height - 4,
              maxWidth: Math.min(sceneWidth - 32, 320),
              opacity: bubbleIn.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
              transform: [{ scale: bubbleIn }],
            }]}
          >
            <Text style={[styles.bubbleText, { color: lab.text }]}>{bubbleText}</Text>
            {!started ? (
              <View style={styles.bubbleFooter}>
                <HandTapIcon color={lab.label} size={16} weight="duotone" />
                <Text style={[styles.bubbleHint, { color: lab.label }]}>
                  {introStep < INTRO.length - 1 ? `Toca para continuar · ${introStep + 1}/${INTRO.length}` : 'Toca para empezar'}
                </Text>
              </View>
            ) : null}
            {/* Piquito de la burbuja, apuntando a la cabeza de Divu. */}
            <View style={[styles.bubbleTail, { backgroundColor: lab.surface, borderColor: lab.line }]} />
          </Animated.View>
        ) : null}
      </View>

      {/* Durante la introducción, tocar EN CUALQUIER PARTE (bajo la barra superior) avanza el diálogo. */}
      {!started ? (
        <Pressable
          accessibilityHint={introStep < INTRO.length - 1 ? 'Toca para continuar' : 'Toca para empezar a jugar'}
          accessibilityLabel={`Divu dice: ${INTRO[introStep]}`}
          accessibilityRole="button"
          onPress={advanceIntro}
          style={styles.introCatcher}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scene: { flex: 1, minHeight: MIN_SCENE_HEIGHT, maxHeight: MAX_SCENE_HEIGHT, borderRadius: 22, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  // Cubre todo menos la barra superior (Salir y sonido siguen funcionando).
  introCatcher: { position: 'absolute', top: 64, left: 0, right: 0, bottom: 0, zIndex: 30 },
  bubble: { position: 'absolute', right: 14, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, zIndex: 25 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bubbleHint: { fontFamily: fonts.monoBold, fontSize: 11 },
  bubbleTail: { position: 'absolute', bottom: -9, right: 104, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }] },
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
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, marginBottom: 12 },
  feedbackCopy: { flex: 1 },
  feedbackTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  feedbackText: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
