import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioParameters, Note } from '../types';
import { getFrequenciesForChord } from '../constants';

// Create a 2-second buffer of white noise for the "Breath/Splash" layer
const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

// Aggressive distortion curve (Hard Clipping/Foldback hybrid)
const makeDistortionCurve = (amount: number) => {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    // Harder curve for more harmonics
    curve[i] = (3 + k) * x * 57 * (Math.PI / 180) / (Math.PI + k * Math.abs(x)); 
  }
  return curve;
};

interface AudioGraph {
  context: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
  compressor: DynamicsCompressorNode;
  
  // FX Chain
  disperserInput: GainNode;
  disperserFilters: BiquadFilterNode[];
  
  // Global Modulators
  lfo: OscillatorNode;
  lfoGain: GainNode;
  
  // Resources
  distortionCurve: Float32Array;
  noiseBuffer: AudioBuffer;
}

export const useAudioEngine = () => {
  const graphRef = useRef<AudioGraph | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const activeVoices = useRef<Set<{ stop: (t: number) => void }>>(new Set());

  useEffect(() => {
    const initAudio = () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // --- LFO (The "Wub" Motor) ---
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 3;
      lfo.start();

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.0; 
      lfo.connect(lfoGain);

      // --- Post-FX Chain ---
      // OTT-Style Compression: Smashes the sound to bring up the metallic details
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -45.0; // Lower threshold to catch tails
      compressor.knee.value = 0.0;
      compressor.ratio.value = 20.0; // Limiter
      compressor.attack.value = 0.001; 
      compressor.release.value = 0.1;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;

      // Disperser (Allpass Chain) - High Laser Zap
      const disperserInput = ctx.createGain();
      let prevNode: AudioNode = disperserInput;
      const disperserFilters: BiquadFilterNode[] = [];

      // 16 stages for maximum "Zap" (Color Bass often uses many allpass filters)
      for(let i=0; i<16; i++) {
        const ap = ctx.createBiquadFilter();
        ap.type = 'allpass';
        ap.frequency.value = 600 + (i * 200); 
        ap.Q.value = 4.0; // High Q for metallic chirp
        prevNode.connect(ap);
        prevNode = ap;
        disperserFilters.push(ap);
      }
      
      prevNode.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      graphRef.current = {
        context: ctx,
        masterGain,
        analyser,
        compressor,
        disperserInput,
        disperserFilters,
        lfo,
        lfoGain,
        distortionCurve: makeDistortionCurve(100), 
        noiseBuffer: createNoiseBuffer(ctx),
      };
      
      setIsPlaying(true);
    };

    initAudio();

    return () => {
      graphRef.current?.context.close();
    };
  }, []);

  const updateParameters = useCallback((params: AudioParameters) => {
    if (!graphRef.current) return;
    const g = graphRef.current;
    const now = g.context.currentTime;

    // LFO Rate
    const rate = 0.1 + (params.flow * 14);
    g.lfo.frequency.setTargetAtTime(rate, now, 0.1);
    
    // Disperser Tone (Q)
    const targetQ = 1.0 + (params.disperser * 10.0); // Very High Q capability
    g.disperserFilters.forEach((f) => {
      f.Q.setTargetAtTime(targetQ, now, 0.1);
    });
  }, []);

  const triggerNote = useCallback((note: Note, octave: number, params: AudioParameters) => {
    if (!graphRef.current) return;
    const ctx = graphRef.current.context;
    const g = graphRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    setActiveNote(note);
    setTimeout(() => setActiveNote(null), 150);

    const chordFreqs = getFrequenciesForChord(note, params.chordType, octave);
    // Base freq for modulation
    const growlBaseFreq = chordFreqs[0] / 2;

    // ==========================================
    // 1. METALLIC EXCITER (FM Square + Noise)
    // ==========================================
    
    // Carrier: Sine (Pure base)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = growlBaseFreq;

    // Modulator: SQUARE (This is key for Metal/Bell sounds)
    // Square waves impose odd harmonics which sound hollow/metallic when FM'd
    const mod = ctx.createOscillator();
    mod.type = 'square'; 
    mod.frequency.value = growlBaseFreq * 2.0; // Ratio 1:2

    const modGain = ctx.createGain();
    // Huge modulation index for that "shattered glass" sound
    modGain.gain.value = growlBaseFreq * (4 + params.color * 20); 

    // Noise Splash (Transient)
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = g.noiseBuffer;
    noiseSrc.loop = true;
    const noiseGain = ctx.createGain();
    // Short burst to ping the comb filters
    noiseGain.gain.setValueAtTime(0.8 * params.color, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    // Waveshaper
    const shaper = ctx.createWaveShaper();
    shaper.curve = g.distortionCurve;
    shaper.oversample = '4x';

    // Connections
    mod.connect(modGain);
    modGain.connect(carrier.frequency); 
    carrier.connect(shaper);
    noiseSrc.connect(noiseGain);
    noiseGain.connect(shaper); 

    // LFO (Wub)
    const lfoMod = ctx.createGain();
    lfoMod.gain.value = 1200 * params.depth;
    g.lfo.connect(lfoMod);
    lfoMod.connect(modGain.gain); 


    // ==========================================
    // 2. RESONATOR BANK (Infinite Ring)
    // ==========================================
    
    const resonatorInput = shaper;
    const voiceOutput = ctx.createGain();
    
    // Mix
    const dryGain = ctx.createGain();
    dryGain.gain.value = (1 - params.resonance) * 0.2;
    resonatorInput.connect(dryGain);
    dryGain.connect(voiceOutput);

    const wetBus = ctx.createGain();
    wetBus.gain.value = params.resonance * 3.0; // Boost wet heavily
    
    const activeNodes: AudioNode[] = [];

    chordFreqs.forEach((freq, i) => {
      const inputGain = ctx.createGain();
      inputGain.gain.value = 0.5;

      const delayTime = 1 / freq;
      const delay = ctx.createDelay(1.0); 
      delay.delayTime.value = delayTime;

      const feedback = ctx.createGain();
      // CRITICAL: Feedback near 1.0 for metallic ring
      // Range: 0.90 to 0.99
      feedback.gain.value = 0.90 + (params.resonance * 0.09);

      const dampening = ctx.createBiquadFilter();
      dampening.type = 'lowpass';
      // CRITICAL: Remove dampening (Open to 20kHz)
      // Dampening kills the metal. We want the metal.
      dampening.frequency.value = 20000; 
      dampening.Q.value = 0.0;

      // Pan
      const panner = ctx.createStereoPanner();
      const spread = i % 2 === 0 ? 1 : -1;
      panner.pan.value = spread * params.width;

      resonatorInput.connect(inputGain);
      inputGain.connect(delay);
      delay.connect(dampening);
      dampening.connect(feedback);
      feedback.connect(delay);

      delay.connect(panner);
      panner.connect(wetBus);

      activeNodes.push(inputGain, delay, feedback, dampening, panner);
    });

    wetBus.connect(voiceOutput);
    voiceOutput.connect(g.disperserInput);

    // ==========================================
    // 3. HARD GATE ENVELOPE
    // ==========================================
    
    // We let the metal ring forever (feedback 0.99), but we slice it with volume.
    
    const attack = 0.005;
    const decay = 0.1;
    const sustain = 1.0; // Full volume hold
    const release = 0.05; // Instant cut

    voiceOutput.gain.setValueAtTime(0, now);
    voiceOutput.gain.linearRampToValueAtTime(1.0, now + attack);
    voiceOutput.gain.setValueAtTime(sustain, now + attack + decay);
    
    // Hard Cut
    voiceOutput.gain.setTargetAtTime(0, now + attack + decay + 0.1, release / 5); 
    
    // Start
    mod.start(now);
    carrier.start(now);
    noiseSrc.start(now);

    const stopTime = now + attack + decay + release + 0.2;
    
    const stopVoice = () => {
      try {
        mod.stop(stopTime);
        carrier.stop(stopTime);
        noiseSrc.stop(stopTime);
        setTimeout(() => {
          mod.disconnect();
          modGain.disconnect();
          carrier.disconnect();
          noiseSrc.disconnect();
          noiseGain.disconnect();
          shaper.disconnect();
          lfoMod.disconnect();
          dryGain.disconnect();
          wetBus.disconnect();
          activeNodes.forEach(n => n.disconnect());
          voiceOutput.disconnect();
        }, (stopTime - now) * 1000 + 100);
      } catch(e) {}
    };

    activeVoices.current.add({ stop: stopVoice });
    stopVoice();

  }, []);

  return {
    analyser: graphRef.current?.analyser,
    updateParameters,
    triggerNote,
    activeNote,
    isPlaying
  };
};