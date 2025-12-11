export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ChordType = 'Major' | 'Minor' | 'Diminished' | 'Augmented' | 'Maj7' | 'Min7';

export interface AudioParameters {
  color: number;          // FM Modulation Index (Metallic character)
  flow: number;           // LFO Rate (The "Wobble" speed)
  depth: number;          // LFO Depth (How much it wobbles)
  resonance: number;      // Filter Q
  disperser: number;      // Allpass intensity
  width: number;          // Stereo Spread
  rootNote: Note;
  chordType: ChordType;
  octave: number;
}

export interface Preset {
  name: string;
  description: string;
  params: AudioParameters;
}