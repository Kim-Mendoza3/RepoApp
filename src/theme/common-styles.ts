import { StyleSheet } from 'react-native';

import { fonts } from '@/theme/fonts';

// Estilos de texto que se repiten en varias pantallas.
export const textStyles = StyleSheet.create({
  /** Etiqueta tipo código, p. ej. "// catálogo · 13 talleres". */
  label: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.2 },
  /** Título grande de pantalla. */
  pageTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  /** Título de sección o de tarjeta destacada. */
  heading: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, letterSpacing: -0.3 },
  /** Título de tarjeta pequeña. */
  cardTitle: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});

export const shadowStyles = StyleSheet.create({
  soft: { shadowColor: '#06101F', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
});

// Efecto al presionar botones y tarjetas.
export const pressedStyle = { opacity: 0.75, transform: [{ scale: 0.97 }] } as const;
