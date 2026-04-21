/**
 * BUSCA-RITMES · Àudio Procedural (Web Audio API)
 * -----------------------------------------------
 * Sons musicals generats en temps real.
 * PEDAGÒGIC: cada figura sona les seves notes
 *   ♩ Negra    → Do4
 *   𝅗𝅥 Blanca   → Do4 + Mi4
 *   𝅗𝅥. Bl.punt → Do4 + Mi4 + Sol4
 *   𝅝 Rodona   → Do4 + Mi4 + Sol4 + Do5
 */

'use strict';

const Sounds = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;

  // Inicialitza AudioContext en el primer gesture de l'usuari
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.1, delay = 0) {
    if (muted) return;
    const c = init();
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = type;
    osc.frequency.value = freq;
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.15, cutoff = 500, delay = 0) {
    if (muted) return;
    const c = init();
    const samples = Math.ceil(c.sampleRate * dur);
    const buf  = c.createBuffer(1, samples, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
    const src  = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = cutoff;
    filt.Q.value = 0.8;
    const gain = c.createGain();
    src.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t);
  }

  // Mapa de notes per figura rítmica (igual que al joc pedagògic)
  const CHORD = {
    0: [],                    // buit: silenci
    1: [261.6],               // Negra    → Do4
    2: [261.6, 329.6],        // Blanca   → Do4 Mi4
    3: [261.6, 329.6, 392.0], // Bl.punt  → Do4 Mi4 Sol4
    4: [261.6, 329.6, 392.0, 523.3] // Rodona → Do4 Mi4 Sol4 Do5
  };

  return {
    // Revela una casella: el so depèn del valor adjacent
    revealNote(adj) {
      if (muted) return;
      const notes = CHORD[Math.min(adj, 4)];
      if (!notes.length) {
        tone(180, 0.06, 'sine', 0.04); // buit: clic suau
        return;
      }
      notes.forEach((n, i) => tone(n, 0.18, 'sine', 0.09 - i * 0.01, i * 0.018));
    },

    // Flood fill massiu: acord que s'amplia amb la mida
    floodReveal(count) {
      if (muted) return;
      if (count <= 1) { this.revealNote(0); return; }
      const vol = Math.min(0.07, 0.05 + count * 0.002);
      const chordNotes = count >= 10
        ? [130.8, 261.6, 329.6, 392.0, 523.3]
        : count >= 5
        ? [261.6, 329.6, 392.0, 523.3]
        : [261.6, 329.6, 392.0];
      chordNotes.forEach((n, i) => tone(n, 0.3, 'sine', vol, i * 0.04));
    },

    // Batuta posada
    flag() {
      tone(659.3, 0.08, 'sine', 0.11);
      tone(783.9, 0.10, 'sine', 0.09, 0.07);
    },

    // Batuta llevada
    unflag() {
      tone(783.9, 0.07, 'sine', 0.09);
      tone(493.9, 0.09, 'sine', 0.07, 0.07);
    },

    // Explosió: drama màxim
    explode() {
      // Acord dissonant descendent
      [110, 146.8, 196, 233.1].forEach((n, i) =>
        tone(n, 0.5 - i * 0.05, 'sawtooth', 0.12, i * 0.03)
      );
      noise(0.35, 0.22, 300);
      noise(0.18, 0.15, 1200, 0.05);
      tone(65, 0.6, 'sine', 0.35, 0.04);
    },

    // Victòria: fanfara Do major
    victory() {
      // Melodia ascendent
      const mel = [261.6, 329.6, 392.0, 523.3, 659.3, 783.9, 1046.5];
      mel.forEach((n, i) => tone(n, 0.4, 'sine', 0.13, i * 0.1));
      // Harmonia
      const harm = [196.0, 246.9, 294.0, 392.0, 493.9, 587.3];
      harm.forEach((n, i) => tone(n, 0.45, 'triangle', 0.05, i * 0.1 + 0.05));
      // Baix
      tone(130.8, 0.8, 'sine', 0.18, 0);
      tone(196.0, 0.7, 'sine', 0.12, 0.3);
    },

    // Primer clic (inici partida)
    start() {
      tone(523.3, 0.1, 'sine', 0.08);
      tone(659.3, 0.1, 'sine', 0.06, 0.1);
    },

    toggle() { muted = !muted; return muted; }
  };
})();
