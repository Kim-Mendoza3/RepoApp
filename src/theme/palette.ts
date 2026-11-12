// Colores de la app para modo claro y oscuro. Úsalos con el hook `useColors()`.
export const palette = {
  light: { background: '#F7FAFC', surface: '#FFFFFF', text: '#17202A', muted: '#718096', line: '#E2E8F0', blue: '#2463A5', blueSoft: '#E6F4FF', green: '#087F68', greenSoft: '#E7F8F1', orange: '#A85B00', orangeSoft: '#FFF4E5', purple: '#6941A5', purpleSoft: '#F2EAFE', danger: '#B42318' },
  dark: { background: '#171923', surface: '#2D3748', text: '#F7FAFC', muted: '#E2E8F0', line: '#718096', blue: '#9BD7FF', blueSoft: '#234A67', green: '#75E0C2', greenSoft: '#205344', orange: '#FFD08A', orangeSoft: '#684B24', purple: '#D0B4FF', purpleSoft: '#4A3470', danger: '#FF9B93' },
} as const;

export type ThemeMode = keyof typeof palette;
export type Colors = (typeof palette)[ThemeMode];

// En modo oscuro, los acentos de cada taller se aclaran para conservar el contraste.
const darkModeAccents: Record<string, string> = {
  '#087F68': '#5DE0BF',
  '#2463A5': '#8CCFFF',
  '#A85B00': '#FFBE72',
  '#6941A5': '#C4B5FD',
  '#4F7C3A': '#A9D77B',
  '#168A70': '#65E0BF',
  '#C04A78': '#FF9CC1',
  '#315A8A': '#91C7FF',
  '#B54708': '#FFB36B',
  '#A60E12': '#FF8F8A',
  '#7A4EAB': '#CFB2FF',
  '#5C6F35': '#C7E47B',
  '#8B5E3C': '#E1AA7B',
};

export function getWorkshopAccent(accent: string, mode: ThemeMode) {
  return mode === 'dark' ? darkModeAccents[accent] ?? accent : accent;
}
