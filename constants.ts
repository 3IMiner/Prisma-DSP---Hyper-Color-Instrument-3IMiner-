import { Note, ChordType } from './types';

export const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORD_TYPES: ChordType[] = ['Major', 'Minor', 'Maj7', 'Min7', 'Diminished', 'Augmented'];

// Base frequencies for 4th octave (A4 = 440Hz)
const BASE_FREQUENCIES: Record<Note, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  'Major': [0, 4, 7], 
  'Minor': [0, 3, 7], 
  'Diminished': [0, 3, 6],
  'Augmented': [0, 4, 8],
  'Maj7': [0, 4, 7, 11],
  'Min7': [0, 3, 7, 10]
};

export const getFrequenciesForChord = (root: Note, type: ChordType, octave: number): number[] => {
  const rootBaseFreq = BASE_FREQUENCIES[root];
  const octaveMultiplier = Math.pow(2, octave - 4);
  const rootFreq = rootBaseFreq * octaveMultiplier;
  const intervals = CHORD_INTERVALS[type];
  
  return intervals.map(semitone => {
    return rootFreq * Math.pow(2, semitone / 12);
  });
};

// Keyboard mapping for "Z" through "M" and upper row
export const KEYBOARD_MAP: Record<string, { note: Note, octaveOffset: number }> = {
  'z': { note: 'C', octaveOffset: 0 },
  's': { note: 'C#', octaveOffset: 0 },
  'x': { note: 'D', octaveOffset: 0 },
  'd': { note: 'D#', octaveOffset: 0 },
  'c': { note: 'E', octaveOffset: 0 },
  'v': { note: 'F', octaveOffset: 0 },
  'g': { note: 'F#', octaveOffset: 0 },
  'b': { note: 'G', octaveOffset: 0 },
  'h': { note: 'G#', octaveOffset: 0 },
  'n': { note: 'A', octaveOffset: 0 },
  'j': { note: 'A#', octaveOffset: 0 },
  'm': { note: 'B', octaveOffset: 0 },
  ',': { note: 'C', octaveOffset: 1 }, // Next octave C
};