import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, useAnimatedValue, useColorScheme, View } from 'react-native';

import { palette, type Colors, type ThemeMode } from '@/theme/palette';

type ThemeContextValue = {
  mode: ThemeMode;
  /** Cambia el tema con una transición suave (un velo que se desvanece). */
  changeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [coverColor, setCoverColor] = useState<string | null>(null);
  const coverOpacity = useAnimatedValue(0);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    changeMode: (nextMode) => {
      // Cubre la pantalla con el color actual, cambia el tema por debajo y desvanece el velo.
      setCoverColor(palette[mode].background);
      coverOpacity.setValue(1);
      requestAnimationFrame(() => {
        setMode(nextMode);
        Animated.timing(coverOpacity, { toValue: 0, duration: 520, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setCoverColor(null);
        });
      });
    },
  }), [mode, coverOpacity]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {coverColor && <Animated.View pointerEvents="none" style={[styles.cover, { backgroundColor: coverColor, opacity: coverOpacity }]} />}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme debe usarse dentro de ThemeProvider');
  return context;
}

/** Colores del tema activo (claro u oscuro). */
export function useColors(): Colors {
  return palette[useAppTheme().mode];
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cover: { ...StyleSheet.absoluteFill, zIndex: 20 },
});
