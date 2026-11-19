import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

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


/** Dónde va el casco de astronauta en cada cara: centro de la burbuja (cx, cy) y radio. */
const HELMET_PLACEMENT: Record<DivuFace, { cx: number; cy: number; r: number }> = {
  normal: { cx: 236, cy: 128, r: 128 },
  happy: { cx: 232, cy: 104, r: 132 },
  disgust: { cx: 262, cy: 128, r: 128 },
};

/** Casco de astronauta: burbuja de vidrio transparente con brillos y un aro metálico abajo. */
function AstronautHelmet({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="helmetGlass" cx="38%" cy="32%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="0.6" stopColor="#BAE6FD" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#7DD3FC" stopOpacity={0.3} />
        </RadialGradient>
        <LinearGradient id="helmetRing" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#94A3B8" />
          <Stop offset="0.5" stopColor="#F1F5F9" />
          <Stop offset="1" stopColor="#64748B" />
        </LinearGradient>
      </Defs>
      {/* Burbuja de vidrio (casi transparente: Divu se ve completo adentro) */}
      <Circle cx="100" cy="96" r="88" fill="url(#helmetGlass)" stroke="#E0F2FE" strokeWidth={4} opacity={0.95} />
      <Circle cx="100" cy="96" r="88" fill="none" stroke="#0B1B2B" strokeWidth={1.5} opacity={0.35} />
      {/* Brillos del vidrio */}
      <Path d="M44 70 C 50 46, 68 30, 92 24" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.75} />
      <Path d="M40 92 C 40 86, 41 82, 42 79" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
      <Circle cx="150" cy="140" r="6" fill="#FFFFFF" opacity={0.45} />
      {/* Aro metálico del cuello (donde sale el cuello de Divu, a la derecha de la cara) */}
      <Ellipse cx="124" cy="176" rx="52" ry="12" fill="url(#helmetRing)" stroke="#334155" strokeWidth={2.5} transform="rotate(-6 124 176)" />
      <Rect x="88" y="170" width="70" height="4" rx="2" fill="#FFFFFF" opacity={0.5} transform="rotate(-6 124 176)" />
    </Svg>
  );
}

/**
 * Accesorio colocado sobre la cabeza de Divu. Va dentro de la misma capa que la imagen de la
 * cara (`boxWidth` = ancho con el que se dibuja a Divu), para moverse y desvanecerse con ella.
 */
export function DivuAccessory({ kind, face, boxWidth }: { kind: 'safari' | 'astronaut'; face: DivuFace; boxWidth: number }) {
  const scale = boxWidth / IMAGE_WIDTH;
  if (kind === 'astronaut') {
    const helmet = HELMET_PLACEMENT[face];
    // El dibujo mide 200: la burbuja (r=88) está centrada en (100, 96).
    const size = (helmet.r * 2 * 200 * scale) / 176;
    return (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: helmet.cx * scale - size / 2, top: helmet.cy * scale - (size * 96) / 200, width: size, height: size }}
      >
        <AstronautHelmet size={size} />
      </View>
    );
  }
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
