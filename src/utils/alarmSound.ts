/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sound synthesizer using standard Web Audio API for cross-platform reliability without external assets

export type AlarmSoundType = 'holiday' | 'shift_ended' | 'shift_active' | 'swap_notification' | 'swap_reminder';

export function playAlarmSound(type: AlarmSoundType = 'shift_active') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playTone = (
      freq: number,
      start: number,
      duration: number,
      vol = 0.35,
      oscType: OscillatorType = 'sine'
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    if (type === 'holiday') {
      // Warm, joyful holiday celebration chime melody (arpeggio C5 -> E5 -> G5 -> C6 -> E6)
      playTone(523.25, 0.0, 0.35, 0.35); // C5
      playTone(659.25, 0.16, 0.35, 0.35); // E5
      playTone(783.99, 0.32, 0.35, 0.38); // G5
      playTone(1046.5, 0.5, 0.6, 0.42); // C6
      playTone(1318.5, 0.78, 0.7, 0.35); // E6
      // Gentle soft harmonic resonance
      playTone(523.25, 0.5, 0.8, 0.2);
    } else if (type === 'shift_ended') {
      // Clear shift completion & handoff chime bell
      playTone(659.25, 0.0, 0.22, 0.35); // E5
      playTone(880.0, 0.18, 0.25, 0.4); // A5
      playTone(1174.66, 0.38, 0.5, 0.45); // D6
      playTone(880.0, 0.65, 0.4, 0.25); // A5
      playTone(587.33, 0.9, 0.6, 0.3); // D5 finale
    } else if (type === 'swap_notification') {
      // Pleasant broadcast chime for all staff (F5 -> A5 -> C6)
      playTone(698.46, 0.0, 0.25, 0.35); // F5
      playTone(880.0, 0.15, 0.25, 0.38); // A5
      playTone(1046.5, 0.32, 0.5, 0.4);  // C6
    } else if (type === 'swap_reminder') {
      // Urgent yet friendly reminder bell (A5 -> D6 -> A5)
      playTone(880.0, 0.0, 0.2, 0.35);   // A5
      playTone(1174.66, 0.16, 0.35, 0.4); // D6
      playTone(880.0, 0.42, 0.3, 0.35);  // A5
    } else {
      // Standard active shift alert: 3 beeps + double chime
      playTone(880, 0, 0.14, 0.38);
      playTone(880, 0.18, 0.14, 0.38);
      playTone(880, 0.36, 0.14, 0.38);
      playTone(1320, 0.58, 0.4, 0.35);
      playTone(1046, 0.95, 0.5, 0.35);
    }
  } catch (e) {
    console.warn('Audio play error (user interaction might be required):', e);
  }
}
