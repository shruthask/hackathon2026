import React, { useEffect, useRef } from 'react';

const CHARS = ['S', '8', '#', '@', '%', '0', 'X', '+', 'x', '*', '.', '~', '$'];

export default function FluidMatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    let mouse = { x: width * 0.5, y: height * 0.3, targetX: width * 0.5, targetY: height * 0.3, active: false };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const fontSize = 13;
    const charWidth = 9;
    const charHeight = 15;
    let cols = Math.floor(width / charWidth) + 1;
    let rows = Math.floor(height / charHeight) + 1;

    let time = 0;

    const render = () => {
      time += 0.025;
      cols = Math.floor(width / charWidth) + 1;
      rows = Math.floor(height / charHeight) + 1;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deep Navy background fill
      ctx.fillStyle = '#070D1E';
      ctx.fillRect(0, 0, width, height);

      // Top-center radiant cyan bloom glow (from reference image)
      const topGlow = ctx.createRadialGradient(
        width * 0.5, 0, 10,
        width * 0.5, height * 0.2, Math.max(width * 0.6, 400)
      );
      topGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      topGlow.addColorStop(0.4, 'rgba(14, 116, 144, 0.25)');
      topGlow.addColorStop(1, 'rgba(7, 13, 30, 0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      // Interactive mouse subtle glow
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 220
        );
        mouseGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        mouseGlow.addColorStop(0.6, 'rgba(3, 105, 161, 0.1)');
        mouseGlow.addColorStop(1, 'rgba(7, 13, 30, 0)');
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';

      // Render flowing fluid matrix characters
      for (let r = 0; r < rows; r++) {
        const y = r * charHeight;
        // Fade out towards bottom
        const verticalFade = Math.max(0, 1 - (y / (height * 0.85)));
        if (verticalFade <= 0.02) continue;

        for (let c = 0; c < cols; c++) {
          const x = c * charWidth;

          // Sinusoidal wave fluid displacement
          const wave1 = Math.sin(c * 0.08 + time * 0.9 + r * 0.04);
          const wave2 = Math.cos(r * 0.09 - time * 0.7 + c * 0.05);
          const combinedWave = (wave1 + wave2) * 0.5;

          // Mouse proximity wave
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseEffect = Math.max(0, 1 - dist / 240);

          // Character selection based on density and wave
          const density = Math.abs(combinedWave) + mouseEffect * 0.6;
          const charIndex = Math.floor((density * 7.5 + (r * 3 + c * 5)) % CHARS.length);
          const char = CHARS[charIndex];

          // Compute color & brightness: Cyan/electric blue gradient with radiant highlights
          let alpha = (0.2 + (density * 0.55) + (mouseEffect * 0.4)) * verticalFade;
          alpha = Math.min(1, Math.max(0.05, alpha));

          // Color shifts: top radiant is bright cyan-white, middle is electric blue, edges fade
          if (density > 0.85 || (mouseEffect > 0.4 && density > 0.6)) {
            // Hot white/bright cyan glint
            ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
          } else if (density > 0.5) {
            // Electric cyan
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
          } else {
            // Deep oceanic cyan-blue
            ctx.fillStyle = `rgba(14, 165, 233, ${alpha * 0.65})`;
          }

          ctx.fillText(char, x, y);
        }
      }

      // Bottom smooth fade into content
      const bottomFade = ctx.createLinearGradient(0, height - 120, 0, height);
      bottomFade.addColorStop(0, 'rgba(7, 13, 30, 0)');
      bottomFade.addColorStop(1, '#070D1E');
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, height - 120, width, 120);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      {/* Background static texture overlay from reference image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-top opacity-35 mix-blend-screen"
        style={{ backgroundImage: 'url(/fluid-matrix-bg.png)' }}
      />
      {/* Interactive live dynamic fluid matrix canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block"
        aria-hidden="true"
      />
    </div>
  );
}
