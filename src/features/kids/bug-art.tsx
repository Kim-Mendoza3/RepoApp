import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// ILUSTRACIONES DEL JUEGO "¿INSECTO O ARÁCNIDO?"
// Dibujos propios vistos desde arriba, con las PATAS BIEN VISIBLES para poder contarlas:
// los insectos tienen 6 (3 pares que salen del tórax) y los arácnidos 8 (4 pares).
// Lienzo de 100 × 100, escalado con `size`.

export type BugKind = 'hormiga' | 'abeja' | 'mariposa' | 'catarina' | 'grillo' | 'mosquito' | 'arana' | 'tarantula' | 'alacran';

export function BugArt({ kind, size = 96 }: { kind: BugKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="50" cy="92" rx="28" ry="4.5" fill="#000000" opacity={0.14} />
      {kind === 'hormiga' && <Ant />}
      {kind === 'abeja' && <Bee />}
      {kind === 'mariposa' && <Butterfly />}
      {kind === 'catarina' && <Ladybug />}
      {kind === 'grillo' && <Cricket />}
      {kind === 'mosquito' && <Mosquito />}
      {kind === 'arana' && <Spider />}
      {kind === 'tarantula' && <Tarantula />}
      {kind === 'alacran' && <Scorpion />}
    </Svg>
  );
}

