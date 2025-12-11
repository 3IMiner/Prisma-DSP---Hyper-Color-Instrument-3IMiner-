import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser?: AnalyserNode;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0f172a'; // Clear with BG color
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        // Gradient color based on height/intensity
        // Cyan to Purple
        const r = (barHeight / 255) * 200;
        const g = 100;
        const b = 255;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        // Create a reflection/glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
        
        // Draw main bar
        const normalizedHeight = (barHeight / 255) * height;
        ctx.fillRect(x, height - normalizedHeight, barWidth, normalizedHeight);

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      // Draw flat line or initial state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-48 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2 text-xs text-cyan-500 font-mono opacity-50">
        SPECTRUM ANALYZER
      </div>
    </div>
  );
};

export default Visualizer;