import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// ILUSTRACIONES DE COMIDA PARA EL JUEGO DE DIVU
// Dibujos vectoriales propios (no emojis): degradados para dar volumen, brillos y una sombra
// en el piso. Todos usan un lienzo de 100 × 100 y se escalan con `size`.

export type FoodKind = 'raton' | 'huevo' | 'pollito' | 'pizza' | 'hamburguesa' | 'papas';

export function FoodArt({ kind, size = 72 }: { kind: FoodKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="50" cy="91" rx="30" ry="5" fill="#000000" opacity={0.16} />
      {kind === 'raton' && <Mouse />}
      {kind === 'huevo' && <Egg />}
      {kind === 'pollito' && <Chick />}
      {kind === 'pizza' && <Pizza />}
      {kind === 'hamburguesa' && <Burger />}
      {kind === 'papas' && <Fries />}
    </Svg>
  );
}

function Mouse() {
  return (
    <G>
      <Defs>
        <RadialGradient id="mouseBody" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#E3E7EC" />
          <Stop offset="0.6" stopColor="#B4BCC7" />
          <Stop offset="1" stopColor="#8A94A3" />
        </RadialGradient>
      </Defs>
      <Path d="M22 72 C 8 70, 6 54, 16 50 C 22 48, 24 54, 19 56" fill="none" stroke="#E7A1B4" strokeWidth={3.2} strokeLinecap="round" />
      <Ellipse cx="46" cy="68" rx="29" ry="19" fill="url(#mouseBody)" />
      <Ellipse cx="42" cy="74" rx="17" ry="8" fill="#FFFFFF" opacity={0.28} />
      <Ellipse cx="34" cy="85" rx="6" ry="3" fill="#F2A7BB" />
      <Ellipse cx="58" cy="85" rx="6" ry="3" fill="#F2A7BB" />
      <Circle cx="72" cy="58" r="16" fill="url(#mouseBody)" />
      <Circle cx="64" cy="41" r="10.5" fill="#A9B1BD" />
      <Circle cx="64" cy="41" r="6.5" fill="#F6B9C9" />
      <Circle cx="80" cy="43" r="8" fill="#A9B1BD" />
      <Circle cx="80" cy="43" r="4.8" fill="#F6B9C9" />
      <Circle cx="77" cy="55" r="3" fill="#1E2430" />
      <Circle cx="78" cy="54" r="1" fill="#FFFFFF" />
      <Circle cx="88.5" cy="62" r="3.4" fill="#EF7F9B" />
      <Line x1="86" y1="64" x2="97" y2="61" stroke="#5E6672" strokeWidth={1} strokeLinecap="round" />
      <Line x1="86" y1="65.5" x2="97" y2="67" stroke="#5E6672" strokeWidth={1} strokeLinecap="round" />
      <Circle cx="72" cy="63" r="3" fill="#F6B9C9" opacity={0.6} />
    </G>
  );
}

function Egg() {
  return (
    <G>
      <Defs>
        <RadialGradient id="eggShell" cx="38%" cy="30%" r="75%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#F4ECDF" />
          <Stop offset="1" stopColor="#D6C6AE" />
        </RadialGradient>
      </Defs>
      <Path d="M50 10 C 72 10, 82 46, 80 62 C 78 80, 64 89, 50 89 C 36 89, 22 80, 20 62 C 18 46, 28 10, 50 10 Z" fill="url(#eggShell)" stroke="#CDBDA4" strokeWidth={1} />
      <Ellipse cx="39" cy="32" rx="7" ry="11" fill="#FFFFFF" opacity={0.85} transform="rotate(-18 39 32)" />
      <Circle cx="60" cy="52" r="1.6" fill="#C9B79A" />
      <Circle cx="66" cy="66" r="1.2" fill="#C9B79A" />
      <Circle cx="44" cy="72" r="1.4" fill="#C9B79A" />
      <Circle cx="56" cy="78" r="1" fill="#C9B79A" />
    </G>
  );
}

function Chick() {
  return (
    <G>
      <Defs>
        <RadialGradient id="chickBody" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FFF4A8" />
          <Stop offset="0.6" stopColor="#FFD84A" />
          <Stop offset="1" stopColor="#F2B21E" />
        </RadialGradient>
      </Defs>
      <Path d="M42 84 L40 91 M40 91 L36 92 M40 91 L43 93" stroke="#F08A24" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M58 84 L60 91 M60 91 L56 92 M60 91 L64 92" stroke="#F08A24" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Ellipse cx="50" cy="64" rx="27" ry="23" fill="url(#chickBody)" />
      <Path d="M28 62 C 20 58, 22 72, 32 72 Z" fill="#F4BE2A" />
      <Path d="M44 60 C 40 70, 54 76, 60 66 C 56 70, 48 68, 44 60 Z" fill="#F2B21E" opacity={0.7} />
      <Circle cx="50" cy="34" r="17" fill="url(#chickBody)" />
      <Path d="M48 18 C 46 12, 52 12, 50 18 M53 18 C 54 11, 59 14, 55 19" stroke="#F2B21E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx="44" cy="31" r="2.8" fill="#1E2430" />
      <Circle cx="56" cy="31" r="2.8" fill="#1E2430" />
      <Circle cx="45" cy="30" r="0.9" fill="#FFFFFF" />
      <Circle cx="57" cy="30" r="0.9" fill="#FFFFFF" />
      <Path d="M45 38 L55 38 L50 45 Z" fill="#F08A24" />
      <Circle cx="39" cy="38" r="3" fill="#FF9DB0" opacity={0.6} />
      <Circle cx="61" cy="38" r="3" fill="#FF9DB0" opacity={0.6} />
    </G>
  );
}

