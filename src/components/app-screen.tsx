import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logoSource, logoStyles } from '@/components/brand-logo';
import { GridBackground } from '@/components/grid-background';
import { ListIcon, MoonIcon, SignOutIcon, SunIcon, UserCircleIcon, UserCirclePlusIcon, XIcon } from '@/components/icons';
import { consumeTabTransition } from '@/components/tab-transition';
import { useAuth } from '@/context/auth-context';
import { useAppTheme, useColors, useLabColors } from '@/context/theme-context';
import { fonts } from '@/theme/fonts';
import { pressedStyle, shadowStyles, textStyles } from '@/theme/common-styles';

type AppScreenProps = {
  /** Etiqueta tipo código sobre el nombre, p. ej. "inicio" → "// inicio". */
  section: string;
  /** "science" para Inicio/Talleres/Admin; "lab" para Niños. */
  variant?: 'science' | 'lab';
  /** Intensidad del logo animado de fondo. */
  watermarkOpacity?: number;
  /** Permite bloquear el scroll vertical, p. ej. mientras se desliza un carrusel. */
  scrollEnabled?: boolean;
  children: ReactNode;
};

/**
 * Marco común de las pestañas: fondo cuadriculado, logo de fondo, encabezado con el logo de
 * deDivulgadores, botones de tema y menú, y la animación de barrido lateral al entrar.
 */
export function AppScreen({ section, variant = 'science', watermarkOpacity = 0.06, scrollEnabled = true, children }: AppScreenProps) {
  const colors = useColors();
  const labColors = useLabColors();
  const isLab = variant === 'lab';
  const background = isLab ? labColors.background : colors.background;
  const grid = isLab ? labColors.grid : colors.grid;

  // Barrido lateral: al recibir el foco, la pantalla entra desde la izquierda o la derecha.
  const { width } = useWindowDimensions();
  const slide = useAnimatedValue(0);
  useFocusEffect(useCallback(() => {
    const direction = consumeTabTransition();
    if (!direction) return;
    slide.setValue(direction);
    Animated.timing(slide, { toValue: 0, duration: 420, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
  }, [slide]));
  const translateX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-width, 0, width] });
  const opacity = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.5, 1, 0.5] });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: background }]} edges={['top']}>
      <Animated.View style={[styles.flex, { opacity, transform: [{ translateX }] }]}>
        <GridBackground color={grid} />
        <BrandWatermark opacity={watermarkOpacity} tint={isLab ? labColors.label : colors.accent} />
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
          <AppHeader section={section} isLab={isLab} />
          {children}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function AppHeader({ section, isLab }: { section: string; isLab: boolean }) {
  const colors = useColors();
  const labColors = useLabColors();
  const { mode, changeMode } = useAppTheme();
  const { session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dark = mode === 'dark';

  const openAuth = (authMode: 'login' | 'register') => {
    setMenuOpen(false);
    router.push({ pathname: '/login', params: { mode: authMode } });
  };

  const text = isLab ? labColors.text : colors.text;
  const label = isLab ? labColors.label : colors.accent;
  const surface = isLab ? labColors.surface : colors.surface;
  // En Niños los botones son "estampas": borde grueso y sombra sólida.
  const buttonStyle = isLab
    ? { borderWidth: 2, borderColor: labColors.line, backgroundColor: labColors.surface, shadowColor: labColors.shadow, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 0 }
    : { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={[styles.logoTile, { borderColor: isLab ? labColors.line : colors.line, borderWidth: isLab ? 2 : 1 }]}>
            <Image accessibilityLabel="Logo de deDivulgadores" contentFit="contain" source={logoSource} style={styles.logo} />
          </View>
          <View>
            <Text style={[textStyles.label, { color: label }]}>{`// ${section}`}</Text>
            <Text style={[styles.brandName, { color: text }]}>deDivulgadores</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            accessibilityRole="button"
            onPress={() => changeMode(dark ? 'light' : 'dark')}
            style={({ pressed }) => [styles.iconButton, buttonStyle, pressed && pressedStyle]}
          >
            {dark ? <SunIcon color={text} size={21} weight="duotone" /> : <MoonIcon color={text} size={21} weight="duotone" />}
          </Pressable>
          <Pressable
            accessibilityLabel={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            accessibilityRole="button"
            onPress={() => setMenuOpen(!menuOpen)}
            style={({ pressed }) => [styles.iconButton, buttonStyle, pressed && pressedStyle]}
          >
            {menuOpen ? <XIcon color={text} size={21} weight="bold" /> : <ListIcon color={text} size={21} weight="bold" />}
          </Pressable>
        </View>
      </View>
      {menuOpen && (
        <View style={[styles.menu, shadowStyles.soft, { backgroundColor: surface, borderColor: isLab ? labColors.line : colors.line }]}>
          {session ? (
            <>
              <Text numberOfLines={1} style={[textStyles.label, styles.menuLabel, { color: colors.muted }]}>{`// sesión: ${session.user.email ?? 'cuenta activa'}`}</Text>
              <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.menuRow, pressed && pressedStyle]}>
                <SignOutIcon color={colors.danger} size={20} weight="duotone" />
                <Text style={[styles.menuText, { color: colors.danger }]}>Cerrar sesión</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Modo invitado: la cuenta es opcional. */}
              <Text style={[textStyles.label, styles.menuLabel, { color: colors.muted }]}>{'// explorando como invitado'}</Text>
              <Pressable accessibilityRole="button" onPress={() => openAuth('login')} style={({ pressed }) => [styles.menuRow, pressed && pressedStyle]}>
                <UserCircleIcon color={colors.accent} size={20} weight="duotone" />
                <Text style={[styles.menuText, { color: text }]}>Iniciar sesión</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openAuth('register')} style={({ pressed }) => [styles.menuRow, pressed && pressedStyle]}>
                <UserCirclePlusIcon color={colors.accent2} size={20} weight="duotone" />
                <Text style={[styles.menuText, { color: text }]}>Crear cuenta</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </>
  );
}

/** Logo de deDivulgadores que flota suavemente detrás del contenido. */
function BrandWatermark({ opacity, tint }: { opacity: number; tint: string }) {
  const drift = useAnimatedValue(0);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 7000, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 7000, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const rotate = drift.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <Animated.View pointerEvents="none" style={[styles.watermark, { opacity, transform: [{ translateY }, { rotate }] }]}>
      <Image contentFit="contain" source={logoSource} style={[styles.watermarkImage, logoStyles.outline, { tintColor: tint }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // paddingBottom deja espacio para la barra de navegación flotante.
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 124, maxWidth: 800, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logoTile: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 46, height: 47 },
  brandName: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menu: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: -8, marginBottom: 22 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  menuLabel: { marginBottom: 4 },
  menuText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  watermark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  watermarkImage: { width: 310, height: 310 },
});
