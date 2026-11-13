"""Sintetizador mínimo para los efectos y la música de los juegos de deDivulgadores.

Todo el audio se genera desde cero con matemáticas (ondas + envolventes), así que es
100 % original y libre de derechos. Uso: python3 scripts/make-sounds.py assets/sounds
"""
import math
import random
import struct
import sys
import wave
from pathlib import Path

SR = 22050  # muestras por segundo (suficiente para efectos de juego, archivos ligeros)
random.seed(7)  # ruido reproducible: el mismo archivo cada vez que se genera


def note(name):
    """Frecuencia de una nota tipo 'C5', 'F#4', 'Bb3'."""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0]]
    rest = name[1:]
    if rest.startswith('#'):
        n += 1
        rest = rest[1:]
    elif rest.startswith('b'):
        n -= 1
        rest = rest[1:]
    midi = 12 * (int(rest) + 1) + n
    return 440.0 * 2 ** ((midi - 69) / 12)


def osc(kind, phase, duty=0.5):
    p = phase % 1.0
    if kind == 'sine':
        return math.sin(2 * math.pi * p)
    if kind == 'tri':
        return 4 * abs(p - 0.5) - 1
    if kind == 'square':
        return 1.0 if p < duty else -1.0
    if kind == 'saw':
        return 2 * p - 1
    raise ValueError(kind)


def env(t, dur, a=0.005, d=0.05, s=0.6, r=0.08):
    """Envolvente ADSR: ataque, caída, sostenido y liberación."""
    if t < a:
        return t / a
    if t < a + d:
        return 1 - (1 - s) * (t - a) / d
    if t < dur - r:
        return s
    if t < dur:
        return s * (dur - t) / r
    return 0.0


def tone(buf, start, dur, freq, kind='sine', vol=0.5, freq_end=None, vib=0.0, duty=0.5, adsr=(0.005, 0.05, 0.6, 0.08)):
    """Suma un tono al buffer (con barrido de frecuencia y vibrato opcionales)."""
    n0 = int(start * SR)
    n = int(dur * SR)
    phase = 0.0
    for i in range(n):
        t = i / SR
        f = freq if freq_end is None else freq + (freq_end - freq) * (t / dur)
        if vib:
            f *= 1 + vib * math.sin(2 * math.pi * 6 * t)
        phase += f / SR
        idx = n0 + i
        if idx < len(buf):
            buf[idx] += vol * env(t, dur, *adsr) * osc(kind, phase, duty)


def noise(buf, start, dur, vol=0.4, cutoff=0.3, adsr=(0.002, 0.03, 0.3, 0.05)):
    """Ruido filtrado (pasa-bajos de un polo): golpes, platillos, mordidas."""
    n0 = int(start * SR)
    n = int(dur * SR)
    y = 0.0
    for i in range(n):
        t = i / SR
        y += cutoff * (random.uniform(-1, 1) - y)
        idx = n0 + i
        if idx < len(buf):
            buf[idx] += vol * env(t, dur, *adsr) * y


def silence(seconds):
    return [0.0] * int(seconds * SR)


def save(buf, path, peak=0.85):
    top = max(1e-9, max(abs(x) for x in buf))
    gain = peak / top
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * gain)) * 32767)) for x in buf))
    print(f'{path.name:22} {len(buf) / SR:5.2f} s  {path.stat().st_size // 1024:4d} KB')


