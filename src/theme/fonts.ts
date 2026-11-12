import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

// Archivos de fuente que se cargan al abrir la app (ver src/app/_layout.tsx).
export const fontAssets = {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  JetBrainsMono_600SemiBold, JetBrainsMono_700Bold,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
};

// En React Native, con fuentes propias cada grosor es una familia distinta.
// Por eso usamos `fontFamily` en vez de `fontWeight` (en Android fontWeight elegiría otra fuente).
export const fonts = {
  /** Títulos: Space Grotesk. */
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  /** Textos: Inter. */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  /** Etiquetas tipo código: JetBrains Mono. */
  mono: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const;
