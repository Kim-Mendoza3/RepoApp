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

    # (Aquí estaba el primer sonido del bote; ahora es make_trash_bang). Consumimos el mismo
    # ruido aleatorio que usaba para que la música, generada después, no cambie.
    for _ in range(int(0.22 * SR)):
        random.uniform(-1, 1)

    # Se acabó el tiempo: "tic-tic-toc".
    b = silence(0.42)
    for k, f in enumerate([1200, 1200, 800]):
        tone(b, k * 0.13, 0.07, f, 'square', 0.25, duty=0.2, adsr=(0.001, 0.02, 0.3, 0.03))
    save(b, out / 'timeout.wav', peak=0.6)

    # La fanfarria final ahora es make_win_band (con banda completa).


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


def make_lid(out):
    """Tapa del bote al cerrarse: "clanc" metálico (parciales inarmónicos que se apagan rápido)."""
    b = silence(0.35)
    noise(b, 0, 0.02, 0.6, cutoff=0.8, adsr=(0.001, 0.01, 0.3, 0.008))
    for freq, vol, decay in ((520, 0.5, 0.18), (1310, 0.28, 0.12), (2240, 0.16, 0.08), (180, 0.35, 0.1)):
        tone(b, 0, decay * 1.6, freq, 'sine', vol, adsr=(0.001, decay * 0.3, 0.25, decay))
    save(b, out / 'lid.wav', peak=0.7)


def make_chew(out):
    """Divu mastica (ligero): cuatro mordiditas suaves y húmedas y un "glup" al tragar."""
    b = silence(1.05)
    for k, (start, vol) in enumerate(((0.0, 0.55), (0.2, 0.45), (0.38, 0.5), (0.58, 0.38))):
        # Mordida: ruido muy filtrado (sonido apagado, "húmedo") con un golpecito grave.
        noise(b, start, 0.09, vol, cutoff=0.07 + 0.01 * k, adsr=(0.006, 0.03, 0.4, 0.04))
        tone(b, start, 0.07, 140 - 8 * k, 'sine', vol * 0.5, freq_end=90, adsr=(0.004, 0.02, 0.3, 0.03))
    # Glup: tono que baja rápido, como al tragar.
    tone(b, 0.8, 0.16, 320, 'sine', 0.45, freq_end=150, adsr=(0.008, 0.04, 0.5, 0.08))
    noise(b, 0.8, 0.1, 0.15, cutoff=0.05, adsr=(0.005, 0.03, 0.3, 0.05))
    save(b, out / 'chew.wav', peak=0.6)


def metal_hit(buf, start, vol=1.0, pitch=1.0):
    """Golpe a un bote metálico: modos inarmónicos del cilindro (con batimiento) + chasquido inicial."""
    n0 = int(start * SR)
    # (frecuencia, volumen, tiempo de caída): los graves resuenan más, los agudos se apagan pronto.
    modes = ((196, 0.55, 0.30), (201, 0.35, 0.26), (463, 0.45, 0.20), (741, 0.32, 0.14),
             (1083, 0.24, 0.10), (1532, 0.18, 0.07), (2190, 0.12, 0.05))
    low = 0.0
    for i in range(int(0.7 * SR)):
        t = i / SR
        s = 0.0
        for f, v, decay in modes:
            s += v * math.sin(2 * math.pi * f * pitch * t) * math.exp(-t / decay)
        if t < 0.012:  # chasquido del impacto (ruido brillante)
            r = random.uniform(-1, 1)
            low += 0.3 * (r - low)
            s += 0.9 * (r - low) * (1 - t / 0.012)
        _add(buf, n0 + i, vol * s * min(1.0, t / 0.0008))


def make_trash_bang(out):
    """La comida golpea el fondo del bote: "¡bonk!" grave + resonancia metálica + dos rebotes (la sacudida)."""
    b = silence(0.9)
    kick(b, 0, vol=0.7)  # el golpe sordo de la comida contra el fondo
    metal_hit(b, 0, vol=0.6)
    metal_hit(b, 0.11, vol=0.24, pitch=1.04)  # el bote se tambalea: rebotes más débiles
    metal_hit(b, 0.2, vol=0.1, pitch=0.97)
    for k in range(4):  # bolsa de basura que cruje un poquito
        noise(b, 0.02 + 0.035 * k, 0.03, 0.18, cutoff=0.5, adsr=(0.001, 0.01, 0.3, 0.015))
    wet = reverb(b, wet=0.12)
    save([math.tanh(1.3 * (b[i] + wet[i])) for i in range(len(b))], out / 'trash.wav', peak=0.85)


def brass(buf, start, length, freq, vol=0.2):
    """Metales sintetizados: dientes de sierra desafinados con un filtro que se abre al soplar."""
    n0 = int(start * SR)
    phases = [0.0, 0.33, 0.66]
    y = 0.0
    for i in range(int(length * SR)):
        t = i / SR
        raw = 0.0
        for k, d in enumerate((-0.004, 0.0, 0.005)):
            phases[k] += freq * (1 + d) * (1 + 0.004 * math.sin(2 * math.pi * 5.5 * t) * min(1.0, t / 0.3)) / SR
            raw += 2 * (phases[k] % 1.0) - 1
        cutoff = 0.05 + 0.25 * math.exp(-t * 6) + 0.08 * min(1.0, t / 0.04)
        y += cutoff * (raw / 3 - y)
        e = min(1.0, t / 0.025) * min(1.0, max(0.0, (length - t) / 0.08))
        _add(buf, n0 + i, vol * e * y)


