import React from 'react';
import { NOTES } from '../constants';
import { Note } from '../types';

interface PianoProps {
  onNotePlay: (note: Note) => void;
  activeNote: Note | null;
}

const Piano: React.FC<PianoProps> = ({ onNotePlay, activeNote }) => {
  const isBlackKey = (note: string) => note.includes('#');

  return (
    <div className="relative h-32 flex justify-center bg-slate-900 p-1 rounded-b-xl select-none overflow-hidden">
      {NOTES.map((note) => {
        const black = isBlackKey(note);
        if (black) return null; // Skip rendering black keys in the main flow, we render them absolutely

        // Render White Key
        const isActive = activeNote === note;
        return (
          <div
            key={note}
            onMouseDown={() => onNotePlay(note)}
            className={`
              relative w-12 h-full mx-0.5 rounded-b-lg cursor-pointer transition-all active:scale-95 active:origin-top
              ${isActive ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] z-10' : 'bg-slate-200 hover:bg-white'}
            `}
          >
             <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-900 font-bold text-xs">{note}</span>
          </div>
        );
      })}

      {/* Render Black Keys Absolutely */}
      <div className="absolute top-0 left-0 w-full h-20 flex justify-center pointer-events-none">
         {/* This requires manual spacing logic or a more complex grid, simplified here for visual estimation */}
         {/* We will iterate notes again to place black keys relative to white keys logic roughly */}
         {NOTES.map((note, idx) => {
             if (!isBlackKey(note)) return null;
             
             // Calculate approximate position. 
             // C is index 0. C# is 1. D is 2.
             // Visual offset logic: 
             // C# is between 1st and 2nd white key.
             // D# is between 2nd and 3rd.
             // F# is between 4th and 5th.
             // G# is between 5th and 6th.
             // A# is between 6th and 7th.
             
             let offsetIndex = 0;
             if (note === 'C#') offsetIndex = 0;
             if (note === 'D#') offsetIndex = 1;
             if (note === 'F#') offsetIndex = 3;
             if (note === 'G#') offsetIndex = 4;
             if (note === 'A#') offsetIndex = 5;

             const leftPos = (offsetIndex * 50) + 35; // Rough px calculation based on white key width ~48px + margins

             const isActive = activeNote === note;

             return (
               <div
                 key={note}
                 onMouseDown={(e) => {
                    e.stopPropagation(); // Prevent clicking through to container
                    // Enable pointer events for the actual key
                 }}
                 // Re-enable pointer events for the button
                 className="pointer-events-auto absolute w-8 h-20 bg-slate-800 rounded-b-lg cursor-pointer z-20 border border-slate-700 hover:bg-slate-700 active:scale-95 active:origin-top transition-all"
                 style={{ left: `calc(50% - 150px + ${leftPos}px)` }} // Centering hack based on roughly 7 white keys * 50px
                 onClick={() => onNotePlay(note)}
               >
                  <div className={`absolute inset-0 rounded-b-lg transition-opacity ${isActive ? 'bg-fuchsia-500 opacity-100 shadow-[0_0_15px_rgba(217,70,239,0.8)]' : 'opacity-0'}`} />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-[10px] pointer-events-none">{note}</span>
               </div>
             );
         })}
      </div>
    </div>
  );
};

export default Piano;