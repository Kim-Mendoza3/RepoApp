import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { AppScreen } from '@/components/app-screen';
import { GridBackground } from '@/components/grid-background';
import { FlaskIcon, LeafIcon, PlanetIcon, PlayIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { BugArt } from '@/features/kids/bug-art';
import { DivuAccessory } from '@/features/kids/divu-accessories';
import { stamp } from '@/features/kids/game-chrome';
import type { LabColors } from '@/theme/palette';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const divuSource = require('@/assets/images/serpiente-normal.png');
const divuAstronaut = require('@/assets/images/divu-astro-normal.png');

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' | 'bold' | 'fill' }>;
type Subject = 'biologia' | 'astronomia' | 'quimica';

/** Materia de cada experimento: nombre, ícono y color de su etiqueta. */
function subjectStyle(subject: Subject, lab: LabColors): { label: string; Icon: IconComponent; color: string } {
  switch (subject) {
    case 'astronomia':
      return { label: 'astronomía', Icon: PlanetIcon, color: '#C4B5FD' };
    case 'quimica':
      return { label: 'química', Icon: FlaskIcon, color: lab.amber };
    default:
      return { label: 'biología', Icon: LeafIcon, color: lab.lime };
  }
}

// PESTAÑA NIÑAS Y NIÑOS: "laboratorio de juegos". Todos los juegos usan la misma tarjeta:
// número de experimento, materia, caja de observación con su ilustración animada y botón.
export default function KidsScreen() {
  const lab = useLabColors();

  return (
    <AppScreen section="laboratorio de juegos" variant="lab" watermarkOpacity={0.05}>
      <Text style={[textStyles.pageTitle, { color: lab.text }]}>
        Aprender es <Text style={[styles.highlight, { backgroundColor: lab.lime, color: lab.onBright }]}> jugar </Text>
      </Text>
      <Text style={[textStyles.body, styles.intro, { color: lab.muted }]}>Elige un experimento y descubre la ciencia a tu ritmo.</Text>

      <GameCard
        art={<FloatingDivu />}
        code="EXPERIMENTO 01"
        description="Ayuda a Divu a identificar qué alimentos puede comer una serpiente."
        details="8 comidas · 3 vidas"
        route="/juegos/divu"
        specimen="espécimen: Divu"
        subject="biologia"
        title="Divu y su merienda"
      />
      <GameCard
        art={<BugsArt />}
        code="EXPERIMENTO 02"
        description="Cuenta las patas de cada bicho y guárdalo en su frasco: ¿insecto o arácnido?"
        details="9 animales · 3 vidas"
        route="/juegos/insectos"
        specimen="espécimen: catarina y araña"
        subject="biologia"
        title="¿Insecto o arácnido?"
      />
      <GameCard
        art={<StarsArt />}
        code="EXPERIMENTO 03"
        description="Encuentra cada constelación entre las estrellas del cielo y trázala con tu dedo, con Divu astronauta."
        details="5 constelaciones · 3 vidas"
        night
        route="/juegos/estrellas"
        specimen="constelación: Osa Mayor"
        subject="astronomia"
        title="Une las estrellas"
      />
    </AppScreen>
  );
}

type GameCardProps = {
  code: string;
  subject: Subject;
  title: string;
  description: string;
  details: string;
  specimen: string;
  route: Href;
  art: ReactNode;
  /** Caja de observación oscura (cielo de noche) en lugar de la cuadrícula clara. */
  night?: boolean;
};

function GameCard({ code, subject, title, description, details, specimen, route, art, night }: GameCardProps) {
  const lab = useLabColors();
  const { label, Icon, color } = subjectStyle(subject, lab);
  const boxText = night ? '#E0E7FF' : lab.text;
  return (
    <View style={[styles.card, stamp(lab, 6)]}>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: lab.cyan, borderColor: lab.brightLine, borderWidth: 2 }]}>
          <Text style={[styles.tagText, { color: lab.onBright }]}>{code}</Text>
        </View>
        <View accessibilityLabel={`Materia: ${label}`} style={[styles.tag, styles.subjectTag, { backgroundColor: color, borderColor: lab.brightLine }]}>
          <Icon color={lab.onBright} size={13} weight="fill" />
          <Text style={[styles.tagText, { color: lab.onBright }]}>{label}</Text>
        </View>
      </View>

      {/* Caja de observación: cuadrícula fina (o cielo nocturno), marcas en las esquinas y la ilustración. */}
      <View style={[styles.specimen, { backgroundColor: night ? '#0B1438' : lab.specimen, borderColor: lab.line }]}>
        {night ? null : <GridBackground color={lab.grid} size={16} />}
        <View style={[styles.corner, styles.cornerTL, { borderColor: boxText }]} />
        <View style={[styles.corner, styles.cornerTR, { borderColor: boxText }]} />
        <View style={[styles.corner, styles.cornerBL, { borderColor: boxText }]} />
        <View style={[styles.corner, styles.cornerBR, { borderColor: boxText }]} />
        {art}
        <Text style={[styles.specimenLabel, { color: boxText }]}>{specimen}</Text>
      </View>

      <Text style={[styles.gameTitle, { color: lab.text }]}>{title}</Text>
      <Text style={[textStyles.body, styles.description, { color: lab.muted }]}>{description}</Text>
      <Text style={[styles.details, { color: lab.label }]}>{`// ${details}`}</Text>
      <Pressable
        accessibilityLabel={`Iniciar ${title}`}
        accessibilityRole="button"
        onPress={() => router.push(route)}
        style={({ pressed }) => [styles.playButton, { backgroundColor: lab.cyan, borderColor: lab.brightLine, shadowColor: lab.brightShadow }, pressed && pressedStyle]}
      >
        <PlayIcon color={lab.onBright} size={18} weight="bold" />
        <Text style={[styles.playText, { color: lab.onBright }]}>Iniciar experimento</Text>
      </Pressable>
    </View>
  );
}

