import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useColors } from '@/context/theme-context';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Botones de la barra, EN EL ORDEN EN QUE SE MUESTRAN. `name` es el nombre del archivo en src/app/(app)/.
const tabs: { name: string; label: string; icon: IconName; staffOnly?: boolean }[] = [
  { name: 'index', label: 'Inicio', icon: 'home-variant-outline' },
  { name: 'talleres', label: 'Talleres', icon: 'school-outline' },
  { name: 'ninos', label: 'Niños', icon: 'flask-outline' },
  { name: 'admin', label: 'Admin', icon: 'view-dashboard-outline', staffOnly: true },
];

/** Barra de pestañas flotante. Expo Router le pasa las rutas y la forma de navegar entre ellas. */
export function BottomNav({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const colors = useColors();
  const { isStaff } = useAuth();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {tabs.map((tab) => {
        const route = state.routes.find((item) => item.name === tab.name);
        if (!route || (tab.staffOnly && !isStaff)) return null;
        const focused = focusedName === tab.name;
        const color = focused ? colors.blue : colors.muted;

        const onPress = () => {
          // Mismo patrón que la barra oficial: avisa del toque y, si nadie lo cancela, cambia de pestaña.
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={route.key}
            onPress={onPress}
            style={styles.item}
          >
            <MaterialCommunityIcons color={color} name={tab.icon} size={22} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 18, left: 20, right: 20, height: 72, borderRadius: 24, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', elevation: 5 },
  item: { alignItems: 'center', gap: 2, minWidth: 58 },
  label: { fontSize: 11, fontWeight: '700' },
});