/** Pata articulada: sale del cuerpo, dobla en la "rodilla" y termina en la punta. */
function Leg({ d, color, width }: { d: string; color: string; width: number }) {
  return <Path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

/** 6 patas de insecto desde el tórax (centro en y): delanteras hacia adelante, traseras hacia atrás. */
function InsectLegs({ y, color, width = 2.6, reach = 1 }: { y: number; color: string; width?: number; reach?: number }) {
  const r = reach;
  const legs = [
    `M46 ${y - 4} L${38 - 6 * r} ${y - 10} L${33 - 8 * r} ${y - 20 * r}`,
    `M45 ${y} L${32 - 8 * r} ${y - 2} L${24 - 10 * r} ${y + 6}`,
    `M46 ${y + 4} L${36 - 6 * r} ${y + 14} L${32 - 8 * r} ${y + 26 * r}`,
  ];
  return (
    <G>
      {legs.map((d) => <Leg key={d} d={d} color={color} width={width} />)}
      {/* Las mismas tres patas, reflejadas del lado derecho. */}
      <G transform="translate(100 0) scale(-1 1)">
        {legs.map((d) => <Leg key={`r${d}`} d={d} color={color} width={width} />)}
      </G>
    </G>
  );
}

/** 8 patas de arácnido desde el cefalotórax: 4 pares con la rodilla levantada. */
function ArachnidLegs({ y, color, width = 2.8, reach = 1 }: { y: number; color: string; width?: number; reach?: number }) {
  const r = reach;
  const legs = [
    `M45 ${y - 5} L${34 - 6 * r} ${y - 16} L${24 - 8 * r} ${y - 26 * r}`,
    `M44 ${y - 2} L${28 - 8 * r} ${y - 8} L${16 - 10 * r} ${y - 2}`,
    `M44 ${y + 2} L${28 - 8 * r} ${y + 6} L${17 - 10 * r} ${y + 18 * r}`,
    `M45 ${y + 5} L${33 - 7 * r} ${y + 16} L${27 - 8 * r} ${y + 32 * r}`,
  ];
  return (
    <G>
      {legs.map((d) => <Leg key={d} d={d} color={color} width={width} />)}
      <G transform="translate(100 0) scale(-1 1)">
        {legs.map((d) => <Leg key={`r${d}`} d={d} color={color} width={width} />)}
      </G>
    </G>
  );
}

function Eyes({ x = 50, y, gap = 4.5, r = 2.2 }: { x?: number; y: number; gap?: number; r?: number }) {
  return (
    <G>
      <Circle cx={x - gap} cy={y} r={r} fill="#FFFFFF" />
      <Circle cx={x + gap} cy={y} r={r} fill="#FFFFFF" />
      <Circle cx={x - gap + 0.4} cy={y + 0.3} r={r * 0.55} fill="#111827" />
      <Circle cx={x + gap + 0.4} cy={y + 0.3} r={r * 0.55} fill="#111827" />
    </G>
  );
}

function Ant() {
  return (
    <G>
      <Defs>
        <RadialGradient id="antBody" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#A1452E" />
          <Stop offset="1" stopColor="#4A160C" />
        </RadialGradient>
      </Defs>
      <InsectLegs y={42} color="#3B1209" width={2.4} reach={1.1} />
      {/* Antenas en codo */}
      <Path d="M46 20 L40 12 L32 10" fill="none" stroke="#3B1209" strokeWidth={2} strokeLinecap="round" />
      <Path d="M54 20 L60 12 L68 10" fill="none" stroke="#3B1209" strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx="50" cy="68" rx="13" ry="16" fill="url(#antBody)" />
      <Ellipse cx="50" cy="52" rx="3" ry="3" fill="#5A1D10" />
      <Ellipse cx="50" cy="42" rx="7" ry="8" fill="url(#antBody)" />
      <Circle cx="50" cy="25" r="9" fill="url(#antBody)" />
      <Ellipse cx="46" cy="64" rx="5" ry="7" fill="#FFFFFF" opacity={0.18} />
      <Eyes y={24} gap={4.5} r={2} />
    </G>
  );
}

function Bee() {
  return (
    <G>
      <Defs>
        <RadialGradient id="beeBody" cx="40%" cy="35%" r="75%">
          <Stop offset="0" stopColor="#FFE27A" />
          <Stop offset="1" stopColor="#E9A400" />
        </RadialGradient>
        <ClipPath id="beeAbdomen">
          <Ellipse cx="50" cy="66" rx="15" ry="19" />
        </ClipPath>
      </Defs>
      {/* Alas transparentes */}
      <Ellipse cx="32" cy="38" rx="15" ry="9" fill="#E0F2FE" opacity={0.75} transform="rotate(-25 32 38)" />
      <Ellipse cx="68" cy="38" rx="15" ry="9" fill="#E0F2FE" opacity={0.75} transform="rotate(25 68 38)" />
      <InsectLegs y={44} color="#1F2937" width={2.6} reach={0.9} />
      <Path d="M46 18 Q42 8 36 8" fill="none" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" />
      <Path d="M54 18 Q58 8 64 8" fill="none" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx="50" cy="66" rx="15" ry="19" fill="url(#beeBody)" />
      <G clipPath="url(#beeAbdomen)">
        <Rect x="30" y="58" width="40" height="5" fill="#1F2937" />
        <Rect x="30" y="68" width="40" height="5" fill="#1F2937" />
        <Rect x="30" y="78" width="40" height="5" fill="#1F2937" />
      </G>
      <Ellipse cx="50" cy="43" rx="11" ry="10" fill="#B7791F" />
      <Ellipse cx="47" cy="40" rx="5" ry="4" fill="#F6C453" opacity={0.6} />
      <Circle cx="50" cy="25" r="8" fill="#1F2937" />
      <Eyes y={24} gap={4} r={2} />
    </G>
  );
}

function Butterfly() {
  return (
    <G>
      <Defs>
        <LinearGradient id="wingTop" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDBA74" />
          <Stop offset="1" stopColor="#EA580C" />
        </LinearGradient>
      </Defs>
      {/* Alas (monarca): naranja con borde negro y puntos blancos */}
      <Path d="M48 40 C 34 18, 10 14, 8 30 C 6 44, 26 50, 48 48 Z" fill="url(#wingTop)" stroke="#1F2937" strokeWidth={2.5} />
      <Path d="M52 40 C 66 18, 90 14, 92 30 C 94 44, 74 50, 52 48 Z" fill="url(#wingTop)" stroke="#1F2937" strokeWidth={2.5} />
      <Path d="M48 52 C 30 52, 16 62, 22 74 C 28 84, 44 76, 48 60 Z" fill="url(#wingTop)" stroke="#1F2937" strokeWidth={2.5} />
      <Path d="M52 52 C 70 52, 84 62, 78 74 C 72 84, 56 76, 52 60 Z" fill="url(#wingTop)" stroke="#1F2937" strokeWidth={2.5} />
      {/* Venas en naranja oscuro (no negras) para no confundirlas con las patas */}
      <Path d="M44 42 L20 26 M44 46 L14 38 M46 56 L28 68" stroke="#9A3412" strokeWidth={1} opacity={0.6} />
      <Path d="M56 42 L80 26 M56 46 L86 38 M54 56 L72 68" stroke="#9A3412" strokeWidth={1} opacity={0.6} />
      {[[14, 28], [18, 22], [86, 28], [82, 22], [26, 76], [74, 76]].map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} fill="#FFFFFF" />)}
      {/* Las 6 patitas, encima de las alas para poder contarlas */}
      <InsectLegs y={48} color="#111827" width={2.4} reach={0.75} />
      <Path d="M48 30 Q44 18 38 14" fill="none" stroke="#111827" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M52 30 Q56 18 62 14" fill="none" stroke="#111827" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="38" cy="14" r="1.8" fill="#111827" />
      <Circle cx="62" cy="14" r="1.8" fill="#111827" />
      <Ellipse cx="50" cy="56" rx="4" ry="20" fill="#1F2937" />
      <Circle cx="50" cy="32" r="5" fill="#1F2937" />
    </G>
  );
}