/** Valor que va y viene en bucle (para que las ilustraciones "floten"). */
function useFloat(duration: number) {
  const value = useAnimatedValue(0);
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [duration, value]);
  return value;
}

function FloatingDivu() {
  const bob = useFloat(1200);
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '-3deg'] });
  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
      <Image accessibilityLabel="Divu, la serpiente" contentFit="contain" source={divuSource} style={styles.divu} />
    </Animated.View>
  );
}

/** Portada de insectos: una catarina y una araña (6 y 8 patas) con Divu explorador en medio. */
function BugsArt() {
  const a = useFloat(1100);
  const b = useFloat(1400);
  const left = { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-2deg'] }) }] };
  const right = { transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [-6, 2] }) }, { rotate: b.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '14deg'] }) }] };
  const lab = useLabColors();
  return (
    <View style={styles.bugsRow}>
      <Animated.View style={[styles.bugItem, left]}>
        <BugArt kind="catarina" size={82} />
        <Text style={[styles.legsTag, { color: lab.onBright, backgroundColor: lab.amber, borderColor: lab.brightLine }]}>6 patas</Text>
      </Animated.View>
      <View style={styles.bugsDivu}>
        <Image accessibilityLabel="Divu explorador" contentFit="contain" source={divuSource} style={StyleSheet.absoluteFill} />
        <DivuAccessory boxWidth={96} face="normal" kind="safari" />
      </View>
      <Animated.View style={[styles.bugItem, right]}>
        <BugArt kind="arana" size={82} />
        <Text style={[styles.legsTag, { color: lab.onBright, backgroundColor: lab.cyan, borderColor: lab.brightLine }]}>8 patas</Text>
      </Animated.View>
    </View>
  );
}

