import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Elementos del escenario del juego de Divu (dibujos vectoriales propios).

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