function Ladybug() {
  return (
    <G>
      <Defs>
        <RadialGradient id="ladyShell" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FF6B6B" />
          <Stop offset="1" stopColor="#C81E1E" />
        </RadialGradient>
      </Defs>
      <InsectLegs y={52} color="#111827" width={2.8} reach={1.05} />
      <Path d="M45 26 Q40 16 34 14" fill="none" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
      <Path d="M55 26 Q60 16 66 14" fill="none" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx="50" cy="31" rx="11" ry="8" fill="#111827" />
      <Ellipse cx="50" cy="58" rx="25" ry="26" fill="url(#ladyShell)" />
      <Line x1="50" y1="33" x2="50" y2="84" stroke="#111827" strokeWidth={2} />
      {[[38, 48, 5], [62, 48, 5], [36, 66, 4.5], [64, 66, 4.5], [44, 78, 3.5], [56, 78, 3.5]].map(([cx, cy, r]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#111827" />)}
      <Ellipse cx="40" cy="44" rx="6" ry="4" fill="#FFFFFF" opacity={0.3} />
      <Circle cx="44" cy="31" r="2.2" fill="#FFFFFF" />
      <Circle cx="56" cy="31" r="2.2" fill="#FFFFFF" />
    </G>
  );
}

function Cricket() {
  return (
    <G>
      <Defs>
        <LinearGradient id="cricketWing" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5C3D1E" />
          <Stop offset="0.5" stopColor="#8B5E34" />
          <Stop offset="1" stopColor="#5C3D1E" />
        </LinearGradient>
      </Defs>
      {/* Antenas muy largas */}
      <Path d="M47 16 Q36 4 16 6" fill="none" stroke="#3F2A14" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M53 16 Q64 4 84 6" fill="none" stroke="#3F2A14" strokeWidth={1.5} strokeLinecap="round" />
      {/* Patas delanteras y medias */}
      <Leg d="M46 30 L36 26 L30 18" color="#3F2A14" width={2.4} />
      <Leg d="M54 30 L64 26 L70 18" color="#3F2A14" width={2.4} />
      <Leg d="M45 38 L32 40 L24 46" color="#3F2A14" width={2.4} />
      <Leg d="M55 38 L68 40 L76 46" color="#3F2A14" width={2.4} />
      {/* Patas traseras saltadoras: muslo grueso */}
      <Path d="M45 46 L28 62 L32 86" fill="none" stroke="#6B4423" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M55 46 L72 62 L68 86" fill="none" stroke="#6B4423" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M50 32 C 38 34, 38 80, 50 86 C 62 80, 62 34, 50 32 Z" fill="url(#cricketWing)" />
      <Line x1="50" y1="36" x2="50" y2="84" stroke="#3F2A14" strokeWidth={1.2} />
      <Rect x="40" y="26" width="20" height="10" rx="4" fill="#4A3218" />
      <Circle cx="50" cy="20" r="8" fill="#5C3D1E" />
      <Eyes y={19} gap={4} r={2} />
    </G>
  );
}

function Mosquito() {
  return (
    <G>
      {/* Alas angostas */}
      <Ellipse cx="34" cy="44" rx="16" ry="5" fill="#E0F2FE" opacity={0.8} transform="rotate(-30 34 44)" />
      <Ellipse cx="66" cy="44" rx="16" ry="5" fill="#E0F2FE" opacity={0.8} transform="rotate(30 66 44)" />
      {/* 6 patas largas y finas */}
      <Leg d="M47 38 L34 30 L20 12" color="#374151" width={1.6} />
      <Leg d="M53 38 L66 30 L80 12" color="#374151" width={1.6} />
      <Leg d="M46 42 L28 44 L10 58" color="#374151" width={1.6} />
      <Leg d="M54 42 L72 44 L90 58" color="#374151" width={1.6} />
      <Leg d="M47 46 L34 62 L26 90" color="#374151" width={1.6} />
      <Leg d="M53 46 L66 62 L74 90" color="#374151" width={1.6} />
      <Ellipse cx="50" cy="66" rx="5.5" ry="20" fill="#6B7280" />
      {[56, 63, 70, 77].map((y) => <Rect key={y} x="44.5" y={y} width="11" height="2.5" fill="#D1D5DB" opacity={0.8} />)}
      <Ellipse cx="50" cy="41" rx="7" ry="7" fill="#4B5563" />
      <Circle cx="50" cy="29" r="5.5" fill="#374151" />
      {/* Probóscide (la "trompa" con la que pican las hembras) */}
      <Line x1="50" y1="24" x2="50" y2="10" stroke="#374151" strokeWidth={1.4} strokeLinecap="round" />
      <Eyes y={28} gap={3} r={1.6} />
    </G>
  );
}

function Spider() {
  return (
    <G>
      <Defs>
        <RadialGradient id="spiderBody" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#4B5563" />
          <Stop offset="1" stopColor="#111827" />
        </RadialGradient>
      </Defs>
      <ArachnidLegs y={40} color="#1F2937" width={2.6} reach={1.05} />
      <Ellipse cx="50" cy="64" rx="17" ry="19" fill="url(#spiderBody)" />
      <Path d="M50 52 L44 60 L50 66 L56 60 Z M50 68 L45 74 L50 79 L55 74 Z" fill="#F59E0B" opacity={0.85} />
      <Ellipse cx="50" cy="38" rx="11" ry="10" fill="url(#spiderBody)" />
      {/* Muchos ojitos (las arañas suelen tener 8) */}
      <Eyes y={34} gap={4} r={2.2} />
      <Circle cx="43" cy="38" r="1.2" fill="#E5E7EB" />
      <Circle cx="57" cy="38" r="1.2" fill="#E5E7EB" />
      <Path d="M46 29 Q44 24 47 22 M54 29 Q56 24 53 22" fill="none" stroke="#1F2937" strokeWidth={2.4} strokeLinecap="round" />
    </G>
  );
}

function Tarantula() {
  return (
    <G>
      <Defs>
        <RadialGradient id="taraBody" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#8B5E3C" />
          <Stop offset="1" stopColor="#3E2516" />
        </RadialGradient>
      </Defs>
      <ArachnidLegs y={42} color="#4A2E1C" width={5} reach={1} />
      {/* Bandas naranjas en las "rodillas" */}
      {[[28, 26], [22, 34], [22, 48], [27, 58], [72, 26], [78, 34], [78, 48], [73, 58]].map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.6} fill="#F97316" />)}
      <Ellipse cx="50" cy="66" rx="17" ry="18" fill="url(#taraBody)" />
      {/* Pelitos */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const x1 = 50 + Math.cos(a) * 16;
        const y1 = 66 + Math.sin(a) * 17;
        return <Line key={i} x1={x1} y1={y1} x2={x1 + Math.cos(a) * 3.5} y2={y1 + Math.sin(a) * 3.5} stroke="#3E2516" strokeWidth={1.2} strokeLinecap="round" />;
      })}
      <Ellipse cx="50" cy="40" rx="12" ry="11" fill="url(#taraBody)" />
      <Path d="M46 30 Q42 24 46 21 M54 30 Q58 24 54 21" fill="none" stroke="#4A2E1C" strokeWidth={4} strokeLinecap="round" />
      <Eyes y={36} gap={3.5} r={2} />
    </G>
  );
}

