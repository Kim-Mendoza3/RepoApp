import { StyleSheet } from 'react-native';

// Estilos que se repiten en varias pantallas.
export const textStyles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  pageTitle: { fontSize: 30, lineHeight: 34, fontWeight: '900', marginBottom: 24 },
  heading: { fontSize: 21, fontWeight: '800', marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, lineHeight: 18 },
});

export const glassStyles = StyleSheet.create({
  surface: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
});

// Efecto al presionar botones y tarjetas.
export const pressedStyle = { opacity: 0.7, transform: [{ scale: 0.97 }] } as const;