def make_effects(out):
    # Aparece la comida: "pop" que sube.
    b = silence(0.16)
    tone(b, 0, 0.14, 380, 'sine', 0.8, freq_end=920, adsr=(0.003, 0.04, 0.5, 0.06))
    save(b, out / 'pop.wav')

    # Tomar la comida: dos blips cortos.
    b = silence(0.14)
    tone(b, 0.00, 0.06, note('E6'), 'tri', 0.6, adsr=(0.002, 0.02, 0.5, 0.03))
    tone(b, 0.06, 0.07, note('A6'), 'tri', 0.6, adsr=(0.002, 0.02, 0.5, 0.03))
    save(b, out / 'grab.wav', peak=0.6)

    # Divu mastica: tres mordidas de ruido grave con un golpe.
    b = silence(0.48)
    for k in range(3):
        noise(b, k * 0.14, 0.11, 0.9, cutoff=0.18, adsr=(0.002, 0.03, 0.25, 0.05))
        tone(b, k * 0.14, 0.08, 150, 'sine', 0.6, freq_end=80, adsr=(0.002, 0.02, 0.3, 0.04))
    save(b, out / 'chomp.wav')

    # Acierto: arpegio brillante Do-Mi-Sol-Do con destello final.
    b = silence(0.62)
    for k, n in enumerate(['C5', 'E5', 'G5']):
        tone(b, k * 0.075, 0.12, note(n), 'tri', 0.55)
        tone(b, k * 0.075, 0.12, note(n) * 2, 'sine', 0.15)
    tone(b, 0.225, 0.38, note('C6'), 'tri', 0.6, adsr=(0.004, 0.06, 0.5, 0.2))
    tone(b, 0.225, 0.38, note('C7'), 'sine', 0.12, vib=0.01, adsr=(0.004, 0.06, 0.4, 0.2))
    save(b, out / 'correct.wav')

    # Error: dos notas que bajan, suaves (no regañan).
    b = silence(0.5)
    tone(b, 0.00, 0.2, note('Eb4'), 'square', 0.25, duty=0.3, vib=0.02, adsr=(0.004, 0.05, 0.6, 0.06))
    tone(b, 0.18, 0.3, note('Bb3'), 'square', 0.25, duty=0.3, vib=0.025, adsr=(0.004, 0.05, 0.6, 0.15))
    save(b, out / 'wrong.wav', peak=0.65)

    # Al bote de basura: barrido que baja + golpe metálico.
    b = silence(0.42)
    noise(b, 0, 0.22, 0.5, cutoff=0.5, adsr=(0.01, 0.05, 0.6, 0.1))
    tone(b, 0, 0.22, 900, 'sine', 0.25, freq_end=250)
    tone(b, 0.22, 0.18, 210, 'tri', 0.5, adsr=(0.002, 0.03, 0.3, 0.12))
    tone(b, 0.22, 0.18, 525, 'sine', 0.2, adsr=(0.002, 0.03, 0.2, 0.12))
    save(b, out / 'trash.wav')

    # Se acabó el tiempo: "tic-tic-toc".
    b = silence(0.42)
    for k, f in enumerate([1200, 1200, 800]):
        tone(b, k * 0.13, 0.07, f, 'square', 0.25, duty=0.2, adsr=(0.001, 0.02, 0.3, 0.03))
    save(b, out / 'timeout.wav', peak=0.6)

    # Fin de la partida: fanfarria.
    b = silence(1.5)
    seq = [('G4', 0.0, 0.14), ('C5', 0.14, 0.14), ('E5', 0.28, 0.14), ('G5', 0.42, 0.3), ('E5', 0.72, 0.14), ('G5', 0.86, 0.6)]
    for n, s, d in seq:
        tone(b, s, d, note(n), 'square', 0.3, duty=0.25, adsr=(0.004, 0.05, 0.7, 0.08))
        tone(b, s, d, note(n) / 2, 'tri', 0.35, adsr=(0.004, 0.05, 0.7, 0.08))
    save(b, out / 'win.wav')


# ---------------------------------------------------------------------------
# INSTRUMENTOS "MODERNOS" (para la música de fondo)
# Cada uno suma su sonido a un buffer. Son más realistas que los tonos simples
# de los efectos: armónicos que se apagan a distinto ritmo, filtros y saturación.
# ---------------------------------------------------------------------------

def _add(buf, idx, value):
    if 0 <= idx < len(buf):
        buf[idx] += value


def kalimba(buf, start, freq, vol=0.5, length=1.8):
    """Piano de pulgar africano: tono puro + armónico metálico breve + clic de la lengüeta."""
    n0 = int(start * SR)
    for i in range(int(length * SR)):
        t = i / SR
        s = math.sin(2 * math.pi * freq * t) * math.exp(-t * 2.6)
        s += 0.32 * math.sin(2 * math.pi * freq * 5.4 * t) * math.exp(-t * 14)
        s += 0.12 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 5)
        if t < 0.004:
            s += random.uniform(-1, 1) * 0.25 * (1 - t / 0.004)
        _add(buf, n0 + i, vol * s * min(1.0, t / 0.002))


def marimba(buf, start, freq, vol=0.4, length=0.9):
    """Marimba: tono de madera con un armónico (4×) que desaparece muy rápido."""
    n0 = int(start * SR)
    for i in range(int(length * SR)):
        t = i / SR
        s = math.sin(2 * math.pi * freq * t) * math.exp(-t * 5.5)
        s += 0.45 * math.sin(2 * math.pi * freq * 4 * t) * math.exp(-t * 22)
        _add(buf, n0 + i, vol * s * min(1.0, t / 0.0015))


def sub_bass(buf, start, length, freq, vol=0.5):
    """Bajo cálido: seno con un poco de segundo armónico y saturación suave (tanh)."""
    n0 = int(start * SR)
    n = int(length * SR)
    for i in range(n):
        t = i / SR
        e = min(1.0, t / 0.008) * min(1.0, (length - t) / 0.06)
        s = math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(2 * math.pi * freq * 2 * t)
        _add(buf, n0 + i, vol * e * math.tanh(1.6 * s) / 1.2)


