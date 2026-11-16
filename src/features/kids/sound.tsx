import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, type AudioSource } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

// SONIDO DE LOS MINIJUEGOS
// - SoundProvider guarda si el sonido está silenciado (y lo recuerda entre sesiones).
// - useSfx: efectos cortos (acierto, error, mordida…).
// - useBackgroundMusic: música en bucle mientras la pantalla del juego está abierta.
// Los audios se generan con scripts/make-sounds.py (originales, libres de derechos).

const STORAGE_KEY = 'dedivulgadores:sonido-silenciado';

type SoundContextValue = { muted: boolean; toggleMuted: () => void };

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === '1') setMuted(true);
    }).catch(() => {});
    // Sin esto, iOS trata el audio como "ambiente" y lo apaga con el interruptor de silencio
    // del iPhone. Los juegos suenan aunque el teléfono esté en silencio; para callarlos
    // está el botón de bocina del juego. 'mixWithOthers' no interrumpe la música de otras apps.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
  }, []);

  const value = useMemo<SoundContextValue>(() => ({
    muted,
    toggleMuted: () => setMuted((current) => {
      const next = !current;
      AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0').catch(() => {});
      return next;
    }),
  }), [muted]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundSettings() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSoundSettings debe usarse dentro de SoundProvider');
  return context;
}

/** Devuelve una función que reproduce un efecto corto desde el inicio (si el sonido está activo). */
export function useSfx(source: AudioSource, volume = 0.8) {
  const player = useAudioPlayer(source);
  const { muted } = useSoundSettings();

  useEffect(() => {
    // expo-audio se configura asignando propiedades al reproductor (así lo indica su documentación).
    // eslint-disable-next-line react-hooks/immutability
    player.volume = volume;
  }, [player, volume]);

  return useCallback(() => {
    if (muted) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // Un efecto que falla nunca debe interrumpir el juego.
    }
  }, [muted, player]);
}

/** Música de fondo en bucle: suena mientras el componente está montado, la app está al frente y no hay silencio. */
export function useBackgroundMusic(source: AudioSource, volume = 0.35) {
  const player = useAudioPlayer(source);
  const { muted } = useSoundSettings();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // expo-audio se configura asignando propiedades al reproductor (así lo indica su documentación).
    // eslint-disable-next-line react-hooks/immutability
    player.loop = true;
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    try {
      if (!muted && appActive) player.play();
      else player.pause();
    } catch {
      // Si el audio no está disponible, el juego sigue sin música.
    }
  }, [appActive, muted, player]);
}
