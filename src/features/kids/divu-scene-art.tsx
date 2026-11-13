import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Elementos del escenario del juego de Divu (dibujos vectoriales propios).

// Matas de pasto: [x, y, escala, color]. Posiciones fijas para que el paisaje no cambie en cada render.
const grassTufts: [number, number, number, string][] = [
  [14, 300, 0.8, '#B98B2F'], [52, 318, 1, '#9C7A28'], [96, 296, 0.7, '#B98B2F'], [132, 330, 1.1, '#8E9A3E'],
  [168, 304, 0.8, '#B98B2F'], [8, 360, 1.3, '#8E9A3E'], [62, 378, 1.2, '#9C7A28'], [118, 366, 1, '#B98B2F'],
  [150, 392, 1.3, '#8E9A3E'], [186, 352, 0.9, '#9C7A28'], [286, 300, 0.8, '#B98B2F'], [292, 380, 1.2, '#8E9A3E'],
  [104, 262, 0.55, '#B98B2F'], [150, 270, 0.6, '#9C7A28'], [30, 268, 0.6, '#8E9A3E'], [270, 264, 0.55, '#9C7A28'],
];

/**
 * Sabana africana en vertical: el hábitat natural de la pitón bola (África occidental y central).
 * Se ajusta a cualquier tamaño recortando los bordes (preserveAspectRatio "slice").
 */
export function SavannaBackground() {
  return (
    <Svg pointerEvents="none" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill} viewBox="0 0 300 400">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6FC3E6" />
          <Stop offset="0.55" stopColor="#B8E3EF" />
          <Stop offset="1" stopColor="#FCE6B2" />
        </LinearGradient>
        <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0CC78" />
          <Stop offset="0.5" stopColor="#DDAA52" />
          <Stop offset="1" stopColor="#C18A3C" />
        </LinearGradient>
        <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF3C4" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="mound" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#C98A4E" />
          <Stop offset="0.6" stopColor="#B06F38" />
          <Stop offset="1" stopColor="#8E5428" />
        </LinearGradient>
      </Defs>

      {/* Cielo, sol y aves */}
      <Rect x="0" y="0" width="300" height="250" fill="url(#sky)" />
      <Circle cx="228" cy="78" r="64" fill="url(#sunGlow)" />
      <Circle cx="228" cy="78" r="26" fill="#FFE48A" />
      <Path d="M54 74 q6 -6 12 0 q6 -6 12 0 M86 58 q5 -5 10 0 q5 -5 10 0 M70 46 q4 -4 8 0 q4 -4 8 0" stroke="#4B4B4B" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Colinas lejanas (azuladas por la distancia) */}
      <Path d="M0 214 Q50 190 104 208 T214 200 T300 210 V250 H0 Z" fill="#C3B6D6" opacity={0.75} />
      <Path d="M0 232 Q70 212 140 228 T300 224 V260 H0 Z" fill="#BFC48A" />

      {/* Suelo */}
      <Rect x="0" y="240" width="300" height="160" fill="url(#ground)" />
      <Path d="M0 250 Q80 242 150 252 T300 248" stroke="#F7DE9C" strokeWidth={3} fill="none" opacity={0.6} />

      {/* Acacias de copa plana */}
      <G>
        <Path d="M62 246 L64 212 M64 222 L52 206 M64 218 L78 204" stroke="#5C4026" strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx="62" cy="202" rx="34" ry="8" fill="#5E7B37" />
        <Ellipse cx="66" cy="198" rx="26" ry="6" fill="#6E8D42" />
      </G>
      <G>
        <Path d="M190 244 L193 190 M193 206 L176 182 M193 198 L214 178 M193 214 L206 196" stroke="#5C4026" strokeWidth={4} strokeLinecap="round" fill="none" />
        <Ellipse cx="194" cy="176" rx="52" ry="12" fill="#55712F" />
        <Ellipse cx="200" cy="170" rx="40" ry="9" fill="#6A8A3E" />
        <Ellipse cx="186" cy="172" rx="22" ry="5" fill="#7A9B48" />
      </G>

      {/* Termitero con la entrada de una madriguera: las pitones bola se refugian en ellas */}
      <Path d="M196 400 C 204 330, 220 268, 238 262 C 252 258, 262 300, 272 340 C 280 372, 286 392, 292 400 Z" fill="url(#mound)" />
      <Path d="M236 268 C 234 300, 232 340, 230 380" stroke="#D9A066" strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
      <Ellipse cx="246" cy="346" rx="16" ry="11" fill="#4A2E18" />
      <Ellipse cx="246" cy="343" rx="12" ry="7" fill="#2E1B0E" />

      {/* Matas de pasto */}
      {grassTufts.map(([x, y, s, color], i) => (
        <Path
          key={i}
          d={`M${x} ${y} q${-4 * s} ${-12 * s} ${-9 * s} ${-18 * s} M${x} ${y} q${1 * s} ${-16 * s} ${-1 * s} ${-24 * s} M${x} ${y} q${4 * s} ${-11 * s} ${10 * s} ${-17 * s}`}
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}

/** Bote de basura: aquí va la comida que Divu NO debe comer. */
export function TrashCan({ size = 76, open = false }: { size?: number; open?: boolean }) {
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 100 115">
      <Defs>
        <LinearGradient id="canBody" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5E7186" />
          <Stop offset="0.5" stopColor="#8EA2B6" />
          <Stop offset="1" stopColor="#4F6074" />
        </LinearGradient>
        <LinearGradient id="canLid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9DB0C3" />
          <Stop offset="1" stopColor="#647A90" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="50" cy="110" rx="34" ry="4" fill="#000000" opacity={0.18} />
      <Path d="M20 34 L80 34 L73 106 Q72 110 68 110 L32 110 Q28 110 27 106 Z" fill="url(#canBody)" />
      <Rect x="36" y="44" width="5" height="56" rx="2.5" fill="#3F4E60" opacity={0.45} />
      <Rect x="48" y="44" width="5" height="56" rx="2.5" fill="#3F4E60" opacity={0.45} />
      <Rect x="60" y="44" width="5" height="56" rx="2.5" fill="#3F4E60" opacity={0.45} />
      <G transform={open ? 'rotate(-28 18 30)' : undefined}>
        <Rect x="14" y="24" width="72" height="11" rx="5" fill="url(#canLid)" />
        <Rect x="40" y="16" width="20" height="9" rx="4" fill="#647A90" />
      </G>
    </Svg>
  );
}

/** Nube esponjosa para el cielo. */
export function Cloud({ width = 90 }: { width?: number }) {
  return (
    <Svg width={width} height={width * 0.5} viewBox="0 0 120 60">
      <Path
        d="M22 52 C 8 52, 6 36, 18 32 C 18 18, 36 12, 44 22 C 50 8, 74 8, 78 24 C 92 18, 108 28, 102 42 C 112 46, 108 56, 98 54 Z"
        fill="#FFFFFF"
        opacity={0.92}
      />
      <Path d="M24 50 C 40 54, 80 54, 98 50" stroke="#DCE8F2" strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
