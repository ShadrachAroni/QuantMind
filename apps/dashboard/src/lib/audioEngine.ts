export const createAudioEngine = () => {
  let audioCtx: AudioContext | null = null;
  let droneOsc: OscillatorNode | null = null;
  let droneGain: GainNode | null = null;
  let isMuted = false;

  const initContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  };

  const playChirp = () => {
    if (isMuted || !audioCtx) return;
    
    // Quick high-pitched chirp for digital processing effect
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3600, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  const startDrone = () => {
    if (isMuted) return;
    initContext();
    if (!audioCtx) return;

    if (droneOsc) stopDrone();

    droneOsc = audioCtx.createOscillator();
    droneGain = audioCtx.createGain();

    // Low mysterious hum
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 55; // Sub-bass A1
    
    // Slight modulation
    const modOsc = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    modOsc.frequency.value = 2; // 2Hz wobble
    modGain.gain.value = 5;
    modOsc.connect(modGain);
    modGain.connect(droneOsc.frequency);
    modOsc.start();

    droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1);

    droneOsc.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    
    droneOsc.start();
  };

  const stopDrone = () => {
    if (droneGain && audioCtx) {
      droneGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (droneOsc) {
          try { droneOsc.stop(); } catch (e) {}
          droneOsc.disconnect();
          droneOsc = null;
        }
        if (droneGain) {
          droneGain.disconnect();
          droneGain = null;
        }
      }, 500);
    }
  };

  const setMute = (mute: boolean) => {
    isMuted = mute;
    if (mute) {
      stopDrone();
    }
  };

  return {
    initContext,
    playChirp,
    startDrone,
    stopDrone,
    setMute,
    get isMuted() { return isMuted; }
  };
};

// Singleton instance for the whole app
export const globalAudioEngine = typeof window !== 'undefined' ? createAudioEngine() : null;
