import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
  onComplete?: () => void;
  intensity?: 'standard' | 'high'; // high for significant savings (> 10 SAR)
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ 
  active, 
  onComplete,
  intensity = 'standard' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Brand-aligned color palette (Vibrant Emerald, Mint, Gold, Teal, Gold-orange)
  const colors = [
    '#00C16A', // Brand Emerald
    '#00E07A', // Mint
    '#FFD700', // Gold
    '#00F0FF', // Sky Teal
    '#FFA500', // Gold Orange
    '#FFFFFF'  // White Accent
  ];

  const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

  useEffect(() => {
    if (!active) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle full viewport resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles (Dual cannons shooting from bottom left and bottom right)
    const particleCount = intensity === 'high' ? 140 : 80;
    const newParticles: Particle[] = [];

    // Cannon 1: Bottom Left shooting up and right
    const createCannonParticles = (startX: number, directionMultiplier: number) => {
      const count = Math.floor(particleCount / 2);
      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 4 + 4; // 4 to 8px
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Launch angles & velocities
        const angle = (Math.random() * 35 + 25) * (Math.PI / 180); // 25 to 60 degrees
        const speed = Math.random() * 14 + (intensity === 'high' ? 16 : 10);
        
        newParticles.push({
          x: startX,
          y: canvas.height + 20,
          radius,
          color,
          shape,
          vx: Math.cos(angle) * speed * directionMultiplier,
          vy: -Math.sin(angle) * speed - (Math.random() * 5),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          opacity: 1
        });
      }
    };

    // Spawn Left (direction 1 = shoots right) & Right (direction -1 = shoots left)
    createCannonParticles(0, 1);
    createCannonParticles(canvas.width, -1);

    particlesRef.current = newParticles;

    // Animation Loop
    let framesWithoutParticles = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      if (particles.length === 0) {
        framesWithoutParticles++;
        if (framesWithoutParticles > 10) {
          if (onComplete) onComplete();
          return;
        }
      } else {
        framesWithoutParticles = 0;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.vx *= 0.985; // Air drag
        p.vy *= 0.985;
        p.rotation += p.rotationSpeed;
        
        // Fade out as they fall below 2/3 screen or after some time
        if (p.vy > 2) {
          p.opacity -= 0.012;
        }

        // Boundary checks / death conditions
        if (p.opacity <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();

        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          const size = p.radius * 2;
          ctx.fillRect(-size / 2, -size / 2, size, size);
        } else if (p.shape === 'triangle') {
          const size = p.radius * 2;
          ctx.moveTo(0, -size / 2);
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, intensity, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
    />
  );
};
