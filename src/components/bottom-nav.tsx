import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlaskIcon, HouseIcon, SmileyIcon, SquaresFourIcon } from '@/components/icons';
import { prepareTabTransition, TAB_ORDER, type TabName } from '@/components/tab-transition';
import { useAuth } from '@/context/auth-context';
import { useAppTheme, useColors, useLabColors } from '@/context/theme-context';
import { fonts } from '@/theme/fonts';

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' | 'fill' | 'regular' | 'bold' }>;

// Etiqueta e ícono de cada botón. El orden en pantalla lo define TAB_ORDER.
const tabs: Record<TabName, { label: string; Icon: IconComponent; staffOnly?: boolean }> = {
  index: { label: 'Inicio', Icon: HouseIcon },
  talleres: { label: 'Talleres', Icon: FlaskIcon },
  ninos: { label: 'Niños', Icon: SmileyIcon },
  admin: { label: 'Admin', Icon: SquaresFourIcon, staffOnly: true },
};

/** Barra de pestañas flotante. En Niños cambia al estilo "laboratorio de juegos". */
export function BottomNav({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const colors = useColors();
  const labColors = useLabColors();
  const { mode } = useAppTheme();
  const { isStaff } = useAuth();
  const focusedName = state.routes[state.index]?.name;
  const isLab = focusedName === 'ninos';

  const barStyle = isLab
    ? { backgroundColor: labColors.surface, borderColor: labColors.line, borderWidth: 2, borderRadius: 22, shadowColor: labColors.shadow, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 0 }
    : { backgroundColor: colors.navBackground, borderColor: colors.line, borderWidth: 1, borderRadius: 20, shadowColor: '#06101F', shadowOpacity: mode === 'dark' ? 0.4 : 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 };
  const activeBackground = isLab ? labColors.lime : colors.navActive;
  const activeText = isLab ? labColors.onBright : colors.onNavActive;
  const inactiveText = isLab ? labColors.muted : colors.muted;

  return (
    <View style={[styles.bar, barStyle]}>
      {TAB_ORDER.map((name) => {
        const tab = tabs[name];
        const route = state.routes.find((item) => item.name === name);
        if (!route || (tab.staffOnly && !isStaff)) return null;
        const focused = focusedName === name;
        const color = focused ? activeText : inactiveText;

        const onPress = () => {
          // Mismo patrón que la barra oficial: avisa del toque y, si nadie lo cancela, cambia de pestaña.
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (focused || event.defaultPrevented) return;
          prepareTabTransition(focusedName, name);
          navigateToTab(route.key);
        };

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={route.key}
            onPress={onPress}
            style={[styles.item, focused && { backgroundColor: activeBackground }]}
          >
            <tab.Icon color={color} size={23} weight={focused ? 'fill' : 'duotone'} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 20, left: 16, right: 16, height: 72, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9 },
  item: { flex: 1, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11 },
});
