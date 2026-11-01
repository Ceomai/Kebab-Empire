/* Kebab Empire — ses
   Bütün sesler tarayıcıda sentezlenir (dosya yok). Kasa, zil, eşleşme arpeji, tezgâh, hedef fanfarı
   ve hicaz makamında hafif bir saz ezgisi. Ses ancak oyuncu düğmeye bastıktan sonra başlar. */
(function () {
  /** @type {any} */
  const S = KE.SND = { on: false };
  let ctx = null, master = null, musicGain = null, musicTimer = null, nextNote = 0, step = 0;
  const last = {};
  try { S.on = localStorage.getItem('kebab-empire-sound') === '1'; } catch (e) { S.on = false; }
  S.wanted = S.on;
  S.on = false;

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    return true;
  }
  function tone(freq, t, dur, type, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  function noise(t, dur, freq, vol) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }
  const FX = {
    cash: (t) => { noise(t, 0.05, 4000, 0.25); tone(1568, t + 0.03, 0.18, 'square', 0.05); tone(2093, t + 0.09, 0.35, 'sine', 0.12); },
    tip: (t) => { tone(2637, t, 0.12, 'sine', 0.08); tone(3136, t + 0.06, 0.2, 'sine', 0.06); },
    ready: (t) => { tone(1318, t, 0.4, 'triangle', 0.07); tone(1975, t, 0.3, 'sine', 0.03); },
    match: (t) => { [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.07, 0.3, 'triangle', 0.09)); },
    bad: (t) => { const o = tone(240, t, 0.3, 'sawtooth', 0.04); o.frequency.exponentialRampToValueAtTime(150, t + 0.28); },
    sizzle: (t) => { noise(t, 0.6, 3200, 0.06); },
    click: (t) => { tone(880, t, 0.06, 'square', 0.03); },
    goal: (t) => { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, t + i * 0.09, 0.35, i > 3 ? 'square' : 'triangle', i > 3 ? 0.05 : 0.1)); },
    banner: (t) => { tone(392, t, 0.18, 'triangle', 0.12); tone(587, t + 0.14, 0.3, 'triangle', 0.12); noise(t, 0.08, 200, 0.4); },
    open: (t) => { [392, 494, 587, 784].forEach((f, i) => tone(f, t + i * 0.1, 0.4, 'triangle', 0.1)); }
  };
  const GAP = { cash: 220, tip: 260, ready: 300, match: 400, bad: 500, sizzle: 1400, click: 40 };
  S.play = function (name) {
    if (!S.on || !ctx || !FX[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < (GAP[name] || 0)) return;
    last[name] = now;
    FX[name](ctx.currentTime + 0.01);
  };

  /* Hicaz makamında kısa, dönen bir saz ezgisi (D Eb F# G A Bb C D) */
  const HICAZ = [293.7, 311.1, 370.0, 392.0, 440.0, 466.2, 523.3, 587.3];
  const MELODY = [0, 2, 3, 4, 3, 2, 1, 0, 4, 5, 4, 3, 2, 3, 2, 1, 0, -1, 0, 2, 4, 6, 5, 4, 3, 4, 3, 2, 1, 2, 0, -1];
  const BASS = [0, 0, 4, 4, 3, 3, 0, 0];
  function schedule() {
    while (nextNote < ctx.currentTime + 0.25) {
      const n = MELODY[step % MELODY.length];
      if (n >= 0) {
        const f = HICAZ[n];
        tone(f, nextNote, 0.32, 'triangle', 0.11, musicGain);
        tone(f * 2, nextNote, 0.12, 'sine', 0.025, musicGain);
      }
      if (step % 4 === 0) tone(HICAZ[BASS[(step / 4) % BASS.length]] / 2, nextNote, 0.7, 'sine', 0.12, musicGain);
      if (step % 2 === 0) noise(nextNote, 0.04, step % 8 === 0 ? 180 : 2500, step % 8 === 0 ? 0.5 : 0.08);
      nextNote += 0.2;
      step++;
    }
  }
  function startMusic() {
    if (musicTimer) return;
    nextNote = ctx.currentTime + 0.1;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.8);
    musicTimer = setInterval(schedule, 90);
  }
  function stopMusic() {
    if (!musicTimer) return;
    clearInterval(musicTimer); musicTimer = null;
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  }
  S.set = function (on) {
    if (on && !init()) return false;
    S.on = on;
    S.wanted = on;
    try { localStorage.setItem('kebab-empire-sound', on ? '1' : '0'); } catch (e) { /* yok say */ }
    if (on) { if (ctx.state === 'suspended') ctx.resume(); startMusic(); S.play('open'); } else if (ctx) stopMusic();
    return true;
  };
  S.toggle = () => S.set(!S.on);
  /* Tercih açıksa ilk tıklamada sesi başlat (tarayıcı kuralı) */
  document.addEventListener('pointerdown', function first(e) {
    if (/** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('[data-a="sound"]')) { document.removeEventListener('pointerdown', first); return; }
    document.removeEventListener('pointerdown', first);
    if (S.wanted && !S.on) S.set(true);
  });
})();
