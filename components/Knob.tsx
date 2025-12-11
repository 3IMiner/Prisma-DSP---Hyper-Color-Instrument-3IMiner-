import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label: string;
  color?: string;
  unit?: string;
}

const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, label, color = "cyan", unit = "" }) => {
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const startY = useRef(0);
  const startValue = useRef(0);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startY.current = e.clientY;
    startValue.current = localValue;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const deltaY = startY.current - e.clientY;
      const range = max - min;
      // Sensitivity: 200px moves full range
      const deltaValue = (deltaY / 200) * range; 
      let newValue = startValue.current + deltaValue;
      newValue = Math.min(max, Math.max(min, newValue));
      
      setLocalValue(newValue);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, min, max, onChange]);

  // Visuals
  const percentage = (localValue - min) / (max - min);
  const angle = -135 + (percentage * 270); // -135 to +135 degrees
  
  const tickColor = dragging ? `text-${color}-400` : `text-slate-500`;
  const ringColor = dragging ? `stroke-${color}-400` : `stroke-${color}-600`;

  return (
    <div className="flex flex-col items-center select-none group">
      <div 
        className="relative w-16 h-16 cursor-ns-resize"
        onMouseDown={handleMouseDown}
      >
        {/* Background Ring */}
        <svg className="w-full h-full transform rotate-90" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="40" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="8"
          />
          {/* Active Ring */}
          <circle 
            cx="50" cy="50" r="40" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 * (1 - percentage)}
            strokeLinecap="round"
            className={`transition-colors duration-100 ${ringColor} ${dragging ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`}
            style={{ color: color === 'fuchsia' ? '#e879f9' : '#22d3ee' }} // Fallback for dynamic tailwind classes not always parsing
          />
        </svg>
        
        {/* Indicator Dot (Optional, rotated div) */}
        <div 
          className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="w-1 h-3 bg-white rounded-full absolute top-2 shadow-md" />
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <div className={`text-xs font-bold uppercase tracking-wider ${tickColor} font-display`}>
          {label}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {localValue.toFixed(unit ? 1 : 2)}{unit}
        </div>
      </div>
    </div>
  );
};

export default Knob;