function Scorpion() {
  return (
    <G>
      <Defs>
        <LinearGradient id="scorpBody" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B7791F" />
          <Stop offset="0.5" stopColor="#E0A93B" />
          <Stop offset="1" stopColor="#B7791F" />
        </LinearGradient>
      </Defs>
      {/* Pedipalpos con pinzas (¡no son patas!) */}
      <Path d="M44 30 L32 22 L26 12" fill="none" stroke="#A16207" strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M56 30 L68 22 L74 12" fill="none" stroke="#A16207" strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M26 12 C 18 10, 16 2, 22 2 C 24 6, 27 7, 30 6 C 32 9, 30 12, 26 12 Z" fill="#CA8A04" />
      <Path d="M74 12 C 82 10, 84 2, 78 2 C 76 6, 73 7, 70 6 C 68 9, 70 12, 74 12 Z" fill="#CA8A04" />
      {/* 8 patas a los lados del cuerpo */}
      <Leg d="M44 38 L32 36 L22 30" color="#A16207" width={2.4} />
      <Leg d="M44 43 L30 44 L18 42" color="#A16207" width={2.4} />
      <Leg d="M44 48 L30 52 L20 58" color="#A16207" width={2.4} />
      <Leg d="M45 53 L34 60 L28 70" color="#A16207" width={2.4} />
      <Leg d="M56 38 L68 36 L78 30" color="#A16207" width={2.4} />
      <Leg d="M56 43 L70 44 L82 42" color="#A16207" width={2.4} />
      <Leg d="M56 48 L70 52 L80 58" color="#A16207" width={2.4} />
      <Leg d="M55 53 L66 60 L72 70" color="#A16207" width={2.4} />
      {/* Cola segmentada que se curva, con el aguijón */}
      <Path d="M50 60 C 50 74, 52 84, 62 88 C 72 92, 80 84, 76 76" fill="none" stroke="url(#scorpBody)" strokeWidth={7} strokeLinecap="round" />
      <Path d="M76 76 C 74 70, 80 66, 84 70 C 82 72, 80 74, 76 76 Z" fill="#78350F" />
      <Ellipse cx="50" cy="46" rx="9" ry="16" fill="url(#scorpBody)" />
      {[40, 46, 52].map((y) => <Line key={y} x1="42" y1={y} x2="58" y2={y} stroke="#92400E" strokeWidth={1} opacity={0.7} />)}
      <Ellipse cx="50" cy="31" rx="8" ry="6" fill="#CA8A04" />
      <Eyes y={30} gap={3} r={1.6} />
    </G>
  );
}

