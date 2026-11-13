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


def make_music_divu(out):
    """Melodía alegre "del desierto" para el juego de Divu, en bucle sin cortes."""
    bpm = 112
    beat = 60 / bpm
    bars = 8
    total = bars * 4 * beat
    b = silence(total)

    # Bajo saltarín (triángulo): raíz y quinta por compás.
    progression = ['A2', 'A2', 'D3', 'E3', 'A2', 'A2', 'D3', 'E3']
    fifths = {'A2': 'E3', 'D3': 'A3', 'E3': 'B3'}
    for bar, root in enumerate(progression):
        for k in range(4):
            n = root if k % 2 == 0 else fifths[root]
            tone(b, (bar * 4 + k) * beat, beat * 0.55, note(n), 'tri', 0.42, adsr=(0.004, 0.06, 0.5, 0.06))

    # Melodía (cuadrada suave) en escala pentatónica menor de La, con aire de desierto.
    melody = [
        ('A4', 0, 1), ('C5', 1, 0.5), ('D5', 1.5, 0.5), ('E5', 2, 1), ('G5', 3, 1),
        ('E5', 4, 0.5), ('D5', 4.5, 0.5), ('C5', 5, 1), ('A4', 6, 2),
        ('D5', 8, 1), ('E5', 9, 0.5), ('G5', 9.5, 0.5), ('A5', 10, 1), ('G5', 11, 1),
        ('E5', 12, 1), ('D5', 13, 0.5), ('E5', 13.5, 0.5), ('B4', 14, 2),
        ('A4', 16, 1), ('C5', 17, 0.5), ('D5', 17.5, 0.5), ('E5', 18, 1), ('A5', 19, 1),
        ('G5', 20, 0.5), ('E5', 20.5, 0.5), ('D5', 21, 1), ('C5', 22, 2),
        ('D5', 24, 1), ('E5', 25, 1), ('G5', 26, 0.5), ('E5', 26.5, 0.5), ('D5', 27, 1),
        ('B4', 28, 1), ('C5', 29, 0.5), ('B4', 29.5, 0.5), ('A4', 30, 1.5),
    ]
    for n, start, length in melody:
        tone(b, start * beat, length * beat * 0.9, note(n), 'square', 0.16, duty=0.25, vib=0.004, adsr=(0.006, 0.08, 0.55, 0.08))
        tone(b, start * beat, length * beat * 0.9, note(n) * 2, 'sine', 0.05, adsr=(0.006, 0.08, 0.4, 0.08))

    # Percusión ligera: bombo en 1 y 3, maraca en contratiempos.
    for k in range(bars * 4):
        t = k * beat
        if k % 2 == 0:
            tone(b, t, 0.14, 120, 'sine', 0.55, freq_end=45, adsr=(0.002, 0.04, 0.3, 0.08))
        noise(b, t + beat / 2, 0.06, 0.12, cutoff=0.9, adsr=(0.001, 0.02, 0.2, 0.03))

    # Ninguna nota pasa del último compás, así el bucle vuelve al inicio sin clic.
    save(b, out / 'music-divu.wav', peak=0.7)


if __name__ == '__main__':
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    make_effects(out)
    make_music_divu(out)
