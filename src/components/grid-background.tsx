import { StyleSheet } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

type GridBackgroundProps = {
  /** Color de las líneas (usa el `grid` de la paleta). */
  color: string;
  /** Tamaño de cada cuadro en puntos. */
  size?: number;
};

/** Fondo cuadriculado tipo hoja de laboratorio. Se dibuja con SVG detrás del contenido. */
export function GridBackground({ color, size = 26 }: GridBackgroundProps) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="grid" width={size} height={size} patternUnits="userSpaceOnUse">
          <Path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={color} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
}