// ---------------------------------------------------------------------------
// ESCENARIO: jardín (lienzo 300 × 400, se recorta para llenar cualquier proporción)
// ---------------------------------------------------------------------------

export function GardenBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A7E3F7" />
          <Stop offset="1" stopColor="#E9F8EC" />
        </LinearGradient>
        <LinearGradient id="gardenGrass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD770" />
          <Stop offset="1" stopColor="#4E9F3D" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="400" fill="url(#gardenSky)" />
      <Circle cx="250" cy="60" r="26" fill="#FFE58A" opacity={0.9} />
      {/* Seto lejano */}
      <Path d="M0 210 Q 20 180 45 200 Q 70 170 100 198 Q 130 175 160 200 Q 190 172 220 198 Q 250 178 300 196 L300 240 L0 240 Z" fill="#6DBF5B" />
      <Path d="M0 225 Q 40 205 80 222 Q 130 200 180 222 Q 230 204 300 220 L300 260 L0 260 Z" fill="#58A84A" />
      <Rect x="0" y="240" width="300" height="160" fill="url(#gardenGrass)" />
      {/* Flores */}
      {[[30, 250, '#F472B6'], [90, 262, '#FDE047'], [150, 248, '#FFFFFF'], [215, 258, '#F472B6'], [270, 246, '#FDE047']].map(([x, y, color]) => (
        <G key={`${x}`}>
          <Line x1={x as number} y1={y as number} x2={x as number} y2={(y as number) + 26} stroke="#3F8F34" strokeWidth={2} />
          {[0, 72, 144, 216, 288].map((a) => (
            <Circle key={a} cx={(x as number) + Math.cos((a * Math.PI) / 180) * 5} cy={(y as number) + Math.sin((a * Math.PI) / 180) * 5} r={4} fill={color as string} />
          ))}
          <Circle cx={x as number} cy={y as number} r={3} fill="#F59E0B" />
        </G>
      ))}
      {/* Hojitas de pasto */}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 8 + i * 13.5;
        const y = 300 + ((i * 37) % 80);
        return <Path key={i} d={`M${x} ${y} q -3 -12 -7 -16 M${x} ${y} q 1 -14 4 -18 M${x} ${y} q 4 -10 9 -12`} stroke="#3F8F34" strokeWidth={1.8} fill="none" strokeLinecap="round" />;
      })}
      {/* Piedra y hoja seca */}
      <Ellipse cx="150" cy="350" rx="26" ry="10" fill="#A8A29E" />
      <Ellipse cx="144" cy="346" rx="10" ry="4" fill="#D6D3D1" opacity={0.6} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// FRASCO DE VIDRIO (lienzo 100 × 125). Se dibuja en tres capas para que los
