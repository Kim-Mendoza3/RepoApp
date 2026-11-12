import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo, logoSource, logoStyles } from '@/components/brand-logo';
import { useAuth } from '@/context/auth-context';
import { useAppTheme, useColors } from '@/context/theme-context';
import { glassStyles, pressedStyle, textStyles } from '@/theme/common-styles';

type AppScreenProps = {
  /** Nombre de la sección que aparece sobre "Divulgadores" en el encabezado. */
  title: string;
  /** Intensidad del logo de fondo (cada sección usa una distinta). */
  watermarkOpacity: number;
  /** Permite bloquear el scroll vertical, p. ej. mientras se desliza un carrusel. */
  scrollEnabled?: boolean;
  children: ReactNode;
};

/** Marco común de las pestañas: área segura, logo de fondo, encabezado con ajustes y scroll. */
export function AppScreen({ title, watermarkOpacity, scrollEnabled = true, children }: AppScreenProps) {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <BrandWatermark opacity={watermarkOpacity} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
        <AppHeader title={title} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppHeader({ title }: { title: string }) {
  const colors = useColors();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const menuScale = useAnimatedValue(1);

  const toggleSettings = () => {
    if (settingsVisible) {
      setSettingsVisible(false);
      return;
    }
    menuScale.setValue(0.92);
    setSettingsVisible(true);
    Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  return (
    <>
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: `${colors.line}B8` }]}>
        <Pressable onPress={toggleSettings} style={({ pressed }) => [styles.toolbarBrand, pressed && pressedStyle]}>
          <View style={[styles.logoFrame, { backgroundColor: colors.surface }]}><BrandLogo compact /></View>
          <View>
            <Text style={[styles.sectionLabel, { color: colors.blue }]}>{title}</Text>
            <Text style={[styles.toolbarTitle, { color: colors.text }]}>Divulgadores</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel={settingsVisible ? 'Cerrar ajustes' : 'Abrir ajustes'}
          accessibilityRole="button"
          onPress={toggleSettings}
          style={({ pressed }) => [styles.iconButton, { borderColor: colors.line }, pressed && pressedStyle]}
        >
          <MaterialCommunityIcons color={colors.text} name={settingsVisible ? 'close' : 'menu'} size={23} />
        </Pressable>
      </View>
      {settingsVisible && <Animated.View style={{ transform: [{ scale: menuScale }] }}><SettingsPanel /></Animated.View>}
    </>
  );
}

function SettingsPanel() {
  const colors = useColors();
  const { mode, changeMode } = useAppTheme();
  const { signOut } = useAuth();
  const darkMode = mode === 'dark';

  return (
    <View style={[styles.settings, glassStyles.surface, { backgroundColor: `${colors.surface}D9`, borderColor: `${colors.line}B8` }]}>
      <Text style={[styles.settingsTitle, { color: colors.text }]}>Ajustes</Text>
      <View style={styles.settingRow}>
        <View style={styles.settingLabel}>
          <MaterialCommunityIcons color={colors.blue} name="theme-light-dark" size={20} />
          <Text style={[textStyles.body, { color: colors.text }]}>Modo oscuro</Text>
        </View>
        <Pressable
          accessibilityLabel="Modo oscuro"
          accessibilityRole="switch"
          accessibilityState={{ checked: darkMode }}
          onPress={() => changeMode(darkMode ? 'light' : 'dark')}
          style={[styles.switch, { backgroundColor: darkMode ? colors.blue : colors.line }]}
        >
          <View style={[styles.switchThumb, darkMode && styles.switchThumbActive]} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={signOut} style={styles.logoutRow}>
        <MaterialCommunityIcons color={colors.danger} name="logout" size={19} />
        <Text style={[styles.logout, { color: colors.danger }]}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function BrandWatermark({ opacity }: { opacity: number }) {
  const colors = useColors();
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
      <Image contentFit="contain" source={logoSource} style={[styles.watermarkImage, logoStyles.outline, { tintColor: colors.blue }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // paddingBottom deja espacio para la barra de navegación flotante.
  content: { padding: 24, paddingBottom: 120, maxWidth: 800, width: '100%', alignSelf: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderRadius: 28, borderWidth: 1, padding: 16 },
  toolbarBrand: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  logoFrame: { width: 82, height: 82, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  toolbarTitle: { fontSize: 22, fontWeight: '900' },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 18 },
  settings: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 22 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  settingLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  switch: { width: 48, height: 28, borderRadius: 20, padding: 3 },
  switchThumb: { width: 22, height: 22, borderRadius: 12, backgroundColor: '#FFFFFF' },
  switchThumbActive: { alignSelf: 'flex-end' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logout: { fontWeight: '800' },
  watermark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  watermarkImage: { width: 310, height: 310 },
});