function Pizza() {
  return (
    <G>
      <Defs>
        <LinearGradient id="pizzaCheese" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE07A" />
          <Stop offset="1" stopColor="#F5B638" />
        </LinearGradient>
        <LinearGradient id="pizzaCrust" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8A456" />
          <Stop offset="1" stopColor="#B86A24" />
        </LinearGradient>
      </Defs>
      <Path d="M18 26 Q50 14 82 26 L52 90 Q50 94 48 90 Z" fill="url(#pizzaCheese)" stroke="#E09A2A" strokeWidth={1} />
      <Path d="M34 46 Q36 56 33 60 Q30 56 32 46 Z" fill="#F5B638" />
      <Path d="M60 52 Q62 62 59 66 Q56 62 58 52 Z" fill="#F5B638" />
      <Path d="M12 22 Q50 6 88 22 Q90 30 84 31 Q50 18 16 31 Q10 30 12 22 Z" fill="url(#pizzaCrust)" />
      <Path d="M20 22 Q50 11 80 22" stroke="#F3C27E" strokeWidth={1.6} fill="none" opacity={0.8} />
      <Circle cx="40" cy="38" r="7" fill="#C73A2E" />
      <Circle cx="38" cy="36" r="1.6" fill="#E46A5C" />
      <Circle cx="62" cy="40" r="6.5" fill="#C73A2E" />
      <Circle cx="60" cy="38" r="1.5" fill="#E46A5C" />
      <Circle cx="50" cy="62" r="6" fill="#C73A2E" />
      <Circle cx="48.5" cy="60.5" r="1.4" fill="#E46A5C" />
      <Path d="M52 48 Q56 44 58 49 Q54 51 52 48 Z" fill="#3E9B4F" />
      <Path d="M44 74 Q48 70 50 75 Q46 77 44 74 Z" fill="#3E9B4F" />
    </G>
  );
}

function Burger() {
  return (
    <G>
      <Defs>
        <LinearGradient id="burgerBun" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7BE6E" />
          <Stop offset="1" stopColor="#D98436" />
        </LinearGradient>
        <LinearGradient id="burgerPatty" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7A4528" />
          <Stop offset="1" stopColor="#4E2814" />
        </LinearGradient>
      </Defs>
      <Rect x="14" y="70" width="72" height="15" rx="7" fill="url(#burgerBun)" />
      <Rect x="12" y="58" width="76" height="14" rx="7" fill="url(#burgerPatty)" />
      <Path d="M14 56 L86 56 L84 61 L74 61 L70 68 L66 61 L40 61 L36 67 L32 61 L16 61 Z" fill="#FFC93C" />
      <Path d="M12 52 Q18 47 24 52 Q30 47 36 52 Q42 47 48 52 Q54 47 60 52 Q66 47 72 52 Q78 47 84 52 Q88 50 88 54 L12 56 Z" fill="#6BC43D" />
      <Rect x="18" y="47" width="64" height="6" rx="3" fill="#E5483A" />
      <Path d="M12 48 Q12 14 50 14 Q88 14 88 48 Z" fill="url(#burgerBun)" />
      <Path d="M24 30 Q34 20 48 19" stroke="#FFE0AE" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <Ellipse cx="38" cy="30" rx="2.4" ry="1.4" fill="#FFF4DD" transform="rotate(-20 38 30)" />
      <Ellipse cx="52" cy="25" rx="2.4" ry="1.4" fill="#FFF4DD" transform="rotate(10 52 25)" />
      <Ellipse cx="64" cy="31" rx="2.4" ry="1.4" fill="#FFF4DD" transform="rotate(25 64 31)" />
      <Ellipse cx="46" cy="38" rx="2.4" ry="1.4" fill="#FFF4DD" transform="rotate(-5 46 38)" />
      <Ellipse cx="72" cy="40" rx="2.4" ry="1.4" fill="#FFF4DD" transform="rotate(15 72 40)" />
    </G>
  );
}

function Fries() {
  return (
    <G>
      <Defs>
        <LinearGradient id="friesBox" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E53935" />
          <Stop offset="0.55" stopColor="#F2564F" />
          <Stop offset="1" stopColor="#C62828" />
        </LinearGradient>
        <LinearGradient id="fry" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFE27A" />
          <Stop offset="1" stopColor="#F2B634" />
        </LinearGradient>
      </Defs>
      <Rect x="30" y="18" width="7" height="40" rx="2" fill="url(#fry)" transform="rotate(-10 33 38)" />
      <Rect x="40" y="12" width="7" height="44" rx="2" fill="url(#fry)" transform="rotate(-4 43 34)" />
      <Rect x="50" y="10" width="7" height="46" rx="2" fill="url(#fry)" transform="rotate(3 53 33)" />
      <Rect x="59" y="15" width="7" height="42" rx="2" fill="url(#fry)" transform="rotate(9 62 36)" />
      <Rect x="45" y="22" width="7" height="36" rx="2" fill="url(#fry)" transform="rotate(-14 48 40)" />
      <Rect x="55" y="24" width="7" height="34" rx="2" fill="url(#fry)" transform="rotate(16 58 41)" />
      <Path d="M22 44 L78 44 L71 89 L29 89 Z" fill="url(#friesBox)" />
      <Path d="M22 44 Q50 54 78 44 L77 50 Q50 60 23 50 Z" fill="#B71C1C" opacity={0.55} />
      <Path d="M41 64 L44 70 L51 71 L46 75 L47 82 L41 78 L35 82 L36 75 L31 71 L38 70 Z" fill="#FFD54F" />
    </G>
  );
}
