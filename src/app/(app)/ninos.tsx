import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, type ComponentType } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { GridBackground } from '@/components/grid-background';
import { BugIcon, PlayIcon, ShootingStarIcon } from '@/components/icons';
import { useLabColors } from '@/context/theme-context';
import { stamp } from '@/features/kids/game-chrome';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const divuSource = require('@/assets/images/serpiente-normal.png');

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' | 'bold' }>;

// PESTAÑA NIÑAS Y NIÑOS: "laboratorio de juegos".
export default function KidsScreen() {
  const lab = useLabColors();

  return (
    <AppScreen section="laboratorio de juegos" variant="lab" watermarkOpacity={0.05}>
      <Text style={[textStyles.pageTitle, { color: lab.text }]}>
        Aprender es <Text style={[styles.highlight, { backgroundColor: lab.lime, color: lab.onBright }]}> jugar </Text>
      </Text>
      <Text style={[textStyles.body, styles.intro, { color: lab.muted }]}>Elige un experimento y descubre la ciencia a tu ritmo.</Text>

      <View style={[styles.card, stamp(lab, 6)]}>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: lab.cyan, borderColor: lab.brightLine, borderWidth: 2 }]}>
            <Text style={[styles.tagText, { color: lab.onBright }]}>EXPERIMENTO 01</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: lab.lime }]}>
            <Text style={[styles.tagText, { color: lab.onBright }]}>biología</Text>
          </View>
        </View>

        {/* Caja de observación: cuadrícula fina, marcas en las esquinas y Divu flotando. */}
        <View style={[styles.specimen, { backgroundColor: lab.specimen, borderColor: lab.line }]}>
          <GridBackground color={lab.grid} size={16} />
          <View style={[styles.corner, styles.cornerTL, { borderColor: lab.text }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: lab.text }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: lab.text }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: lab.text }]} />
          <FloatingDivu />
          <Text style={[styles.specimenLabel, { color: lab.text }]}>espécimen: Divu</Text>
        </View>

        <Text style={[styles.gameTitle, { color: lab.text }]}>Divu y su merienda</Text>
        <Text style={[textStyles.body, { color: lab.muted, fontSize: 14, lineHeight: 21 }]}>Ayuda a Divu a identificar qué alimentos puede comer una serpiente.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/juegos/divu')}
          style={({ pressed }) => [styles.playButton, { backgroundColor: lab.cyan, borderColor: lab.brightLine, shadowColor: lab.brightShadow }, pressed && pressedStyle]}
        >
          <PlayIcon color={lab.onBright} size={18} weight="bold" />
          <Text style={[styles.playText, { color: lab.onBright }]}>Iniciar experimento</Text>
        </Pressable>
      </View>

      <Text style={[textStyles.label, styles.sectionLabel, { color: lab.label, fontFamily: fonts.monoBold }]}>{'// más experimentos'}</Text>
      <View style={styles.upcomingRow}>
        <GameTile Icon={BugIcon} code="EXP-02" title="¿Insecto o arácnido?" background={lab.amber} onPress={() => router.push('/juegos/insectos')} />
        <GameTile Icon={ShootingStarIcon} code="EXP-03" title="Une las estrellas" background={lab.pink} onPress={() => router.push('/juegos/estrellas')} />
      </View>
    </AppScreen>
  );
}

function GameTile({ Icon, code, title, background, onPress }: { Icon: IconComponent; code: string; title: string; background: string; onPress: () => void }) {
  const lab = useLabColors();
  return (
    <Pressable
      accessibilityLabel={`${code}: ${title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.upcoming, stamp(lab, 5, background), pressed && pressedStyle]}
    >
      <View style={styles.tileTop}>
        <Icon color={lab.onBright} size={32} weight="duotone" />
        <View style={[styles.tilePlay, { backgroundColor: lab.surface, borderColor: lab.line }]}>
          <PlayIcon color={lab.text} size={14} weight="bold" />
        </View>
      </View>
      <View>
        <Text style={[styles.tagText, { color: lab.onBright, fontSize: 10 }]}>{code}</Text>
        <Text style={[styles.upcomingTitle, { color: lab.onBright }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

function FloatingDivu() {
  const bob = useAnimatedValue(0);
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [bob]);
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '-3deg'] });
  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
      <Image accessibilityLabel="Divu, la serpiente" contentFit="contain" source={divuSource} style={styles.divu} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  highlight: { fontFamily: fonts.display, borderRadius: 10, overflow: 'hidden' },
  intro: { marginTop: 8, marginBottom: 20 },
  card: { borderRadius: 24, padding: 16, marginBottom: 8 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
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
  playButton: { marginTop: 14, minHeight: 52, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 0 },
  playText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  sectionLabel: { fontSize: 12, marginTop: 24, marginBottom: 12 },
  upcomingRow: { flexDirection: 'row', gap: 14 },
  upcoming: { flex: 1, minHeight: 138, borderRadius: 22, padding: 14, justifyContent: 'space-between', gap: 10 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tilePlay: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  upcomingTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 21 },
});