def pad(buf, start, length, freqs, vol=0.12):
    """Colchón de acordes: 3 dientes de sierra desafinados por nota, filtrados y con entrada lenta."""
    n0 = int(start * SR)
    n = int(length * SR)
    detunes = (-0.005, 0.0, 0.006)
    for f in freqs:
        phases = [random.random() for _ in detunes]
        y1 = y2 = 0.0
        for i in range(n):
            t = i / SR
            raw = 0.0
            for k, d in enumerate(detunes):
                phases[k] += f * (1 + d) / SR
                raw += 2 * (phases[k] % 1.0) - 1
            # Dos filtros pasa-bajos seguidos quitan lo "chillón" del diente de sierra.
            y1 += 0.06 * (raw / 3 - y1)
            y2 += 0.06 * (y1 - y2)
            e = min(1.0, t / 0.7) * min(1.0, max(0.0, (length - t) / 0.9))
            _add(buf, n0 + i, vol * e * y2)


def kick(buf, start, vol=0.9):
    """Bombo: seno que baja de 140 a 42 Hz rápidamente, con un clic de ataque."""
    n0 = int(start * SR)
    phase = 0.0
    for i in range(int(0.32 * SR)):
        t = i / SR
        f = 42 + 98 * math.exp(-t * 28)
        phase += f / SR
        s = math.sin(2 * math.pi * phase) * math.exp(-t * 9)
        if t < 0.003:
            s += 0.4 * random.uniform(-1, 1)
        _add(buf, n0 + i, vol * s)


def clap(buf, start, vol=0.35):
    """Palmas: tres ráfagas de ruido brillante muy juntas y una cola corta."""
    n0 = int(start * SR)
    low = 0.0
    for i in range(int(0.22 * SR)):
        t = i / SR
        r = random.uniform(-1, 1)
        low += 0.25 * (r - low)
        bright = r - low  # pasa-altos: quitamos los graves del ruido
        burst = max(math.exp(-((t - d) * 160) ** 2) for d in (0.0, 0.011, 0.022)) if t < 0.04 else 0.0
        e = burst + 0.6 * math.exp(-max(0.0, t - 0.022) * 22) * (t >= 0.022)
        _add(buf, n0 + i, vol * e * bright)


def shaker(buf, start, vol=0.12, length=0.06):
    """Shaker: ruido agudo con ataque suave."""
    n0 = int(start * SR)
    low = 0.0
    n = int(length * SR)
    for i in range(n):
        t = i / SR
        r = random.uniform(-1, 1)
        low += 0.4 * (r - low)
        e = math.sin(math.pi * t / length) ** 2
        _add(buf, n0 + i, vol * e * (r - low))


def djembe(buf, start, kind='tone', vol=0.45):
    """Djembé: 'bass' (centro, grave), 'tone' (borde, medio) o 'slap' (borde, seco y brillante)."""
    n0 = int(start * SR)
    freq, decay, noise_amt, length = {'bass': (82, 9, 0.15, 0.3), 'tone': (215, 16, 0.25, 0.18), 'slap': (390, 30, 0.7, 0.1)}[kind]
    low = 0.0
    phase = 0.0
    for i in range(int(length * SR)):
        t = i / SR
        f = freq * (1 + 0.25 * math.exp(-t * 40))
        phase += f / SR
        r = random.uniform(-1, 1)
        low += 0.3 * (r - low)
        s = math.sin(2 * math.pi * phase) + noise_amt * (r - low if kind == 'slap' else low) * 3
        _add(buf, n0 + i, vol * s * math.exp(-t * decay))


def reverb(dry, wet=0.3):
    """Reverberación Schroeder: 4 ecos con realimentación + 2 filtros pasa-todo (espacio abierto)."""
    combs = [(778, 0.80), (808, 0.79), (745, 0.81), (711, 0.78)]
    out = [0.0] * len(dry)
    for delay, fb in combs:
        line = [0.0] * len(dry)
        for i in range(len(dry)):
            echo = line[i - delay] if i >= delay else 0.0
            line[i] = dry[i] + fb * echo
            out[i] += echo / len(combs)
    for delay, g in ((278, 0.5), (112, 0.5)):
        res = [0.0] * len(out)
        for i in range(len(out)):
            prev_in = out[i - delay] if i >= delay else 0.0
            prev_out = res[i - delay] if i >= delay else 0.0
            res[i] = -g * out[i] + prev_in + g * prev_out
        out = res
    return [w * wet for w in out]


