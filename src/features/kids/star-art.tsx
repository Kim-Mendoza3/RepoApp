import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// ILUSTRACIONES DEL JUEGO "UNE LAS ESTRELLAS"

export type StarPoint = { x: number; y: number };

// Estrellitas lejanas del fondo (posiciones fijas).
const DUST = Array.from({ length: 70 }, (_, i) => ({ x: ((i * 37 + 7) % 300), y: ((i * 61 + 13) % 300), r: i % 5 === 0 ? 1.3 : 0.7, o: 0.35 + ((i * 13) % 5) / 10 }));

/** Cielo nocturno (lienzo 300 × 400, se recorta para llenar cualquier proporción): luna, nebulosa y colinas. */
export function NightSkyBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#050A24" />
          <Stop offset="0.6" stopColor="#0B1650" />
          <Stop offset="1" stopColor="#1E2A78" />
        </LinearGradient>
        <RadialGradient id="nebula" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#8B5CF6" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="nebula2" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#22D3EE" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#22D3EE" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0.35" stopColor="#E0E7FF" stopOpacity={0.4} />
          <Stop offset="1" stopColor="#E0E7FF" stopOpacity={0} />
        </RadialGradient>
        {/* Superficie de la luna: luz desde arriba a la izquierda, borde un poco más oscuro */}
        <RadialGradient id="moonSurface" cx="38%" cy="34%" r="70%">
          <Stop offset="0" stopColor="#FFFDF5" />
          <Stop offset="0.65" stopColor="#ECE7D8" />
          <Stop offset="1" stopColor="#B9B3A3" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="400" fill="url(#nightSky)" />
      <Ellipse cx="80" cy="150" rx="120" ry="70" fill="url(#nebula)" />
      <Ellipse cx="230" cy="250" rx="110" ry="60" fill="url(#nebula2)" />
      {DUST.map((star, i) => <Circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#E0E7FF" opacity={star.o} />)}
      {/* Luna llena con "mares" y cráteres, y su resplandor (lejos del borde: en pantallas altas se recortan los lados) */}
      <Circle cx="214" cy="58" r="44" fill="url(#moonGlow)" />
      <Circle cx="214" cy="58" r="19" fill="url(#moonSurface)" />
      <Ellipse cx="208" cy="52" rx="6" ry="4.5" fill="#B8B2A2" opacity={0.55} />
      <Ellipse cx="220" cy="62" rx="5" ry="3.5" fill="#B8B2A2" opacity={0.5} />
      <Ellipse cx="211" cy="67" rx="3.5" ry="2.5" fill="#B8B2A2" opacity={0.45} />
      <Circle cx="223" cy="50" r="2.2" fill="#A8A293" opacity={0.6} />
      <Circle cx="203" cy="62" r="1.6" fill="#A8A293" opacity={0.55} />
      <Circle cx="217" cy="71" r="1.3" fill="#A8A293" opacity={0.5} />
      <Circle cx="214" cy="58" r="19" fill="none" stroke="#FFFFFF" strokeWidth={0.8} opacity={0.5} />
      {/* Colinas en silueta */}
      <Path d="M0 340 Q 50 312 100 330 Q 160 300 220 326 Q 260 312 300 322 L300 400 L0 400 Z" fill="#141B4D" />
      <Path d="M0 362 Q 70 340 140 356 Q 210 336 300 352 L300 400 L0 400 Z" fill="#0C1238" />
      {/* Pequeño telescopio sobre la colina */}
      <Line x1="40" y1="338" x2="34" y2="356" stroke="#64748B" strokeWidth={2} />
      <Line x1="40" y1="338" x2="46" y2="356" stroke="#64748B" strokeWidth={2} />
      <Rect x="30" y="326" width="22" height="7" rx="3" fill="#94A3B8" transform="rotate(-28 41 330)" />
    </Svg>
  );
}

/** Carta estelar: la figura de la constelación en pequeño (líneas y puntos), para saber qué dibujar. */
export function ConstellationChart({ stars, path, width, height, color = '#7DE3F4' }: { stars: StarPoint[]; path: (number | null)[]; width: number; height: number; color?: string }) {
  const pad = 8;
  const px = (point: StarPoint) => ({ x: pad + point.x * (width - pad * 2), y: pad + point.y * (height - pad * 2) });
  const segments: [number, number][] = [];
  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1];
    const to = path[i];
    if (from !== null && to !== null) segments.push([from, to]);
  }
  return (
    <Svg width={width} height={height}>
      {segments.map(([from, to], i) => {
        const a = px(stars[from]);
        const b = px(stars[to]);
        return <Line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.85} />;
      })}
      {stars.map((star, i) => {
        const p = px(star);
        return <Circle key={i} cx={p.x} cy={p.y} r={3} fill="#FFFFFF" />;
      })}
    </Svg>
  );
}
