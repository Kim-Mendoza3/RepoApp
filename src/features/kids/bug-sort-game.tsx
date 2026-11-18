import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useAnimatedValue, useAnimatedValueXY, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { ArrowRightIcon, ConfettiIcon, TimerIcon, XCircleIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { BugArt, GardenBackground, JAR_LID, JAR_RATIO, JarBack, JarFront, JarLid, type BugKind } from '@/features/kids/bug-art';
import { DivuAccessory } from '@/features/kids/divu-accessories';
import { GameButton, GameFinish, GameTopBar, stamp } from '@/features/kids/game-chrome';
import { Hearts, LIVES, livesLeftText, progressiveMs, projectTarget, SpeechBubble, useDragTrail } from '@/features/kids/game-kit';
import { useBackgroundMusic, useSfx } from '@/features/kids/sound';
import { fonts } from '@/theme/fonts';

type Group = 'insecto' | 'aracnido';
type Creature = { kind: BugKind; name: string; group: Group; fact: string };
type Result = { outcome: 'correct' | 'wrong' | 'timeout'; chosen?: Group };

// Datos revisados para el taller de Insectos y el de Arácnidos.
const creatures: Creature[] = [
  { kind: 'hormiga', name: 'Hormiga', group: 'insecto', fact: 'Tiene 6 patas y su cuerpo se divide en 3 partes: cabeza, tórax y abdomen.' },
  { kind: 'arana', name: 'Araña', group: 'aracnido', fact: 'Tiene 8 patas y su cuerpo tiene solo 2 partes. ¡No es un insecto!' },
  { kind: 'abeja', name: 'Abeja', group: 'insecto', fact: 'Tiene 6 patas, alas y antenas, como la mayoría de los insectos.' },
  { kind: 'alacran', name: 'Alacrán', group: 'aracnido', fact: 'Tiene 8 patas. Sus pinzas no son patas: se llaman pedipalpos.' },
  { kind: 'mariposa', name: 'Mariposa', group: 'insecto', fact: 'Tiene 6 patas. De pequeña fue oruga y se transformó dentro de una crisálida.' },
  { kind: 'catarina', name: 'Catarina', group: 'insecto', fact: 'Tiene 6 patas y se come a los pulgones que dañan las plantas.' },
  { kind: 'grillo', name: 'Grillo', group: 'insecto', fact: 'Tiene 6 patas. Los machos cantan frotando sus alas.' },
  { kind: 'mosquito', name: 'Mosquito', group: 'insecto', fact: 'Tiene 6 patas y 2 alas. Solo las hembras pican.' },
  { kind: 'tarantula', name: 'Tarántula', group: 'aracnido', fact: 'Tiene 8 patas y pelos que le ayudan a sentir lo que pasa a su alrededor.' },
];
const groupName: Record<Group, string> = { insecto: 'un insecto', aracnido: 'un arácnido' };

const ROUNDS = creatures.length;
// Velocidad progresiva: contar patas lleva más tiempo que en el juego de Divu (12 s → 6 s).
const roundMs = (round: number) => progressiveMs(round, ROUNDS, 12000, 6000);
const MIN_SCENE_HEIGHT = 400;
const MAX_SCENE_HEIGHT = 720;
const CREATURE_SIZE = 116;
const CREATURE_TOP = 22;
const MINI_SIZE = 30; // tamaño de los bichos ya guardados en el frasco
const JAR = { size: 104, side: 10, bottom: 50 };
const JAR_HEIGHT = JAR.size * JAR_RATIO;
const GUIDE = { width: 120, height: 80, bottom: 8 };
// Lugares dentro del frasco para los bichos atrapados (en % del dibujo del frasco), de abajo hacia arriba.
const SLOTS = [[50, 82], [30, 80], [70, 80], [40, 64], [62, 64], [50, 47], [28, 50], [72, 50], [50, 36]];

const INTRO = [
  '¡Hola otra vez! Hoy vamos a clasificar bichos.',
  'Cuenta sus patas: si tiene 6, es un insecto.',
  'Si tiene 8 patas, es un arácnido.',
  'Arrastra cada uno a su frasco. ¡Antes de que se acabe el tiempo!',
];
const CHEER = '¡Más bichos para clasificar!';

const divuFaces = {
  normal: require('@/assets/images/serpiente-normal.png'),
  happy: require('@/assets/images/divu-masticando.png'),
  disgust: require('@/assets/images/divu-disgustado.png'),
};
type Face = keyof typeof divuFaces;

const sounds = {
  music: require('@/assets/sounds/music-bichos.wav'),
  pop: require('@/assets/sounds/pop.wav'),
  buzz: require('@/assets/sounds/buzz.wav'),
  clink: require('@/assets/sounds/clink.wav'),
  jarLid: require('@/assets/sounds/jar-lid.wav'),
  jarOpen: require('@/assets/sounds/jar-open.wav'),
  correct: require('@/assets/sounds/correct.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  timeout: require('@/assets/sounds/timeout.wav'),
  win: require('@/assets/sounds/win.wav'),
  lose: require('@/assets/sounds/lose.wav'),
};

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

/**
 * Juego "¿Insecto o arácnido?": en cada ronda aparece un bicho en el jardín. Hay que contar sus
 * patas y arrastrarlo al frasco correcto (6 patas = insecto, 8 = arácnido). Divu guía y reacciona.
 */
export function BugSortGame({ onDraggingChange }: BugSortGameProps) {
  const lab = useLabColors();
  const [deck, setDeck] = useState(shuffled);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'drop' | 'play' | 'moving' | 'result'>('drop');
  const [result, setResult] = useState<Result | null>(null);
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const sceneWidth = scene.width;
  const sceneHeight = scene.height || 480;
  const [introStep, setIntroStep] = useState(0);
  const started = introStep >= INTRO.length;
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lives, setLives] = useState(LIVES);
  const livesRef = useRef(LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [mistakes, setMistakes] = useState<Creature[]>([]);
  // Bichos ya guardados en cada frasco (se ven dentro del vidrio).
  const [jarBugs, setJarBugs] = useState<Record<Group, BugKind[]>>({ insecto: [], aracnido: [] });
  const [creatureHidden, setCreatureHidden] = useState(false);
  const [face, setFace] = useState<Face>('normal');
  const finished = round >= ROUNDS || gameOver;
  const creature = deck[Math.min(round, ROUNDS - 1)];

  // Sonido
  useBackgroundMusic(sounds.music, 0.3, !finished);
  const playPop = useSfx(sounds.pop, 0.6);
  const playBuzz = useSfx(sounds.buzz, 0.5);
  const playClink = useSfx(sounds.clink, 0.7);
  const playJarLid = useSfx(sounds.jarLid, 0.7);
  const playJarOpen = useSfx(sounds.jarOpen, 0.75);
  const playCorrect = useSfx(sounds.correct, 0.8);
  const playWrong = useSfx(sounds.wrong, 0.7);
  const playTimeout = useSfx(sounds.timeout, 0.7);
  const playWin = useSfx(sounds.win, 0.8);
  const playLose = useSfx(sounds.lose, 0.8);

  // Valores animados
  const position = useAnimatedValueXY({ x: 0, y: 0 });
  const drop = useAnimatedValue(0); // el bicho baja al jardín al empezar la ronda
  const lift = useAnimatedValue(1); // se agranda al tomarlo
  const shrink = useAnimatedValue(1); // se encoge al entrar al frasco
  const wiggle = useAnimatedValue(0); // el bicho "camina" en su lugar mientras espera
  const timer = useAnimatedValue(1);
  const resultIn = useAnimatedValue(0);
  const bubbleIn = useAnimatedValue(1);
  const hop = useAnimatedValue(0); // Divu brinca de gusto
  const shake = useAnimatedValue(0); // Divu niega con la cabeza
  const lidInsect = useAnimatedValue(0);
  const lidArachnid = useAnimatedValue(0);
  const lids: Record<Group, Animated.Value> = { insecto: lidInsect, aracnido: lidArachnid };
  const lidIsOpen = useRef<Record<Group, boolean>>({ insecto: false, aracnido: false });
  const roundToken = useRef(0);
  const dragTrail = useDragTrail();
  const faceNormal = useAnimatedValue(1);
  const faceHappy = useAnimatedValue(0);
  const faceDisgust = useAnimatedValue(0);
  const faceOpacity: Record<Face, Animated.Value> = { normal: faceNormal, happy: faceHappy, disgust: faceDisgust };

  /** Cambia la cara de Divu con un fundido suave. */
  const showFace = (next: Face) => {
    setFace(next);
    const to = (value: Animated.Value, visible: boolean) => Animated.timing(value, { toValue: visible ? 1 : 0, duration: 160, useNativeDriver: true });
    Animated.parallel([to(faceNormal, next === 'normal'), to(faceHappy, next === 'happy'), to(faceDisgust, next === 'disgust')]).start();
  };

  /** Abre o cierra la tapa de un frasco. Al cerrar, `onShut` se llama justo cuando golpea. */
  const setLid = (group: Group, open: boolean, onShut?: () => void) => {
    if (lidIsOpen.current[group] === open) return;
    lidIsOpen.current[group] = open;
    if (open) {
      playJarOpen(); // se desenrosca y hace "¡plop!" como chupón
      Animated.spring(lids[group], { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }).start();
      return;
    }
    Animated.timing(lids[group], { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished: done }) => {
      if (done) onShut?.();
    });
  };

  /** Divu dice algo breve en su burbuja, que se desvanece sola sin detener el juego. */
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

  /** Se equivocó o se acabó el tiempo: pierde una vida y guardamos el bicho para el repaso. */
  const loseLife = (lost: Creature | undefined) => {
    const left = Math.max(0, livesRef.current - 1);
    livesRef.current = left;
    setLives(left);
    if (lost) setMistakes((list) => (list.some((item) => item.kind === lost.kind) ? list : [...list, lost]));
    say(livesLeftText(left));
  };

  // Geometría del escenario: centros de los frascos, sus bocas y los lugares dentro.
  const creatureCenter = { x: sceneWidth / 2, y: CREATURE_TOP + CREATURE_SIZE / 2 };
  const jarLeft: Record<Group, number> = { insecto: JAR.side, aracnido: sceneWidth - JAR.side - JAR.size };
  const jarTop = sceneHeight - JAR.bottom - JAR_HEIGHT;
  const jarCenter = (group: Group) => ({ x: jarLeft[group] + JAR.size / 2, y: jarTop + JAR_HEIGHT * 0.55 });
  const jarMouth = (group: Group) => ({ x: jarLeft[group] + JAR.size / 2, y: jarTop + (JAR_HEIGHT * 22) / 125 });
  const slotPoint = (group: Group, index: number) => {
    const [px, py] = SLOTS[Math.min(index, SLOTS.length - 1)];
    return { x: jarLeft[group] + (JAR.size * px) / 100, y: jarTop + (JAR_HEIGHT * py) / 100 };
  };
  const offset = (point: { x: number; y: number }) => ({ x: point.x - creatureCenter.x, y: point.y - creatureCenter.y });
  const moveTo = (point: { x: number; y: number }, duration: number, easing = Easing.inOut(Easing.quad)) =>
    Animated.timing(position, { toValue: offset(point), duration, easing, useNativeDriver: true });

  // Animaciones de ambiente: el bicho "camina" en su lugar.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 520, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.delay(500),
    ]));
    loop.start();
    return () => loop.stop();
  }, [wiggle]);


  // Cada texto nuevo de la burbuja entra con un pequeño salto.
  useEffect(() => {
    bubbleIn.setValue(0.6);
    Animated.spring(bubbleIn, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  }, [bubbleIn, introStep, toast]);

  // La tarjeta de resultado aparece con un pequeño rebote.
  useEffect(() => {
    if (phase !== 'result') return;
    resultIn.setValue(0);
    Animated.spring(resultIn, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
  }, [phase, resultIn]);

  // Música final al terminar la partida.
  useEffect(() => {
    if (finished) (gameOver ? playLose : playWin)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const advanceIntro = () => {
    if (introStep < INTRO.length - 1) return setIntroStep((step) => step + 1);
    Animated.timing(bubbleIn, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setIntroStep(INTRO.length));
  };

  /** El bicho entra al frasco: baja por la boca, se encoge, "tin" de vidrio y la tapa se cierra. */
  const intoJar = (group: Group, kind: BugKind, delay = 0) => {
    const slot = slotPoint(group, jarBugs[group].length);
    setTimeout(() => setLid(group, true), delay);
    Animated.sequence([
      Animated.delay(delay),
      moveTo({ x: jarMouth(group).x, y: jarMouth(group).y - 30 }, 180, Easing.out(Easing.quad)),
      Animated.parallel([
        moveTo(slot, 260, Easing.in(Easing.quad)),
        Animated.timing(shrink, { toValue: MINI_SIZE / CREATURE_SIZE, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(() => {
      setJarBugs((jars) => ({ ...jars, [group]: [...jars[group], kind] }));
      setCreatureHidden(true);
    });
    setTimeout(playClink, delay + 440);
    setTimeout(() => setLid(group, false, playJarLid), delay + 560);
  };

  /** Brinco de alegría de Divu. */
  const cheer = () => {
    hop.setValue(0);
    Animated.sequence([
      Animated.spring(hop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start();
  };

  /** Divu niega con la cabeza. */
  const disagree = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 110, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const classify = (chosen: Group) => {
    if (phase !== 'play' || !creature) return;
    roundToken.current += 1; // detiene el reloj
    timer.stopAnimation();
    setPhase('moving');
    const correct = creature.group === chosen;

    if (correct) {
      intoJar(chosen, creature.kind);
      setTimeout(() => {
        playCorrect();
        setScore((value) => value + 1);
        showFace('happy');
        cheer();
      }, 460);
      setTimeout(() => {
        setResult({ outcome: 'correct', chosen });
        setPhase('result');
      }, 620);
      return;
    }

    // Frasco equivocado: el bicho choca con la tapa cerrada, rebota y salta a su frasco correcto.
    const right = creature.group;
    setLid(chosen, false);
    const mouth = jarMouth(chosen);
    Animated.sequence([
      moveTo({ x: mouth.x, y: mouth.y - 34 }, 180, Easing.in(Easing.quad)),
      moveTo({ x: (mouth.x + sceneWidth / 2) / 2, y: mouth.y - 110 }, 220, Easing.out(Easing.quad)),
    ]).start();
    setTimeout(() => {
      playJarLid();
      playWrong();
      showFace('disgust');
      disagree();
      loseLife(creature);
    }, 180);
    intoJar(right, creature.kind, 420);
    setTimeout(() => {
      setResult({ outcome: 'wrong', chosen });
      setPhase('result');
    }, 1100);
  };

  /** Se acabó el tiempo: el bicho camina solo a su frasco (así se ve la respuesta). */
  const onTimeout = (current: Creature | undefined) => {
    if (!current) return;
    setPhase('moving');
    playTimeout();
    showFace('disgust');
    loseLife(current);
    intoJar(current.group, current.kind, 150);
    setTimeout(() => {
      setResult({ outcome: 'timeout' });
      setPhase('result');
    }, 900);
  };

  // Inicio de cada ronda: el bicho baja al jardín y arranca el reloj.
  useEffect(() => {
    if (finished || !started) return;
    const token = roundToken.current + 1;
    roundToken.current = token;
    position.setValue({ x: 0, y: 0 });
    shrink.setValue(1);
    lift.setValue(1);
    drop.setValue(0);
    timer.setValue(1);
    playPop();
    Animated.spring(drop, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 10, restDisplacementThreshold: 0.02, restSpeedThreshold: 0.2 }).start(() => {
      if (roundToken.current !== token) return;
      setPhase('play');
      Animated.timing(timer, { toValue: 0, duration: roundMs(round), easing: Easing.linear, useNativeDriver: true }).start(({ finished: done }) => {
        if (!done || roundToken.current !== token) return;
        roundToken.current += 1;
        onTimeout(creature);
      });
    });
    // Solo debe correr al cambiar de ronda, reiniciar la partida o terminar la introducción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deck, started]);

  const next = () => {
    showFace('normal');
    setResult(null);
    setCreatureHidden(false);
    if (livesRef.current === 0) {
      setGameOver(true);
      return;
    }
    setPhase('drop');
    setRound((value) => value + 1);
  };

  const restart = () => {
    showFace('normal');
    setResult(null);
    setCreatureHidden(false);
    setScore(0);
    livesRef.current = LIVES;
    setLives(LIVES);
    setGameOver(false);
    setMistakes([]);
    setJarBugs({ insecto: [], aracnido: [] });
    setPhase('drop');
    setRound(0);
    setDeck(shuffled());
    say(CHEER);
  };

  const returnCreature = () => {
    setLid('insecto', false);
    setLid('aracnido', false);
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, speed: 16, bounciness: 9 }).start();
  };

  // Arrastre nativo (react-native-gesture-handler): igual que en el juego de Divu.
  const pan = usePanGesture({
    enabled: phase === 'play' && !!creature,
    minDistance: 0,
    runOnJS: true,
    disableReanimated: true,
    onActivate: () => {
      dragTrail.reset();
      onDraggingChange?.(true);
      playBuzz();
      Animated.spring(lift, { toValue: 1.15, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
    },
    onUpdate: (event) => {
      position.setValue({ x: event.translationX, y: event.translationY });
      dragTrail.push(event.translationX, event.translationY);
      // La tapa del frasco se abre cuando el bicho se acerca a su boca.
      const x = creatureCenter.x + event.translationX;
      const y = creatureCenter.y + event.translationY;
      (['insecto', 'aracnido'] as Group[]).forEach((group) => {
        const mouth = jarMouth(group);
        setLid(group, Math.hypot(x - mouth.x, y - mouth.y) < 110);
      });
    },
    onDeactivate: (event) => {
      onDraggingChange?.(false);
      Animated.spring(lift, { toValue: 1, useNativeDriver: true }).start();
      if (event.canceled) return returnCreature();
      const x = creatureCenter.x + event.translationX;
      const y = creatureCenter.y + event.translationY;
      const targetAt = (px: number, py: number): Group | null => {
        for (const group of ['insecto', 'aracnido'] as Group[]) {
          const center = jarCenter(group);
          const mouth = jarMouth(group);
          if (Math.hypot(px - center.x, py - center.y) < 72 || Math.hypot(px - mouth.x, py - mouth.y) < 70) return group;
        }
        return null;
      };
      const openLid = (['insecto', 'aracnido'] as Group[]).find((group) => lidIsOpen.current[group]) ?? null;
      const target = targetAt(x, y) ?? openLid ?? projectTarget(x, y, dragTrail.velocity({ x: event.velocityX, y: event.velocityY }), targetAt);
      if (target) return classify(target);
      returnCreature();
    },
  });

  if (finished) {
    const review = mistakes.length > 0 ? (
      <View style={styles.review}>
        <Text style={[styles.reviewTitle, { color: lab.label }]}>{gameOver ? '// repasemos' : '// para la próxima'}</Text>
        {mistakes.map((item) => (
          <View key={item.kind} style={[styles.reviewItem, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
            <BugArt kind={item.kind} size={48} />
            <View style={styles.reviewCopy}>
              <Text style={[styles.reviewName, { color: lab.text }]}>{`${item.name}: es ${groupName[item.group]}`}</Text>
              <Text style={[styles.reviewFact, { color: lab.muted }]}>{item.fact}</Text>
            </View>
          </View>
        ))}
      </View>
    ) : null;
    return (
      <View>
        <GameTopBar score={score} total={ROUNDS} />
        {gameOver ? (
          <GameFinish
            actionLabel="¡Intentarlo otra vez!"
            celebrate={false}
            icon={(
              <View style={styles.finishDivu}>
                <Image contentFit="contain" source={divuFaces.disgust} style={StyleSheet.absoluteFill} />
                <DivuAccessory boxWidth={72} face="disgust" kind="safari" />
              </View>
            )}
            iconColor={lab.pink}
            onRestart={restart}
            text={`Te quedaste sin vidas en la muestra ${round + 1} de ${ROUNDS}, ¡pero aprendiste algo nuevo!`}
            title="¡Ups! Se escaparon los bichos"
          >
            {review}
          </GameFinish>
        ) : (
          <GameFinish
            onRestart={restart}
            text={`Clasificaste bien ${score} de ${ROUNDS} animales. Recuerda: 6 patas = insecto, 8 patas = arácnido.`}
            title={score === ROUNDS ? '¡Clasificación perfecta!' : '¡Experimento terminado!'}
          >
            {review}
          </GameFinish>
        )}
      </View>
    );
  }

  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [-170, 0] });
  const wiggleRotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const shakeRotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const resultScale = resultIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  const outcome = result?.outcome;
  const feedback = outcome === 'correct'
    ? { title: `¡Correcto! Es ${groupName[creature.group]}`, color: lab.lime, Icon: ConfettiIcon }
    : outcome === 'wrong'
      ? { title: `¡Casi! Es ${groupName[creature.group]}`, color: lab.pink, Icon: XCircleIcon }
      : { title: '¡Se acabó el tiempo!', color: lab.amber, Icon: TimerIcon };
  const bubbleText = !started ? INTRO[introStep] : toast;
  // Cabeza de Divu (para que el piquito de la burbuja apunte a ella).
  const guideLeft = sceneWidth / 2 - GUIDE.width / 2;
  const headX = guideLeft + GUIDE.width * 0.33;

  return (
    <View style={styles.root}>
      <GameTopBar score={score} total={ROUNDS} />

      <View style={styles.roundRow}>
        <View style={styles.roundCopy}>
          <Text style={[styles.roundLabel, { color: lab.label }]}>{`// muestra ${round + 1} de ${ROUNDS}`}</Text>
          <Text style={[styles.creatureName, { color: lab.text }]}>{started ? creature?.name : '¡A clasificar!'}</Text>
        </View>
        <View style={styles.roundRight}>
          <Hearts lives={lives} />
          <View style={[styles.timerTrack, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
            <Animated.View style={[styles.timerFill, { backgroundColor: lab.cyan, transform: [{ scaleX: timer }] }]} />
          </View>
        </View>
      </View>

      {/* ESCENARIO: jardín con los dos frascos y Divu en medio */}
      <View
        onLayout={(event: LayoutChangeEvent) => setScene({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        style={[styles.scene, { borderColor: lab.line }]}
      >
        <GardenBackground />

        {sceneWidth > 0 ? (['insecto', 'aracnido'] as Group[]).map((group) => {
          const color = group === 'insecto' ? lab.amber : lab.cyan;
          const lidRotate = lids[group].interpolate({ inputRange: [0, 1], outputRange: ['0deg', group === 'insecto' ? '-58deg' : '58deg'] });
          const hingeX = group === 'insecto' ? JAR_LID.hingeX : 100 - JAR_LID.hingeX;
          return (
            <View key={group} pointerEvents="none" style={[styles.jar, { left: jarLeft[group], top: jarTop }]}>
              <View style={styles.layer}><JarBack size={JAR.size} tint={color} /></View>
              {/* Bichos ya guardados, dentro del vidrio */}
              {jarBugs[group].map((kind, index) => {
                const [px, py] = SLOTS[Math.min(index, SLOTS.length - 1)];
                return (
                  <View key={`${kind}-${index}`} style={[styles.mini, { left: (JAR.size * px) / 100 - MINI_SIZE / 2, top: (JAR_HEIGHT * py) / 100 - MINI_SIZE / 2, transform: [{ rotate: `${(index * 47) % 50 - 25}deg` }] }]}>
                    <BugArt kind={kind} size={MINI_SIZE} />
                  </View>
                );
              })}
              <View style={styles.layer}><JarFront size={JAR.size} /></View>
              {/* La tapa gira desde su bisagra (lado de afuera de cada frasco). */}
              <Animated.View
                style={[styles.jarLid, {
                  top: (JAR.size * JAR_LID.top) / 100,
                  transformOrigin: [(JAR.size * hingeX) / 100, (JAR.size * (JAR_LID.hingeY - JAR_LID.top)) / 100, 0],
                  transform: [{ rotate: lidRotate }],
                }]}
              >
                <JarLid color={color} size={JAR.size} />
              </Animated.View>
              <View style={[styles.jarLabel, stamp(lab, 3, color)]}>
                <Text style={[styles.jarLabelTitle, { color: lab.onBright }]}>{group === 'insecto' ? 'INSECTO' : 'ARÁCNIDO'}</Text>
                <Text style={[styles.jarLabelLegs, { color: lab.onBright }]}>{group === 'insecto' ? '6 patas' : '8 patas'}</Text>
              </View>
            </View>
          );
        }) : null}

        {/* Divu, el guía */}
        {sceneWidth > 0 ? (
          <Animated.View
            accessibilityLabel={face === 'happy' ? 'Divu feliz' : face === 'disgust' ? 'Divu con cara de disgusto' : 'Divu, la serpiente'}
            pointerEvents="none"
            style={[styles.guide, { left: guideLeft, transform: [{ translateY: hopY }, { rotate: shakeRotate }] }]}
          >
            {(Object.keys(divuFaces) as Face[]).map((item) => (
              <Animated.View key={item} style={[StyleSheet.absoluteFill, { opacity: faceOpacity[item] }]}>
                <Image contentFit="contain" source={divuFaces[item]} style={StyleSheet.absoluteFill} />
                {/* Sombrero de explorador: Divu va de entomólogo en este juego. */}
                <DivuAccessory boxWidth={GUIDE.width} face={item} kind="safari" />
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        {/* El bicho */}
        {started && !creatureHidden && phase !== 'result' && creature && sceneWidth > 0 ? (
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityActions={[{ name: 'insecto', label: 'Guardar en el frasco de insectos' }, { name: 'aracnido', label: 'Guardar en el frasco de arácnidos' }]}
              accessibilityHint="Cuenta sus patas y arrástralo al frasco correcto"
              accessibilityLabel={`Muestra: ${creature.name}`}
              onAccessibilityAction={(event) => classify(event.nativeEvent.actionName === 'insecto' ? 'insecto' : 'aracnido')}
              style={[styles.creature, {
                left: sceneWidth / 2 - CREATURE_SIZE / 2,
                transform: [
                  ...position.getTranslateTransform(),
                  { translateY: dropY },
                  { rotate: wiggleRotate },
                  { scale: Animated.multiply(lift, shrink) },
                ],
              }]}
            >
              <BugArt kind={creature.kind} size={CREATURE_SIZE} />
            </Animated.View>
          </GestureDetector>
        ) : null}

        {/* Resultado arriba del jardín */}
        {phase === 'result' && result && creature ? (
          <Animated.View style={[styles.resultOverlay, { opacity: resultIn, transform: [{ scale: resultScale }] }]}>
            <View style={[styles.feedback, stamp(lab, 5, feedback.color)]}>
              <feedback.Icon color={lab.onBright} size={30} weight="duotone" />
              <View style={styles.feedbackCopy}>
                <Text style={[styles.feedbackTitle, { color: lab.onBright }]}>{feedback.title}</Text>
                <Text style={[styles.feedbackText, { color: lab.onBright }]}>{`${creature.name}: ${creature.fact}`}</Text>
              </View>
            </View>
            <GameButton icon={<ArrowRightIcon color={lab.onBright} size={18} weight="bold" />} label={round + 1 < ROUNDS && lives > 0 ? 'Siguiente animal' : 'Ver resultado'} onPress={next} />
          </Animated.View>
        ) : null}

        {bubbleText && sceneWidth > 0 ? (
          <SpeechBubble
            appear={bubbleIn}
            hint={started ? undefined : introStep < INTRO.length - 1 ? `Toca para continuar · ${introStep + 1}/${INTRO.length}` : 'Toca para empezar'}
            style={{ bottom: GUIDE.bottom + GUIDE.height + 2, left: 14, right: 14 }}
            tailRight={Math.max(16, sceneWidth - 14 - headX - 8)}
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
  creatureName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, marginTop: 2 },
  timerTrack: { height: 14, borderRadius: 7, borderWidth: 2, overflow: 'hidden' },
  timerFill: { flex: 1, transformOrigin: 'left' },
  scene: { flex: 1, minHeight: MIN_SCENE_HEIGHT, maxHeight: MAX_SCENE_HEIGHT, borderRadius: 22, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  introCatcher: { position: 'absolute', top: 64, left: 0, right: 0, bottom: 0, zIndex: 30 },
  jar: { position: 'absolute', width: JAR.size, height: JAR_HEIGHT, zIndex: 3 },
  layer: { position: 'absolute', left: 0, top: 0 },
  mini: { position: 'absolute', width: MINI_SIZE, height: MINI_SIZE },
  jarLid: { position: 'absolute', left: 0 },
  jarLabel: { position: 'absolute', top: JAR_HEIGHT + 2, left: 6, right: 6, borderRadius: 10, alignItems: 'center', paddingVertical: 3 },
  jarLabelTitle: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 14 },
  jarLabelLegs: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14 },
  guide: { position: 'absolute', bottom: GUIDE.bottom, width: GUIDE.width, height: GUIDE.height, zIndex: 2 },
  creature: { position: 'absolute', top: CREATURE_TOP, width: CREATURE_SIZE, height: CREATURE_SIZE, zIndex: 10 },
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
