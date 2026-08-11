/**
 * Soft notification chime via Web Audio (no asset file).
 * Short two-tone "ding" — quiet enough for workplace use.
 */
let sharedCtx = null;
let unlockBound = false;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) sharedCtx = new AudioCtx();
  return sharedCtx;
}

/** Call once after a user gesture so later message sounds are allowed */
export function unlockNotifySound() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const unlock = () => {
    const ctx = getCtx();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function playMessageNotifySound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;

    // Browsers may start suspended until a user gesture; resume if possible
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playTone = (freq, start, duration, gainValue) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    // Soft rising ding
    playTone(880, now, 0.12, 0.045);
    playTone(1175, now + 0.1, 0.16, 0.035);
  } catch {
    // Ignore audio failures (autoplay policy, unsupported browsers)
  }
}
