import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, useAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

/** Cuántas copias de cada efecto: si una todavía suena, la otra está lista (nunca se corta ni se omite). */
const SFX_COPIES = 2;

/**
 * Devuelve una función que reproduce un efecto corto (si el sonido está activo), sin importar
 * qué tan rápido juegue el niño:
 * - Cada efecto tiene 2 reproductores. Si uno sigue sonando, se usa el otro.
 * - Cada reproductor se REBOBINA en cuanto termina, para estar listo antes de la siguiente vez.
 *   Antes se rebobinaba justo al tocar: "rebobinar" tarda un instante y, en iPhone, play() podía
 *   arrancar antes de que terminara, desde el final del audio, y el efecto no se oía.
 */
export function useSfx(source: AudioSource, volume = 0.8) {
  const { muted } = useSoundSettings();
  const pool = useRef<AudioPlayer[]>([]);

  useEffect(() => {
    const players = Array.from({ length: SFX_COPIES }, () => createAudioPlayer(source));
    const subscriptions = players.map((player) => {
      player.volume = volume;
      return player.addListener('playbackStatusUpdate', (status) => {
        if (!status.didJustFinish) return;
        player.pause();
        player.seekTo(0).catch(() => {});
      });
    });
    pool.current = players;
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      players.forEach((player) => player.remove());
      pool.current = [];
    };
  }, [source, volume]);

  return useCallback(() => {
    if (muted) return;
    const players = pool.current;
    if (players.length === 0) return;
    try {
      // 1) Uno libre y ya rebobinado: suena al instante.
      const ready = players.find((player) => !player.playing && player.currentTime < 0.02);
      if (ready) {
        ready.play();
        return;
      }
      // 2) Si no, uno libre (o el que lleva más tiempo sonando): se rebobina y, AL TERMINAR, suena.
      const target = players.find((player) => !player.playing)
        ?? players.reduce((a, b) => (a.currentTime >= b.currentTime ? a : b));
      target.seekTo(0).then(() => target.play(), () => target.play());
    } catch {
      // Un efecto que falla nunca debe interrumpir el juego.
    }
  }, [muted]);
}

/**
 * Música de fondo en bucle: suena mientras el componente está montado, la app está al frente,
 * no hay silencio y `playing` es true. Al pasar `playing` a false (fin de la partida) se apaga
 * con un desvanecido corto y vuelve al inicio, para no encimarse con la fanfarria final.
 */
export function useBackgroundMusic(source: AudioSource, volume = 0.35, playing = true) {
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
      if (!muted && appActive && playing) {
        // eslint-disable-next-line react-hooks/immutability -- expo-audio se configura por asignación
        player.volume = volume;
        player.play();
        return;
      }
      if (playing) {
        player.pause(); // silencio o app en segundo plano: pausa (al volver sigue donde iba)
        return;
      }
      // Fin de la partida: baja el volumen en ~0,4 s, pausa y regresa al inicio.
      const steps = 8;
      let step = 0;
      const fade = setInterval(() => {
        step += 1;
        try {
          player.volume = volume * Math.max(0, 1 - step / steps);
          if (step >= steps) {
            clearInterval(fade);
            player.pause();
            player.seekTo(0);
            player.volume = volume;
          }
        } catch {
          clearInterval(fade);
        }
      }, 50);
      return () => clearInterval(fade);
    } catch {
      // Si el audio no está disponible, el juego sigue sin música.
    }
  }, [appActive, muted, player, playing, volume]);
}
