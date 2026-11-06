/**
 * Lightweight canvas-based fireworks/confetti burst.
 * Triggers a 1-second burst of golden, saffron, and maroon sparks
 * when the Hero CTA is clicked. Cleanly removes itself with zero memory leaks.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
}

export const triggerFireworksBurst = (event?: React.MouseEvent) => {
  if (typeof window === 'undefined') return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const startX = event ? event.clientX : window.innerWidth / 2;
  const startY = event ? event.clientY : window.innerHeight / 2;

  const colors = ['#D4AF37', '#FF8A00', '#FFC107', '#FFE082', '#7A0C1E', '#FFFFFF'];
  const particles: Particle[] = [];
  const particleCount = 36;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
    const speed = 3.5 + Math.random() * 5.5;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 2 + Math.random() * 2.5,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.02,
    });
  }

  let animId: number;
  const render = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;
    particles.forEach((p) => {
      if (p.alpha <= 0) return;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.vx *= 0.98; // Drag
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (activeCount > 0) {
      animId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animId);
      canvas.remove();
    }
  };

  animId = requestAnimationFrame(render);

  // Safety fallback cleanup after 2.5s
  setTimeout(() => {
    cancelAnimationFrame(animId);
    if (document.body.contains(canvas)) {
      canvas.remove();
    }
  }, 2500);
};

