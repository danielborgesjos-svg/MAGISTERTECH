import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  analyser: AnalyserNode | null;
  status: string;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ analyser, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser?.frequencyBinCount || 0;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 80;
      
      // Estilo de Cor baseado no Status
      let color = '#00f2ff'; // Standby
      if (status === 'Listening') color = '#00f2ff';
      if (status === 'Thinking') color = '#7000ff';
      if (status === 'Speaking') color = '#00ffa3';
      if (status === 'Offline') color = '#ff2d55';

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      const points = 120;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const freqIndex = Math.floor((i / points) * bufferLength);
        const intensity = (dataArray[freqIndex] || 0) / 255;
        
        // Orb Orgânica e Fluida
        const radius = baseRadius + (intensity * 60) + (Math.sin(Date.now() * 0.002 + i * 0.1) * 5);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        // Pontos Partículas Reativos
        if (intensity > 0.3) {
           ctx.save();
           ctx.fillStyle = color;
           ctx.beginPath();
           ctx.arc(x, y, 2 * intensity, 0, Math.PI * 2);
           ctx.fill();
           ctx.restore();
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Reflexo Interno Profundo
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `${color}10`;
      ctx.fill();
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [analyser, status]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={600} 
      style={{ filter: 'drop-shadow(0 0 20px var(--primary))' }}
    />
  );
};

export default VoiceVisualizer;
