import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// ACCESORIOS DE DIVU
// Se dibujan ENCIMA de la imagen de Divu (que no se modifica): así Divu se ve exactamente igual
// y en cada minijuego puede llevar algo del tema (sombrero de explorador, casco de astronauta…).
// Las posiciones están medidas sobre las imágenes originales de 768 × 512 px; cada cara tiene la
// cabeza en un lugar un poco distinto, por eso cada una tiene su propia posición e inclinación.

export type DivuFace = 'normal' | 'happy' | 'disgust';
const IMAGE_WIDTH = 768;

/** Dónde va el sombrero en cada cara: centro (cx), línea del ala (brimY), ancho e inclinación. */
const HAT_PLACEMENT: Record<DivuFace, { cx: number; brimY: number; width: number; rotate: number }> = {
  normal: { cx: 258, brimY: 84, width: 200, rotate: -9 },
  happy: { cx: 242, brimY: 62, width: 200, rotate: -6 },
  disgust: { cx: 276, brimY: 84, width: 200, rotate: 2 },
};
const HAT_RATIO = 0.62; // alto / ancho del dibujo del sombrero
const BRIM_AT = 0.78; // el ala está al 78 % del alto del dibujo

/** Sombrero de explorador (casco "salacot"), el que usan los entomólogos en el campo. */
function SafariHat({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * HAT_RATIO} viewBox="0 0 200 124">
      <Defs>
        <LinearGradient id="hatDome" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B89B62" />
          <Stop offset="0.45" stopColor="#E3CC93" />
          <Stop offset="1" stopColor="#A88A52" />
        </LinearGradient>
        <LinearGradient id="hatBrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D8BF85" />
          <Stop offset="1" stopColor="#9C7E47" />
        </LinearGradient>
      </Defs>
      {/* Ala ancha (da sombra en el campo) */}
      <Ellipse cx="100" cy="97" rx="96" ry="20" fill="url(#hatBrim)" stroke="#5B4524" strokeWidth={3} />
      {/* Copa redondeada */}
      <Path d="M30 96 C 30 40, 62 14, 100 14 C 138 14, 170 40, 170 96 Z" fill="url(#hatDome)" stroke="#5B4524" strokeWidth={3} />
      {/* Cinta café */}
      <Path d="M32 80 C 60 90, 140 90, 168 80 L170 94 C 140 104, 60 104, 30 94 Z" fill="#6B4A2B" stroke="#4A3219" strokeWidth={2} />
      {/* Costuras y botón de ventilación */}
      <Path d="M100 16 L100 82 M70 22 C 62 42, 58 62, 58 84 M130 22 C 138 42, 142 62, 142 84" stroke="#8C7040" strokeWidth={2} fill="none" opacity={0.7} />
      <Rect x="92" y="6" width="16" height="10" rx="5" fill="#8C7040" stroke="#5B4524" strokeWidth={2} />
      {/* Brillo */}
      <Path d="M58 40 C 66 28, 80 22, 92 21" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.45} />
    </Svg>
  );
}

/**
 * Accesorio colocado sobre la cabeza de Divu. Va dentro de la misma capa que la imagen de la
 * cara (`boxWidth` = ancho con el que se dibuja a Divu), para moverse y desvanecerse con ella.
 */
export function DivuAccessory({ kind, face, boxWidth }: { kind: 'safari'; face: DivuFace; boxWidth: number }) {
  const scale = boxWidth / IMAGE_WIDTH;
  const place = HAT_PLACEMENT[face];
  const width = place.width * scale;
  const height = width * HAT_RATIO;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: place.cx * scale - width / 2,
        top: place.brimY * scale - height * BRIM_AT,
        width,
        height,
        transform: [{ rotate: `${place.rotate}deg` }],
      }}
    >
      {kind === 'safari' ? <SafariHat width={width} /> : null}
    </View>
  );
}