def crash(buf, start, vol=0.3, length=1.6):
    """Platillo: ruido muy agudo que se apaga lento."""
    n0 = int(start * SR)
    low = 0.0
    for i in range(int(length * SR)):
        t = i / SR
        r = random.uniform(-1, 1)
        low += 0.55 * (r - low)
        _add(buf, n0 + i, vol * (r - low) * math.exp(-t * 2.6) * min(1.0, t / 0.002))


def glock(buf, start, freq, vol=0.2):
    """Campanitas (glockenspiel): seno agudo con un armónico metálico."""
    n0 = int(start * SR)
    for i in range(int(0.8 * SR)):
        t = i / SR
        s = math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(2 * math.pi * freq * 2.76 * t) * math.exp(-t * 12)
        _add(buf, n0 + i, vol * s * math.exp(-t * 4.5) * min(1.0, t / 0.001))


def make_win_band(out):
    """Fin de la partida: fanfarria con banda completa (metales, kalimba, marimba, bajo, batería, platillo y campanitas)."""
    beat = 0.5  # 120 bpm
    size = int(3.8 * SR)
    music = [0.0] * size
    rhythm = [0.0] * size
    # Acordes: Do – Fa – Sol – Do (el "final feliz" clásico).
    chords = [(0.0, 2 * beat, 'C3', [0, 4, 7]), (2 * beat, beat, 'F3', [0, 4, 7]), (3 * beat, beat, 'G3', [0, 4, 7])]
    for t0, length, root, triad in chords:
        r = note(root)
        sub_bass(rhythm, t0, min(length, beat) * 0.9, r / 2, vol=0.42)
        if length > beat:
            sub_bass(rhythm, t0 + beat, beat * 0.9, r / 2, vol=0.42)
        steps = int(length / (beat / 2))
        for k in range(steps):  # marimba en corcheas
            semis = (triad + [12])[k % 4]
            marimba(music, t0 + k * beat / 2, r * 2 * 2 ** (semis / 12), vol=0.16)
    # Melodía de la fanfarria: metales + kalimba doblando.
    melody = [('G4', 0.0, 0.24), ('C5', 0.25, 0.24), ('E5', 0.5, 0.24), ('G5', 0.75, 0.45),
              ('E5', 1.25, 0.2), ('F5', 1.5, 0.12), ('A5', 1.625, 0.12), ('B5', 1.75, 0.22)]  # en segundos
    for n, pos, dur in melody:
        brass(music, pos, dur, note(n), vol=0.2)
        brass(music, pos, dur, note(n) / 2, vol=0.1)
        kalimba(music, pos, note(n) * 2, vol=0.12, length=0.8)
    # Acorde final de Do mayor, largo, con todos.
    end = 4 * beat
    for n in ('C5', 'E5', 'G5', 'C6'):
        brass(music, end, 1.3, note(n), vol=0.13)
    pad(music, end - 0.3, 1.8, [note(n) for n in ('C4', 'E4', 'G4', 'C5')], vol=0.08)
    sub_bass(rhythm, end, 1.2, note('C2'), vol=0.5)
    kalimba(music, end, note('C6'), vol=0.25)
    for k, n in enumerate(('C6', 'E6', 'G6', 'C7', 'E7', 'G7')):  # destellos que suben
        glock(music, end + 0.05 + k * 0.06, note(n), vol=0.12)
    # Batería: bombo, palmas, shaker, redoble de djembé hacia el final y platillo.
    for pos in (0, 1, 2, 3, 3.5):
        kick(rhythm, pos * beat, vol=0.75)
    for pos in (1, 3):
        clap(music, pos * beat, vol=0.22)
    for k in range(16):
        shaker(rhythm, k * beat / 4, vol=0.08 if k % 2 else 0.04)
    for k, kind in enumerate(('tone', 'tone', 'slap', 'tone', 'slap', 'slap')):
        djembe(rhythm, 3 * beat + k * beat / 6, kind, vol=0.26 + 0.03 * k)
    kick(rhythm, end, vol=0.9)
    crash(music, end, vol=0.22)
    wet = reverb(music, wet=0.3)
    mix = [math.tanh(1.2 * (music[i] + wet[i] + rhythm[i])) for i in range(size)]
    fade = int(0.4 * SR)  # final suave
    for i in range(fade):
        mix[size - fade + i] *= 1 - i / fade
    save(mix, out / 'win.wav', peak=0.82)


if __name__ == '__main__':
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    make_effects(out)
    make_music_divu(out)
    # Los sonidos nuevos van después de la música: el ruido usa una secuencia aleatoria con
    # semilla fija, y así la música aprobada no cambia al agregar efectos.
    make_lid(out)
    make_chew(out)
    make_trash_bang(out)
    make_win_band(out)
