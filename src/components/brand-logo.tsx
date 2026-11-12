import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

export const logoSource = require('@/assets/images/De-Divulgadores-logo100x102.png');

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image contentFit="contain" source={logoSource} style={[styles.logo, logoStyles.outline, compact && styles.compact]} />;
}

// Contorno blanco suave para que el logo resalte sobre fondos de color.
export const logoStyles = StyleSheet.create({
  outline: { shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 2.5, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
});

const styles = StyleSheet.create({
  logo: { width: 112, height: 114 },
  compact: { width: 76, height: 77 },
});
