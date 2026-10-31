/**
 * Tiny synthesized sound effects (Web Audio) — no audio files needed.
 * Every call is a no-op when sound is disabled or audio isn't available.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  freq: number;
  to?: number;
  start?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function tone(ac: AudioContext, { freq, to, start = 0, duration, type = "sine", volume = 0.18 }: ToneOptions) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(ac: AudioContext, { start = 0, duration = 0.15, volume = 0.25, cutoff = 1200 }) {
  const t0 = ac.currentTime + start;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  /** Bright two-note chime. */
  complete() {
    const ac = audio();
    if (!ac) return;
    tone(ac, { freq: 784, duration: 0.14, type: "triangle", volume: 0.16 });
    tone(ac, { freq: 1175, start: 0.07, duration: 0.32, type: "sine", volume: 0.18 });
    tone(ac, { freq: 2350, start: 0.12, duration: 0.25, type: "sine", volume: 0.04 });
  },
  /** Warmer chime for priority habits. */
  completeGold() {
    const ac = audio();
    if (!ac) return;
    tone(ac, { freq: 659, duration: 0.14, type: "triangle", volume: 0.16 });
    tone(ac, { freq: 988, start: 0.07, duration: 0.18, type: "triangle", volume: 0.14 });
    tone(ac, { freq: 1319, start: 0.14, duration: 0.4, type: "sine", volume: 0.16 });
  },
  undo() {
    const ac = audio();
    if (!ac) return;
    tone(ac, { freq: 420, to: 300, duration: 0.12, type: "sine", volume: 0.08 });
  },
  tick() {
    const ac = audio();
    if (!ac) return;
    tone(ac, { freq: 1200, duration: 0.05, type: "triangle", volume: 0.05 });
  },
  giftShake() {
    const ac = audio();
    if (!ac) return;
    for (let i = 0; i < 4; i++) noise(ac, { start: i * 0.16, duration: 0.07, volume: 0.08, cutoff: 900 });
  },
  giftOpen() {
    const ac = audio();
    if (!ac) return;
    [523, 659, 784, 1047, 1319].forEach((freq, i) =>
      tone(ac, { freq, start: i * 0.07, duration: 0.35, type: "triangle", volume: 0.13 }),
    );
    tone(ac, { freq: 2093, start: 0.36, duration: 0.6, type: "sine", volume: 0.06 });
  },
  hit() {
    const ac = audio();
    if (!ac) return;
    noise(ac, { duration: 0.12, volume: 0.3, cutoff: 1800 });
    tone(ac, { freq: 220, to: 70, duration: 0.18, type: "square", volume: 0.08 });
  },
  crit() {
    const ac = audio();
    if (!ac) return;
    noise(ac, { duration: 0.3, volume: 0.45, cutoff: 2600 });
    tone(ac, { freq: 160, to: 40, duration: 0.4, type: "sawtooth", volume: 0.14 });
    tone(ac, { freq: 1568, start: 0.05, duration: 0.25, type: "square", volume: 0.05 });
  },
  victory() {
    const ac = audio();
    if (!ac) return;
    const notes = [523, 523, 523, 659, 784, 1047];
    const starts = [0, 0.12, 0.24, 0.4, 0.58, 0.8];
    notes.forEach((freq, i) =>
      tone(ac, { freq, start: starts[i], duration: i === 5 ? 0.9 : 0.16, type: "square", volume: 0.07 }),
    );
    tone(ac, { freq: 262, start: 0.8, duration: 0.9, type: "triangle", volume: 0.12 });
  },
};