// bichos atrapados se vean DENTRO: fondo del vidrio → bichos → brillo del vidrio.
// ---------------------------------------------------------------------------

export const JAR_RATIO = 1.25;
/** Zona interior del frasco (en % del ancho/alto del dibujo), donde se acomodan los bichos. */
export const JAR_INSIDE = { left: 18, right: 82, top: 34, bottom: 92 };
/** Tapa: franja superior del dibujo (de y=4 a y=24) y su bisagra. */
export const JAR_LID = { top: 4, height: 20, hingeX: 14, hingeY: 22 };

export function JarBack({ size = 110, tint }: { size?: number; tint: string }) {
  return (
    <Svg width={size} height={size * JAR_RATIO} viewBox="0 0 100 125">
      <Ellipse cx="50" cy="120" rx="38" ry="4" fill="#000000" opacity={0.18} />
      {/* Cuello y cuerpo del frasco: vidrio con un leve tinte de color */}
      <Path d="M24 22 L76 22 L76 30 Q90 34 90 48 L90 104 Q90 116 78 116 L22 116 Q10 116 10 104 L10 48 Q10 34 24 30 Z" fill={tint} opacity={0.28} />
      <Path d="M14 98 Q50 106 86 98 L86 104 Q86 112 78 112 L22 112 Q14 112 14 104 Z" fill="#8B5A2B" opacity={0.35} />
    </Svg>
  );
}

export function JarFront({ size = 110 }: { size?: number }) {
  return (
    <Svg width={size} height={size * JAR_RATIO} viewBox="0 0 100 125">
      <Path d="M24 22 L76 22 L76 30 Q90 34 90 48 L90 104 Q90 116 78 116 L22 116 Q10 116 10 104 L10 48 Q10 34 24 30 Z" fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.9} />
      <Path d="M24 22 L76 22 L76 30 Q90 34 90 48 L90 104 Q90 116 78 116 L22 116 Q10 116 10 104 L10 48 Q10 34 24 30 Z" fill="none" stroke="#0B1B2B" strokeWidth={1.2} opacity={0.35} />
      {/* Brillos del vidrio */}
      <Rect x="17" y="44" width="5" height="52" rx="2.5" fill="#FFFFFF" opacity={0.55} />
      <Rect x="25" y="44" width="2.5" height="30" rx="1.25" fill="#FFFFFF" opacity={0.4} />
    </Svg>
  );
}

export function JarLid({ size = 110, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={(size * JAR_LID.height) / 100} viewBox={`0 ${JAR_LID.top} 100 ${JAR_LID.height}`}>
      <Rect x="20" y="8" width="60" height="14" rx="4" fill={color} />
      {[28, 36, 44, 52, 60, 68].map((x) => <Rect key={x} x={x} y="10" width="2.5" height="10" rx="1" fill="#000000" opacity={0.18} />)}
      <Rect x="20" y="8" width="60" height="4" rx="2" fill="#FFFFFF" opacity={0.35} />
      {/* Agujeritos para que respiren los bichos */}
      <Circle cx="40" cy="15" r="1.2" fill="#000000" opacity={0.35} />
      <Circle cx="50" cy="15" r="1.2" fill="#000000" opacity={0.35} />
      <Circle cx="60" cy="15" r="1.2" fill="#000000" opacity={0.35} />
    </Svg>
  );
}
