import React, { useState, useEffect } from 'react';
import { Music, Sliders, Zap, Activity, Waves } from 'lucide-react';
import { useAudioEngine } from './hooks/useAudioEngine';
import Visualizer from './components/Visualizer';
import Knob from './components/Knob';
import Piano from './components/Piano';
import { CHORD_TYPES, KEYBOARD_MAP } from './constants';
import { AudioParameters, Note, ChordType } from './types';

export default function App() {
  const { 
    analyser, 
    updateParameters, 
    triggerNote,
    activeNote,
    isPlaying 
  } = useAudioEngine();

  // ----- State -----
  const [params, setParams] = useState<AudioParameters>({
    color: 0.85,       // Max Drive for FM Metal
    flow: 0.35,        // Slower, heavier wobble
    depth: 0.65,       // Moderate depth
    resonance: 0.95,   // MAX RESONANCE (The "Metal" knob)
    disperser: 0.70,   // High Laser
    width: 1.0,        // Full Stereo
    rootNote: 'C',
    chordType: 'Maj7', 
    octave: 4
  });

  // ----- Effects -----

  useEffect(() => {
    updateParameters(params);
  }, [params, updateParameters]);

  // Handle Computer Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key]) {
        const mapping = KEYBOARD_MAP[key];
        triggerNote(mapping.note, params.octave + mapping.octaveOffset, params);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerNote, params]);

  // ----- Handlers -----

  const handlePianoPlay = (note: Note) => {
    triggerNote(note, params.octave, params);
  };

  const updateParam = (key: keyof AudioParameters, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-200 p-4 md:p-8 flex flex-col items-center select-none font-sans">
      
      {/* Header */}
      <header className="w-full max-w-4xl mb-6 flex justify-between items-center border-b border-fuchsia-900/30 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-600 to-purple-800 rounded-xl shadow-[0_0_30px_rgba(192,38,211,0.5)] flex items-center justify-center relative overflow-hidden group border border-fuchsia-400/50">
            <Waves className="text-white w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 neon-text">
              HYPER FLORA
            </h1>
            <p className="text-[10px] text-fuchsia-400 tracking-[0.3em] font-bold uppercase">Spectral Resonator Engine</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 justify-end text-cyan-400 font-mono text-[10px] bg-cyan-900/20 px-2 py-1 rounded">
             <Activity className="w-3 h-3" /> ENGINE: FM_SQUARE_METAL
          </div>
          <div className="text-[10px] text-slate-600 font-mono">v4.0 // AU5_ARCH</div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Top: Visuals & Macro Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visualizer */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-1 shadow-2xl backdrop-blur-md relative overflow-hidden">
             <Visualizer analyser={analyser} isPlaying={isPlaying} />
             {/* Overlay info */}
             <div className="absolute top-4 left-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-fuchsia-500/80">SPECTRUM</span>
                <span className="text-xs font-display font-bold text-white/90">
                   {activeNote ? `${activeNote}${params.octave} ${params.chordType.toUpperCase()}` : 'IDLE'}
                </span>
             </div>
          </div>

          {/* Flow Control (LFO) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] rounded-full pointer-events-none" />
             
             <div className="flex items-center gap-2 text-fuchsia-400 font-display font-bold text-sm tracking-widest mb-4 z-10">
               <Waves className="w-4 h-4" /> FLOW CONTROL
             </div>

             <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>RATE (WOBBLE)</span>
                    <span className="text-fuchsia-400">{(params.flow * 15).toFixed(1)} Hz</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={params.flow}
                    onChange={(e) => updateParam('flow', parseFloat(e.target.value))}
                    className="w-full accent-fuchsia-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>DEPTH (FM MOD)</span>
                    <span className="text-cyan-400">{(params.depth * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={params.depth}
                    onChange={(e) => updateParam('depth', parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Middle: Sound Design Knobs */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-lg font-display font-black text-slate-300 tracking-[0.2em] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-500" />
                TIMBRE & TEXTURE
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative z-10">
              <Knob 
                label="DRIVE" 
                value={params.color} 
                min={0} max={1} 
                onChange={(v) => updateParam('color', v)} 
                color="cyan"
              />
              <Knob 
                label="METALLIC" 
                value={params.resonance} 
                min={0} max={1} 
                onChange={(v) => updateParam('resonance', v)} 
                color="fuchsia"
              />
              <Knob 
                label="LASER Q" 
                value={params.disperser} 
                min={0} max={1} 
                onChange={(v) => updateParam('disperser', v)} 
                color="cyan"
              />
               <Knob 
                label="WIDTH" 
                value={params.width} 
                min={0} max={1} 
                onChange={(v) => updateParam('width', v)} 
                color="fuchsia"
              />
              {/* Octave Selector */}
              <div className="flex flex-col items-center justify-end h-full pb-2">
                 <div className="flex flex-col gap-1 w-14">
                   {[5, 4, 3].map(oct => (
                     <button
                       key={oct}
                       onClick={() => updateParam('octave', oct)}
                       className={`h-5 w-full rounded text-[9px] font-bold transition-all border border-transparent ${
                         params.octave === oct 
                          ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_#d946ef] border-fuchsia-400' 
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                       }`}
                     >
                       OCT {oct}
                     </button>
                   ))}
                 </div>
                 <div className="mt-4 text-[10px] font-bold text-slate-500 font-display tracking-wider">PITCH</div>
              </div>
            </div>
        </div>

        {/* Bottom: Piano & Chords */}
        <div className="bg-slate-950 border-t-2 border-fuchsia-600/50 rounded-2xl overflow-hidden shadow-2xl">
           <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center backdrop-blur-sm">
             
             {/* Live Indicator */}
             <div className="flex items-center gap-2 text-xs text-fuchsia-400 font-bold font-display tracking-widest">
               <Zap className="w-4 h-4 fill-current animate-pulse" />
               LIVE INPUT
             </div>

             {/* Chord Selector */}
             <div className="flex items-center gap-3">
               <span className="text-xs text-slate-500 font-mono font-bold">CHORD MAP:</span>
               <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                 {CHORD_TYPES.map(chord => (
                    <button
                      key={chord}
                      onClick={() => updateParam('chordType', chord)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                        params.chordType === chord
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {chord}
                    </button>
                 ))}
               </div>
             </div>
           </div>
           
           <div className="p-1 bg-slate-950">
             <Piano onNotePlay={handlePianoPlay} activeNote={activeNote} />
           </div>
           
           <div className="bg-slate-950 p-3 text-center border-t border-slate-900">
             <p className="text-[10px] text-slate-600 font-mono tracking-wide">
               PRESS KEYS [ Z-M ] TO TRIGGER HYPERGROWLS
             </p>
           </div>
        </div>

      </main>
    </div>
  );
}