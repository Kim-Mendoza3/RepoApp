import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useAnimatedValue, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { Line } from 'react-native-svg';

import { ArrowRightIcon, ShootingStarIcon, TimerIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { DivuAccessory } from '@/features/kids/divu-accessories';
import { GameButton, GameFinish, GameTopBar, stamp } from '@/features/kids/game-chrome';
import { Hearts, LIVES, livesLeftText, progressiveMs, SpeechBubble } from '@/features/kids/game-kit';
import { useBackgroundMusic, useSfx } from '@/features/kids/sound';
import { ConstellationChart, NightSkyBackground, type StarPoint } from '@/features/kids/star-art';
import { fonts } from '@/theme/fonts';

type Constellation = {
  name: string;
  fact: string;
  /** Posición de cada estrella en el cielo (0 a 1 de ancho y alto del área de juego). */
  stars: StarPoint[];
  /** Orden del trazo. `null` = levantar el dedo (la siguiente estrella no se une con la anterior). */
  path: (number | null)[];
  /** Cuántas estrellas "falsas" (que no son parte de la figura) hay en el cielo. */
  decoys: number;
};

// Formas simplificadas, de la más fácil a la más difícil.
const constellations: Constellation[] = [
  {
    name: 'Casiopea',
    fact: 'Tiene forma de W (o de M, según la hora). Ayuda a encontrar la Estrella Polar.',
    stars: [{ x: 0.06, y: 0.32 }, { x: 0.28, y: 0.66 }, { x: 0.5, y: 0.4 }, { x: 0.72, y: 0.7 }, { x: 0.94, y: 0.3 }],
    path: [0, 1, 2, 3, 4],
    decoys: 4,
  },
  {
    name: 'Cruz del Sur',
    fact: 'Es la constelación más pequeña de todo el cielo y sirve para ubicar el sur.',
    stars: [{ x: 0.5, y: 0.08 }, { x: 0.54, y: 0.92 }, { x: 0.16, y: 0.44 }, { x: 0.86, y: 0.52 }],
    path: [0, 1, null, 2, 3],
    decoys: 5,
  },
  {
    name: 'Osa Mayor',
    fact: 'Siete de sus estrellas forman "el Carro". Las dos del borde apuntan hacia la Estrella Polar.',
    stars: [{ x: 0.95, y: 0.14 }, { x: 0.75, y: 0.24 }, { x: 0.56, y: 0.34 }, { x: 0.38, y: 0.44 }, { x: 0.42, y: 0.78 }, { x: 0.08, y: 0.82 }, { x: 0.04, y: 0.48 }],
    path: [0, 1, 2, 3, 4, 5, 6, 3],
    decoys: 6,
  },
  {
    name: 'Escorpión',
    fact: 'Su estrella más brillante, Antares, es roja. ¡Es un arácnido del cielo, como el alacrán del juego de insectos!',
    stars: [
      { x: 0.8, y: 0.04 }, { x: 0.96, y: 0.2 }, { x: 0.76, y: 0.2 }, { x: 0.66, y: 0.34 }, { x: 0.6, y: 0.5 },
      { x: 0.54, y: 0.66 }, { x: 0.42, y: 0.8 }, { x: 0.24, y: 0.86 }, { x: 0.08, y: 0.76 }, { x: 0.06, y: 0.56 },
    ],
    path: [0, 2, 1, null, 2, 3, 4, 5, 6, 7, 8, 9],
    decoys: 6,
  },
  {
    name: 'Orión',
    fact: 'Representa a un cazador. Las tres estrellas en fila son su cinturón y se ven muy bien en las noches de invierno.',
    stars: [{ x: 0.2, y: 0.06 }, { x: 0.8, y: 0.12 }, { x: 0.62, y: 0.46 }, { x: 0.5, y: 0.5 }, { x: 0.38, y: 0.54 }, { x: 0.2, y: 0.94 }, { x: 0.84, y: 0.9 }],
    path: [0, 1, 2, 3, 4, 0, null, 4, 5, null, 2, 6],
    decoys: 7,
  },
];

const ROUNDS = constellations.length;
const roundMs = (round: number) => progressiveMs(round, ROUNDS, 34000, 20000);
const MIN_SCENE_HEIGHT = 440;
const MAX_SCENE_HEIGHT = 760;
const SKY = { side: 30, top: 104, bottom: 150 }; // margen del área donde van las estrellas
const SNAP = 32; // qué tan cerca debe pasar el dedo para "enganchar" la estrella correcta
const DECOY_HIT = 20; // las estrellas falsas solo cuentan si el dedo pasa muy cerca (evita errores injustos)
const HINT_AFTER_MS = 4000; // si no avanza en 4 s, la siguiente estrella brilla un poco
const GUIDE = { width: 126, height: 84, bottom: 6 };
const LINE_COLOR = '#7DE3F4';
const CHART = { width: 90, height: 72 };
const CHART_RATIO = CHART.height / CHART.width; // alto / ancho de la figura

const INTRO = [
  '¡Hola! Hoy soy Divu astronauta y vamos a explorar el cielo.',
  'Mira la carta estelar: ahí está la figura que hay que dibujar.',
  'Empieza en la estrella que parpadea y arrastra tu dedo de estrella en estrella.',
  '¡Cuidado con las estrellas que no son parte de la figura!',
];
const CHEER = '¡Más estrellas por explorar!';

const divuFaces = {
  normal: require('@/assets/images/serpiente-normal.png'),
  happy: require('@/assets/images/divu-masticando.png'),
  disgust: require('@/assets/images/divu-disgustado.png'),
};
type Face = keyof typeof divuFaces;

const sounds = {
  music: require('@/assets/sounds/music-estrellas.wav'),
  notes: [
    require('@/assets/sounds/star-0.wav'), require('@/assets/sounds/star-1.wav'), require('@/assets/sounds/star-2.wav'), require('@/assets/sounds/star-3.wav'),
    require('@/assets/sounds/star-4.wav'), require('@/assets/sounds/star-5.wav'), require('@/assets/sounds/star-6.wav'), require('@/assets/sounds/star-7.wav'),
  ],
  constellation: require('@/assets/sounds/constellation.wav'),
  pop: require('@/assets/sounds/pop.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  timeout: require('@/assets/sounds/timeout.wav'),
  win: require('@/assets/sounds/win.wav'),
  lose: require('@/assets/sounds/lose.wav'),
};

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Números "al azar" reproducibles (las estrellas falsas quedan siempre en el mismo lugar). */
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

/** Distancia de un punto a un segmento (para que las estrellas falsas no estorben el trazo). */
function distanceToSegment(p: StarPoint, a: StarPoint, b: StarPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Segmentos que se dibujan hasta el paso `upTo` del recorrido (sin cruzar las pausas). */
function segmentsUntil(path: (number | null)[], upTo: number) {
  const list: [number, number][] = [];
  for (let i = 1; i < Math.min(upTo, path.length); i += 1) {
    const from = path[i - 1];
    const to = path[i];
    if (from !== null && to !== null) list.push([from, to]);
  }
  return list;
}

/** Salta las pausas: índice del siguiente paso que es una estrella. */
function skipBreaks(path: (number | null)[], from: number) {
  let step = from;
  while (step < path.length && path[step] === null) step += 1;
  return step;
}

/**
 * Juego "Une las estrellas": en el cielo hay estrellas de la constelación y otras falsas.
 * Mirando la carta estelar, se traza la figura arrastrando el dedo de estrella en estrella.
 */
export function StarConnectGame() {
  const lab = useLabColors();
  const [round, setRound] = useState(0);
  // Cuenta las partidas: al reiniciar en la misma ronda, el reloj vuelve a arrancar.
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'play' | 'done' | 'result'>('play');
  const [result, setResult] = useState<'correct' | 'timeout' | null>(null);
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const [introStep, setIntroStep] = useState(0);
  const started = introStep >= INTRO.length;
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lives, setLives] = useState(LIVES);
  const livesRef = useRef(LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [mistakes, setMistakes] = useState<Constellation[]>([]);
  const [hint, setHint] = useState(false);
  const [wrongDecoy, setWrongDecoy] = useState<number | null>(null);
  const [face, setFace] = useState<Face>('normal');
  const strokeActive = useRef(false);
  const roundToken = useRef(0);
  const finished = round >= ROUNDS || gameOver;
  const constellation = constellations[Math.min(round, ROUNDS - 1)];

  // Sonido
  useBackgroundMusic(sounds.music, 0.32, !finished);
  const n0 = useSfx(sounds.notes[0], 0.7);
  const n1 = useSfx(sounds.notes[1], 0.7);
  const n2 = useSfx(sounds.notes[2], 0.7);
  const n3 = useSfx(sounds.notes[3], 0.7);
  const n4 = useSfx(sounds.notes[4], 0.7);
  const n5 = useSfx(sounds.notes[5], 0.7);
  const n6 = useSfx(sounds.notes[6], 0.7);
  const n7 = useSfx(sounds.notes[7], 0.7);
  const playNote = (index: number) => [n0, n1, n2, n3, n4, n5, n6, n7][Math.min(index, 7)]();
  const playConstellation = useSfx(sounds.constellation, 0.8);
  const playPop = useSfx(sounds.pop, 0.5);
  const playWrong = useSfx(sounds.wrong, 0.7);
  const playTimeout = useSfx(sounds.timeout, 0.7);
  const playWin = useSfx(sounds.win, 0.8);
  const playLose = useSfx(sounds.lose, 0.8);

  // Valores animados
  const timer = useAnimatedValue(1);
  const pulse = useAnimatedValue(0); // la estrella donde hay que empezar "late"
  const twinkle = useAnimatedValue(0); // las estrellas titilan
  const reveal = useAnimatedValue(0); // aparecen las estrellas al empezar la ronda
  const glow = useAnimatedValue(0); // brillo de la figura al completarla
  const resultIn = useAnimatedValue(0);
  const bubbleIn = useAnimatedValue(1);
  const hop = useAnimatedValue(0);
  const shake = useAnimatedValue(0);
  const faceNormal = useAnimatedValue(1);
  const faceHappy = useAnimatedValue(0);
  const faceDisgust = useAnimatedValue(0);
  const faceOpacity: Record<Face, Animated.Value> = { normal: faceNormal, happy: faceHappy, disgust: faceDisgust };
  // Línea que sigue al dedo (se mueve sin redibujar todo el juego).
  const liveX1 = useAnimatedValue(0);
  const liveY1 = useAnimatedValue(0);
  const liveX2 = useAnimatedValue(0);
  const liveY2 = useAnimatedValue(0);
  const liveOpacity = useAnimatedValue(0);

  // Área del cielo donde van las estrellas (en píxeles del escenario).
  const skyW = Math.max(1, scene.width - SKY.side * 2);
  const skyH = Math.max(1, scene.height - SKY.top - SKY.bottom);
  // La figura conserva su forma (misma proporción que la carta estelar), centrada en el cielo;
  // si se estirara al alto de la pantalla ya no se parecería a la carta.
  const boxH = Math.min(skyH, skyW * CHART_RATIO);
  const boxTop = SKY.top + (skyH - boxH) / 2;
  const toPx = (point: StarPoint) => ({ x: SKY.side + point.x * skyW, y: boxTop + point.y * boxH });

  // Estrellas falsas: lejos de las estrellas y de las líneas de la figura (en píxeles, para ser justos).
  const decoys = useMemo(() => {
    if (!scene.width) return [] as StarPoint[];
    const rand = seededRandom(round * 101 + 7);
    const real = constellation.stars.map(toPx);
    const segs = segmentsUntil(constellation.path, constellation.path.length);
    const list: StarPoint[] = [];
    for (let attempt = 0; attempt < 400 && list.length < constellation.decoys; attempt += 1) {
      const candidate = { x: SKY.side + rand() * skyW, y: SKY.top + rand() * skyH };
      const nearStar = [...real, ...list].some((star) => Math.hypot(star.x - candidate.x, star.y - candidate.y) < 56);
      const nearLine = segs.some(([a, b]) => distanceToSegment(candidate, real[a], real[b]) < 36);
      if (!nearStar && !nearLine) list.push(candidate);
    }
    return list;
    // skyW/skyH dependen de scene; se recalcula al cambiar de ronda o de tamaño.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, scene.width, scene.height]);

  const showFace = (next: Face) => {
    setFace(next);
    const to = (value: Animated.Value, visible: boolean) => Animated.timing(value, { toValue: visible ? 1 : 0, duration: 160, useNativeDriver: true });
    Animated.parallel([to(faceNormal, next === 'normal'), to(faceHappy, next === 'happy'), to(faceDisgust, next === 'disgust')]).start();
  };

  const say = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => {
      Animated.timing(bubbleIn, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(null));
    }, 1800);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const loseLife = (lost: Constellation) => {
    const left = Math.max(0, livesRef.current - 1);
    livesRef.current = left;
    setLives(left);
    setMistakes((list) => (list.includes(lost) ? list : [...list, lost]));
    say(livesLeftText(left));
    return left;
  };

  /** Avanza el recorrido (y salta las pausas); `stepRef` evita leer un valor viejo en el gesto. */
  const goToStep = (next: number) => {
    stepRef.current = next;
    setStep(next);
    setHint(false);
  };

  // Ambiente: la estrella de inicio late y todas titilan.
  useEffect(() => {
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [pulse, twinkle]);

  // Cada texto nuevo de la burbuja entra con un pequeño salto.
  useEffect(() => {
    bubbleIn.setValue(0.6);
    Animated.spring(bubbleIn, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  }, [bubbleIn, introStep, toast]);

  useEffect(() => {
    if (phase !== 'result') return;
    resultIn.setValue(0);
    Animated.spring(resultIn, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [phase, resultIn]);

  useEffect(() => {
    if (finished) (gameOver ? playLose : playWin)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Pista: si no avanza en unos segundos, la siguiente estrella brilla.
  useEffect(() => {
    if (!started || phase !== 'play') return;
    const id = setTimeout(() => setHint(true), HINT_AFTER_MS);
    return () => clearTimeout(id);
  }, [started, phase, step, round]);

  const advanceIntro = () => {
    if (introStep < INTRO.length - 1) return setIntroStep((value) => value + 1);
    Animated.timing(bubbleIn, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setIntroStep(INTRO.length));
  };

  const cheer = () => {
    hop.setValue(0);
    Animated.sequence([
      Animated.spring(hop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start();
  };

  const disagree = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 110, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  /** Figura completa (o se acabó el tiempo y se dibuja sola): brillo, sonido y tarjeta. */
  const finishRound = (outcome: 'correct' | 'timeout') => {
    roundToken.current += 1;
    timer.stopAnimation();
    strokeActive.current = false;
    liveOpacity.setValue(0);
    setPhase('done');
    goToStep(constellation.path.length);
    glow.setValue(0);
    Animated.timing(glow, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    if (outcome === 'correct') {
      playConstellation();
      setScore((value) => value + 1);
      showFace('happy');
      cheer();
    } else {
      playTimeout();
      showFace('disgust');
      loseLife(constellation);
    }
    setTimeout(() => {
      setResult(outcome);
      setPhase('result');
    }, 900);
  };

  // Inicio de cada ronda: las estrellas aparecen y arranca el reloj.
  useEffect(() => {
    if (finished || !started) return;
    const token = roundToken.current + 1;
    roundToken.current = token;
    timer.setValue(1);
    glow.setValue(0);
    reveal.setValue(0);
    playPop();
    Animated.timing(reveal, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    Animated.timing(timer, { toValue: 0, duration: roundMs(round), easing: Easing.linear, useNativeDriver: true }).start(({ finished: done }) => {
      if (done && roundToken.current === token) finishRound('timeout');
    });
    // Solo debe correr al cambiar de ronda, reiniciar o terminar la introducción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started, attempt]);

  /** El dedo llegó a la estrella correcta: se engancha la línea y suena su nota. */
  const reachStar = (current: number) => {
    const reached = constellation.path.filter((value, i) => value !== null && i <= current).length;
    playNote(reached - 1);
    const next = skipBreaks(constellation.path, current + 1);
    goToStep(next);
    if (next >= constellation.path.length) finishRound('correct');
  };

  // Trazo con el dedo (gesto nativo).
  const pan = usePanGesture({
    enabled: started && phase === 'play',
    minDistance: 0,
    runOnJS: true,
    disableReanimated: true,
    // Al TOCAR (antes de moverse): ¿empezó en la estrella correcta?
    onBegin: (event) => {
      const current = skipBreaks(constellation.path, stepRef.current);
      const previous = current > 0 ? constellation.path[current - 1] : null;
      const touch = { x: event.x, y: event.y };
      // Si la estrella anterior está unida, se continúa desde ahí; si no, se empieza en la que sigue.
      const anchor = previous !== null && current > 0 ? previous : null;
      if (anchor !== null) {
        const a = toPx(constellation.stars[anchor]);
        if (Math.hypot(touch.x - a.x, touch.y - a.y) < SNAP + 8) {
          strokeActive.current = true;
          liveX1.setValue(a.x);
          liveY1.setValue(a.y);
          liveX2.setValue(touch.x);
          liveY2.setValue(touch.y);
          liveOpacity.setValue(1);
          return;
        }
      } else {
        const target = constellation.path[current];
        if (target !== null && target !== undefined) {
          const t = toPx(constellation.stars[target]);
          if (Math.hypot(touch.x - t.x, touch.y - t.y) < SNAP + 8) {
            strokeActive.current = true;
            liveX1.setValue(t.x);
            liveY1.setValue(t.y);
            liveX2.setValue(touch.x);
            liveY2.setValue(touch.y);
            liveOpacity.setValue(1);
            reachStar(current);
            return;
          }
        }
      }
      strokeActive.current = false;
      say('¡Empieza en la estrella que parpadea!');
    },
    onUpdate: (event) => {
      if (!strokeActive.current) return;
      const touch = { x: event.x, y: event.y };
      liveX2.setValue(touch.x);
      liveY2.setValue(touch.y);
      const current = skipBreaks(constellation.path, stepRef.current);
      const target = constellation.path[current];
      if (target === null || target === undefined) return;
      // Pausa en el recorrido (levantar el lápiz): la línea viva se "suelta" y espera la siguiente.
      const previous = constellation.path[current - 1];
      const t = toPx(constellation.stars[target]);
      if (Math.hypot(touch.x - t.x, touch.y - t.y) < SNAP) {
        reachStar(current);
        liveX1.setValue(t.x);
        liveY1.setValue(t.y);
        return;
      }
      if (previous === null) liveOpacity.setValue(0.35);
      // ¿Pasó por una estrella falsa? Error: pierde una vida y el trazo se corta.
      const hit = decoys.findIndex((decoy) => Math.hypot(touch.x - decoy.x, touch.y - decoy.y) < DECOY_HIT);
      if (hit >= 0) {
        strokeActive.current = false;
        liveOpacity.setValue(0);
        setWrongDecoy(hit);
        setTimeout(() => setWrongDecoy(null), 900);
        playWrong();
        showFace('disgust');
        disagree();
        setTimeout(() => showFace('normal'), 1200);
        const left = loseLife(constellation);
        if (left === 0) {
          roundToken.current += 1;
          timer.stopAnimation();
          setTimeout(() => setGameOver(true), 1400);
        }
      }
    },
    // Al levantar el dedo (o si el gesto se cancela): se suelta el trazo.
    onFinalize: () => {
      strokeActive.current = false;
      liveOpacity.setValue(0);
    },
  });

  /** Deja la ronda lista para empezar (el efecto de inicio arranca reloj y animaciones). */
  const resetRound = () => {
    goToStep(0);
    setPhase('play');
    setResult(null);
    setWrongDecoy(null);
  };

  const next = () => {
    showFace('normal');
    setResult(null);
    if (livesRef.current === 0) {
      setGameOver(true);
      return;
    }
    resetRound();
    setRound((value) => value + 1);
  };

  const restart = () => {
    showFace('normal');
    setResult(null);
    setScore(0);
    livesRef.current = LIVES;
    setLives(LIVES);
    setGameOver(false);
    setMistakes([]);
    resetRound();
    setRound(0);
    setAttempt((value) => value + 1);
    say(CHEER);
  };

  if (finished) {
    const review = mistakes.length > 0 ? (
      <View style={styles.review}>
        <Text style={[styles.reviewTitle, { color: lab.label }]}>{gameOver ? '// repasemos' : '// para la próxima'}</Text>
        {mistakes.map((item) => (
          <View key={item.name} style={[styles.reviewItem, { backgroundColor: '#0B1438', borderColor: lab.line }]}>
            <ConstellationChart height={48} path={item.path} stars={item.stars} width={64} />
            <View style={styles.reviewCopy}>
              <Text style={[styles.reviewName, { color: '#E0E7FF' }]}>{item.name}</Text>
              <Text style={[styles.reviewFact, { color: '#C7D2FE' }]}>{item.fact}</Text>
            </View>
          </View>
        ))}
      </View>
    ) : null;
    const helmetDivu = (
      <View style={styles.finishDivu}>
        <Image contentFit="contain" source={divuFaces.disgust} style={StyleSheet.absoluteFill} />
        <DivuAccessory boxWidth={72} face="disgust" kind="astronaut" />
      </View>
    );
    return (
      <View>
        <GameTopBar score={score} total={ROUNDS} />
        {gameOver ? (
          <GameFinish actionLabel="¡Intentarlo otra vez!" celebrate={false} icon={helmetDivu} iconColor={lab.pink} onRestart={restart} text={`Te quedaste sin vidas en la constelación ${round + 1} de ${ROUNDS}, ¡pero aprendiste algo nuevo!`} title="¡Ups! Se nubló el cielo">
            {review}
          </GameFinish>
        ) : (
          <GameFinish onRestart={restart} text={`Dibujaste ${score} de ${ROUNDS} constelaciones. Búscalas en el cielo una noche despejada.`} title={score === ROUNDS ? '¡Mapa estelar completo!' : '¡Exploración terminada!'}>
            {review}
          </GameFinish>
        )}
      </View>
    );
  }

  // Lo que ya está trazado y lo que sigue.
  const segments = segmentsUntil(constellation.path, step);
  const reachedStars = new Set(constellation.path.slice(0, step).filter((value): value is number => value !== null));
  const current = skipBreaks(constellation.path, step);
  const target = phase === 'play' ? constellation.path[current] : null;
  const previous = current > 0 ? constellation.path[current - 1] : null;
  const startStar = target !== null && target !== undefined && (previous === null || current === 0) ? target : null;
  const hintStar = hint && target !== null && target !== undefined ? target : null;
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.25] });
  const twinkleA = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const twinkleB = twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const shakeRotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const resultScale = resultIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const bubbleText = !started ? INTRO[introStep] : toast;
  const guideLeft = scene.width / 2 - GUIDE.width / 2;
  const headX = guideLeft + GUIDE.width * 0.33;
  // Todas las estrellas (de la figura y falsas) se ven iguales: hay que reconocer la forma.
  const allStars = [
    ...constellation.stars.map((star, i) => ({ ...toPx(star), real: i })),
    ...decoys.map((decoy, i) => ({ ...decoy, decoy: i })),
  ] as ({ x: number; y: number; real?: number; decoy?: number })[];

  return (
    <View style={styles.root}>
      <GameTopBar score={score} total={ROUNDS} />

      <View style={styles.roundRow}>
        <View style={styles.roundCopy}>
          <Text style={[styles.roundLabel, { color: lab.label }]}>{`// constelación ${round + 1} de ${ROUNDS}`}</Text>
          <Text style={[styles.title, { color: lab.text }]}>{!started ? '¡A explorar!' : phase === 'play' ? 'Dibuja la figura' : constellation.name}</Text>
        </View>
        <View style={styles.roundRight}>
          <Hearts lives={lives} />
          <View style={[styles.timerTrack, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
            <Animated.View style={[styles.timerFill, { backgroundColor: lab.cyan, transform: [{ scaleX: timer }] }]} />
          </View>
        </View>
      </View>

      <View
        onLayout={(event: LayoutChangeEvent) => setScene({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        style={[styles.scene, { borderColor: lab.line }]}
      >
        <NightSkyBackground />

        {scene.width > 0 && started ? (
          <GestureDetector gesture={pan}>
            <Animated.View accessibilityHint="Arrastra el dedo de estrella en estrella" accessibilityLabel={`Cielo: dibuja ${constellation.name}`} style={[StyleSheet.absoluteFill, { opacity: reveal }]}>
              <Svg height={scene.height} pointerEvents="none" style={StyleSheet.absoluteFill} width={scene.width}>
                {/* Líneas ya trazadas */}
                {segments.map(([from, to], i) => {
                  const a = toPx(constellation.stars[from]);
                  const b = toPx(constellation.stars[to]);
                  return <Line key={`g${i}`} stroke={LINE_COLOR} strokeLinecap="round" strokeOpacity={0.25} strokeWidth={10} x1={a.x} x2={b.x} y1={a.y} y2={b.y} />;
                })}
                {segments.map(([from, to], i) => {
                  const a = toPx(constellation.stars[from]);
                  const b = toPx(constellation.stars[to]);
                  return <Line key={`l${i}`} stroke={LINE_COLOR} strokeLinecap="round" strokeWidth={3.5} x1={a.x} x2={b.x} y1={a.y} y2={b.y} />;
                })}
                {/* Línea que sigue al dedo */}
                <AnimatedLine opacity={liveOpacity} stroke={LINE_COLOR} strokeDasharray="8 6" strokeLinecap="round" strokeWidth={3} x1={liveX1} x2={liveX2} y1={liveY1} y2={liveY2} />
              </Svg>

              {allStars.map((star, i) => {
                const isReal = star.real !== undefined;
                const lit = isReal && reachedStars.has(star.real as number);
                const isStart = isReal && star.real === startStar;
                const isHint = isReal && star.real === hintStar && !isStart;
                const isWrong = star.decoy !== undefined && star.decoy === wrongDecoy;
                return (
                  <View key={i} pointerEvents="none" style={[styles.starWrap, { left: star.x - 22, top: star.y - 22 }]}>
                    {isStart ? <Animated.View style={[styles.ring, { borderColor: lab.lime, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} /> : null}
                    {isHint ? <Animated.View style={[styles.ring, styles.hintRing, { opacity: pulseOpacity }]} /> : null}
                    {isWrong ? <View style={[styles.ring, styles.wrongRing]} /> : null}
                    <Animated.View style={[styles.starGlow, lit && styles.starGlowLit, { opacity: i % 2 ? twinkleA : twinkleB }]} />
                    <View style={[styles.star, lit && styles.starLit, isWrong && styles.starWrong]} />
                  </View>
                );
              })}

              {/* Al completar, la figura brilla y aparece su nombre */}
              {phase !== 'play' ? (
                <Animated.View pointerEvents="none" style={[styles.nameTag, { top: SKY.top + skyH + 6, opacity: glow }]}>
                  <ShootingStarIcon color={LINE_COLOR} size={16} weight="fill" />
                  <Text style={styles.nameTagText}>{constellation.name.toUpperCase()}</Text>
                </Animated.View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        ) : null}

        {/* Carta estelar: la figura que hay que dibujar */}
        {started && phase === 'play' ? (
          <View pointerEvents="none" style={[styles.chart, stamp(lab, 3, '#13205E')]}>
            <Text style={styles.chartLabel}>carta estelar</Text>
            <ConstellationChart height={CHART.height} path={constellation.path} stars={constellation.stars} width={CHART.width} />
          </View>
        ) : null}

        {/* Divu astronauta */}
        {scene.width > 0 ? (
          <Animated.View accessibilityLabel={face === 'happy' ? 'Divu astronauta feliz' : face === 'disgust' ? 'Divu astronauta con cara de disgusto' : 'Divu astronauta'} pointerEvents="none" style={[styles.guide, { left: guideLeft, transform: [{ translateY: hopY }, { rotate: shakeRotate }] }]}>
            {(Object.keys(divuFaces) as Face[]).map((item) => (
              <Animated.View key={item} style={[StyleSheet.absoluteFill, { opacity: faceOpacity[item] }]}>
                <Image contentFit="contain" source={divuFaces[item]} style={StyleSheet.absoluteFill} />
                <DivuAccessory boxWidth={GUIDE.width} face={item} kind="astronaut" />
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        {phase === 'result' && result ? (
          <Animated.View style={[styles.resultOverlay, { opacity: resultIn, transform: [{ scale: resultScale }] }]}>
            <View style={[styles.feedback, stamp(lab, 5, result === 'correct' ? lab.lime : lab.amber)]}>
              {result === 'correct' ? <ShootingStarIcon color={lab.onBright} size={30} weight="duotone" /> : <TimerIcon color={lab.onBright} size={30} weight="duotone" />}
              <View style={styles.feedbackCopy}>
                <Text style={[styles.feedbackTitle, { color: lab.onBright }]}>{result === 'correct' ? `¡Encontraste ${constellation.name}!` : '¡Se acabó el tiempo!'}</Text>
                <Text style={[styles.feedbackText, { color: lab.onBright }]}>{constellation.fact}</Text>
              </View>
            </View>
            <GameButton icon={<ArrowRightIcon color={lab.onBright} size={18} weight="bold" />} label={round + 1 < ROUNDS && lives > 0 ? 'Siguiente constelación' : 'Ver resultado'} onPress={next} />
          </Animated.View>
        ) : null}

        {bubbleText && scene.width > 0 ? (
          <SpeechBubble
            appear={bubbleIn}
            hint={started ? undefined : introStep < INTRO.length - 1 ? `Toca para continuar · ${introStep + 1}/${INTRO.length}` : 'Toca para empezar'}
            style={{ bottom: GUIDE.bottom + GUIDE.height + 2, left: 14, right: 14 }}
            tailRight={Math.max(16, scene.width - 14 - headX - 8)}
            text={bubbleText}
          />
        ) : null}
      </View>

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
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  roundCopy: { flexShrink: 1 },
  roundRight: { flex: 1, gap: 6 },
  roundLabel: { fontFamily: fonts.monoBold, fontSize: 11 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, marginTop: 2 },
  timerTrack: { height: 14, borderRadius: 7, borderWidth: 2, overflow: 'hidden' },
  timerFill: { flex: 1, transformOrigin: 'left' },
  scene: { flex: 1, minHeight: MIN_SCENE_HEIGHT, maxHeight: MAX_SCENE_HEIGHT, borderRadius: 22, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  introCatcher: { position: 'absolute', top: 64, left: 0, right: 0, bottom: 0, zIndex: 30 },
  starWrap: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  hintRing: { borderColor: '#FDE68A' },
  wrongRing: { borderColor: '#F43F5E', width: 38, height: 38, borderRadius: 19, borderWidth: 4 },
  starGlow: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#E0E7FF', opacity: 0.4 },
  starGlowLit: { backgroundColor: LINE_COLOR, width: 28, height: 28, borderRadius: 14 },
  star: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#FFFFFF' },
  starLit: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#FFFFFF' },
  starWrong: { backgroundColor: '#FDA4AF' },
  nameTag: { position: 'absolute', left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(125, 227, 244, 0.16)' },
  nameTagText: { color: LINE_COLOR, fontFamily: fonts.monoBold, fontSize: 12 },
  chart: { position: 'absolute', top: 12, left: 12, borderRadius: 14, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 2, zIndex: 5 },
  chartLabel: { color: '#C7D2FE', fontFamily: fonts.monoBold, fontSize: 10 },
  guide: { position: 'absolute', bottom: GUIDE.bottom, width: GUIDE.width, height: GUIDE.height, zIndex: 4 },
  resultOverlay: { position: 'absolute', top: 14, left: 12, right: 12, zIndex: 20 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, marginBottom: 12 },
  feedbackCopy: { flex: 1 },
  feedbackTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  feedbackText: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, marginTop: 4 },
  finishDivu: { width: 72, height: 48 },
  review: { alignSelf: 'stretch', gap: 8, marginBottom: 16 },
  reviewTitle: { fontFamily: fonts.monoBold, fontSize: 11 },
  reviewItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 14, padding: 10 },
  reviewCopy: { flex: 1 },
  reviewName: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
  reviewFact: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