// Osa Mayor (las mismas posiciones que en el juego) y estrellitas de fondo.
const BIG_DIPPER = [{ x: 0.9, y: 0.22 }, { x: 0.73, y: 0.3 }, { x: 0.57, y: 0.38 }, { x: 0.42, y: 0.46 }, { x: 0.44, y: 0.7 }, { x: 0.17, y: 0.74 }, { x: 0.13, y: 0.48 }];
const DIPPER_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
const DUST = Array.from({ length: 26 }, (_, i) => ({ x: ((i * 37) % 100) / 100, y: ((i * 53 + 11) % 100) / 100, r: 0.6 + ((i * 7) % 3) * 0.4 }));

/** Portada de estrellas: cielo de noche con la Osa Mayor que titila y Divu astronauta. */
function StarsArt() {
  const twinkle = useFloat(900);
  const glow = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });
  const W = 300;
  const H = 150;
  return (
    <View style={styles.sky}>
      <Svg height={H} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`} width="100%">
        {DUST.map((star, i) => <Circle key={i} cx={star.x * W} cy={star.y * H} fill="#C7D2FE" opacity={0.7} r={star.r} />)}
        {DIPPER_LINES.map(([from, to]) => (
          <Line key={`${from}-${to}`} stroke="#A5B4FC" strokeDasharray="4 4" strokeWidth={1.6} x1={BIG_DIPPER[from].x * W} x2={BIG_DIPPER[to].x * W} y1={BIG_DIPPER[from].y * H} y2={BIG_DIPPER[to].y * H} />
        ))}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow }]}>
        <Svg height={H} viewBox={`0 0 ${W} ${H}`} width="100%">
          {BIG_DIPPER.map((star, i) => (
            <Circle key={i} cx={star.x * W} cy={star.y * H} fill="#E0E7FF" r={8} opacity={0.4} />
          ))}
        </Svg>
      </Animated.View>
      <View style={styles.astroDivu}>
        <Image accessibilityLabel="Divu astronauta" contentFit="contain" source={divuAstronaut} style={StyleSheet.absoluteFill} />
      </View>
      {/* Centro de cada estrella: siempre blanco y brillante (solo titila el halo). */}
      <Svg height={H} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`} width="100%">
        {BIG_DIPPER.map((star, i) => (
          <Circle key={`c${i}`} cx={star.x * W} cy={star.y * H} fill="#FFFFFF" r={3.6} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: { fontFamily: fonts.display, borderRadius: 10, overflow: 'hidden' },
  intro: { marginTop: 8, marginBottom: 20 },
  card: { borderRadius: 24, padding: 16, marginBottom: 20 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  subjectTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 2 },
  tagText: { fontFamily: fonts.monoBold, fontSize: 11 },
  specimen: { height: 168, marginTop: 14, borderRadius: 18, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 16, height: 16 },
  cornerTL: { left: 10, top: 10, borderLeftWidth: 2, borderTopWidth: 2 },
  cornerTR: { right: 10, top: 10, borderRightWidth: 2, borderTopWidth: 2 },
  cornerBL: { left: 10, bottom: 10, borderLeftWidth: 2, borderBottomWidth: 2 },
  cornerBR: { right: 10, bottom: 10, borderRightWidth: 2, borderBottomWidth: 2 },
  divu: { width: 184, height: 128 },
  specimenLabel: { position: 'absolute', right: 32, bottom: 12, fontFamily: fonts.monoBold, fontSize: 10 },
  gameTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, marginTop: 14, marginBottom: 4 },
  description: { fontSize: 14, lineHeight: 21 },
  details: { fontFamily: fonts.monoBold, fontSize: 11, marginTop: 6 },
  playButton: { marginTop: 14, minHeight: 52, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 0 },
  playText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  bugsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -8 },
  bugItem: { alignItems: 'center' },
  legsTag: { fontFamily: fonts.monoBold, fontSize: 10, borderWidth: 2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, marginTop: -4, overflow: 'hidden' },
  bugsDivu: { width: 96, height: 64, marginTop: 34 },
  sky: { position: 'absolute', left: 0, right: 0, top: 6, height: 150 },
  astroDivu: { position: 'absolute', left: 12, top: 4, width: 96, height: 64 },
});