def make_music_divu(out):
    """Música moderna inspirada en la sabana africana (hábitat de la pitón bola), en bucle sin cortes."""
    bpm = 98
    beat = 60 / bpm
    bars = 8
    loop = bars * 4 * beat
    tail = 3.0  # se renderiza de más y luego se dobla al inicio: así el eco no se corta al repetir
    size = int((loop + tail) * SR)
    music = [0.0] * size  # instrumentos que reciben reverberación
    rhythm = [0.0] * size  # bajo y percusión (más secos)

    # Acordes: Rem - Sib - Fa - Do (i–VI–III–VII), una progresión luminosa y aventurera.
    chords = [
        ('D2', ['D4', 'F4', 'A4', 'C5'], 'minor'), ('Bb1', ['Bb3', 'D4', 'F4', 'A4'], 'major'),
        ('F2', ['F3', 'A3', 'C4', 'E4'], 'major'), ('C2', ['C4', 'E4', 'G4', 'Bb4'], 'major'),
    ] * 2

    kick_times = []
    for bar, (root, pad_notes, quality) in enumerate(chords):
        t0 = bar * 4 * beat
        root_f = note(root)
        # Pad de fondo.
        pad(music, t0, 4 * beat + 0.4, [note(n) for n in pad_notes], vol=0.07)
        # Bajo sincopado (con octava al final del compás).
        for pos, length, mult in ((0, 0.7, 1), (1.5, 0.4, 1), (2, 0.7, 1), (3.5, 0.4, 2)):
            sub_bass(rhythm, t0 + pos * beat, length * beat, root_f * mult, vol=0.42)
        # Marimba: arpegio en corcheas del acorde.
        third = 3 if quality == 'minor' else 4
        pattern = [0, 7, 12, 7, 12 + third, 7, 12, 7]
        base = root_f * 4  # dos octavas arriba del bajo
        for k, semis in enumerate(pattern):
            marimba(music, t0 + k * beat / 2, base * 2 ** (semis / 12), vol=0.16 if k % 2 else 0.22)
        # Batería.
        for pos in (0, 2.75, 3):
            kick(rhythm, t0 + pos * beat, vol=0.8 if pos != 2.75 else 0.5)
            kick_times.append(t0 + pos * beat)
        for pos in (1, 3):
            clap(music, t0 + pos * beat, vol=0.22)
        for k in range(16):
            shaker(rhythm, t0 + k * beat / 4, vol=0.09 if k % 2 else 0.05)
        for pos, kind in ((0.5, 'tone'), (1.5, 'tone'), (1.75, 'slap'), (3.25, 'bass'), (3.75, 'slap')):
            djembe(rhythm, t0 + pos * beat, kind, vol=0.28)

    # Kalimba: melodía pentatónica de Re menor, con frases de pregunta y respuesta.
    melody = [
        ('A5', 0), ('C6', 0.5), ('D6', 1), ('A5', 2), ('G5', 2.5), ('F5', 3),
        ('D5', 4.5), ('F5', 5), ('G5', 5.5), ('A5', 6.5),
        ('C6', 8), ('A5', 8.5), ('G5', 9), ('F5', 10), ('G5', 10.5), ('A5', 11),
        ('G5', 12.5), ('E5', 13), ('C5', 13.5), ('E5', 14.5), ('G5', 15),
        ('D6', 16), ('C6', 16.5), ('A5', 17), ('G5', 18), ('A5', 18.5), ('C6', 19),
        ('F5', 20.5), ('G5', 21), ('A5', 21.5), ('F5', 22.5),
        ('A5', 24), ('G5', 24.5), ('F5', 25), ('D5', 26), ('F5', 26.5), ('G5', 27),
        ('E5', 28.5), ('G5', 29), ('C6', 29.5), ('A5', 30.5),
    ]
    for n, pos in melody:
        kalimba(music, pos * beat, note(n), vol=0.3)

    # "Respiración" con el bombo (sidechain): el bajo y el pad bajan un instante en cada golpe.
    duck = [1.0] * size
    for kt in kick_times:
        k0 = int(kt * SR)
        for i in range(int(0.25 * SR)):
            if k0 + i < size:
                duck[k0 + i] = min(duck[k0 + i], 1 - 0.45 * math.exp(-i / SR / 0.09))
    wet = reverb(music, wet=0.32)
    mix = [(music[i] + wet[i]) * (0.75 + 0.25 * duck[i]) + rhythm[i] * duck[i] for i in range(size)]

    # Doblamos la cola al inicio para que el bucle sea continuo, y saturamos suave (tanh).
    n_loop = int(loop * SR)
    for i in range(n_loop, size):
        mix[i - n_loop] += mix[i]
    final = [math.tanh(1.2 * x) for x in mix[:n_loop]]
    save(final, out / 'music-divu.wav', peak=0.8)


if __name__ == '__main__':
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    make_effects(out)
    make_music_divu(out)
