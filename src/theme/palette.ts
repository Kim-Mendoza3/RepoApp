// Paletas del diseño "Final B".
// - science: Inicio, Talleres, detalle de taller, login y admin (científica y moderna).
// - lab: pestaña Niños y juegos (laboratorio de juegos: base científica + colores vivos).
// Los colores de texto se eligieron para cumplir contraste mínimo 4.5:1 en ambos modos.

export const science = {
  light: {
    background: '#F1F5F9', surface: '#FFFFFF', soft: '#E6EEF5', text: '#0B1B2B', muted: '#4A5D70', line: '#D5E0EA',
    accent: '#0E7490', accent2: '#4338CA', onAccent: '#FFFFFF', onAccent2: '#FFFFFF', grid: 'rgba(14, 116, 144, 0.08)',
    navBackground: 'rgba(255, 255, 255, 0.96)', navActive: '#0B1B2B', onNavActive: '#E6F6FB',
    danger: '#B42318', success: '#087F68',
  },
  dark: {
    background: '#060C17', surface: '#0E1828', soft: '#13223A', text: '#E4EEF7', muted: '#8BA0B6', line: '#1E3048',
    accent: '#22D3EE', accent2: '#A5B4FC', onAccent: '#04202A', onAccent2: '#0B1438', grid: 'rgba(34, 211, 238, 0.07)',
    navBackground: 'rgba(14, 24, 40, 0.96)', navActive: '#22D3EE', onNavActive: '#04202A',
    danger: '#FF9B93', success: '#5DE0BF',
  },
} as const;

export const lab = {
  light: {
    background: '#EEF6FB', surface: '#FFFFFF', specimen: '#DDF5FA', text: '#0B1B2B', muted: '#4A5D70', label: '#0E7490',
    line: '#0B1B2B', shadow: '#0E7490', onBright: '#0B1B2B', grid: 'rgba(14, 116, 144, 0.10)',
    // Contorno y sombra de las estampas con relleno de color vivo (cian, lima, ámbar, rosa).
    brightLine: '#0B1B2B', brightShadow: '#0B1B2B',
    cyan: '#4FD6EC', lime: '#B8F171', amber: '#FFC857', pink: '#FF9EC4',
  },
  dark: {
    background: '#060C17', surface: '#0E1828', specimen: '#0F2A3D', text: '#E4EEF7', muted: '#9DB1C5', label: '#22D3EE',
    line: '#22D3EE', shadow: '#0891B2', onBright: '#04202A', grid: 'rgba(34, 211, 238, 0.09)',
    // En oscuro, el contorno cian (`line`) se confundiría con un relleno cian: usamos blanco azulado.
    brightLine: '#E4EEF7', brightShadow: '#0E7490',
    cyan: '#22D3EE', lime: '#A3E635', amber: '#FBBF24', pink: '#F472B6',
  },
} as const;

export type ThemeMode = keyof typeof science;
export type Colors = (typeof science)[ThemeMode];
export type LabColors = (typeof lab)[ThemeMode];
