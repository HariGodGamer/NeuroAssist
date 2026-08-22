import React, { useEffect, useRef } from 'react';

export default function InteractiveNeuralCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracker
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Synaptic Network Nodes Configuration
    const nodeCount = Math.min(Math.floor((width * height) / 16000), 75);
    const nodes = [];

    // Colors: Velvet Maroon, Soft Amber, Cyan Bio-luminescence, Warm Ivory
    const colors = [
      { r: 122, g: 31, b: 43 },   // Velvet Maroon (#7A1F2B)
      { r: 184, g: 115, b: 38 },  // Warm Amber (#B87326)
      { r: 74, g: 124, b: 89 },   // Bio Emerald (#4A7C59)
      { r: 91, g: 124, b: 153 },  // Clinical Slate Blue (#5B7C99)
    ];

    for (let i = 0; i < nodeCount; i++) {
      const color = colors[i % colors.length];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1.2,
        color,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    // Action potential sparks traveling along connections
    const pulses = [];
    const maxPulses = 12;

    const createPulse = (n1, n2) => {
      if (pulses.length >= maxPulses) return;
      pulses.push({
        from: n1,
        to: n2,
        progress: 0,
        speed: 0.015 + Math.random() * 0.02,
        color: n1.color,
      });
    };

    let tick = 0;

    const render = () => {
      tick++;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // Subtle background radial glow centered at mouse
      if (mouse.active) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.5
        );
        glowGrad.addColorStop(0, 'rgba(122, 31, 43, 0.04)');
        glowGrad.addColorStop(1, 'rgba(122, 31, 43, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Update and draw connections
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        // Move nodes
        n1.x += n1.vx;
        n1.y += n1.vy;

        // Bounce bounds
        if (n1.x < 0 || n1.x > width) n1.vx *= -1;
        if (n1.y < 0 || n1.y > height) n1.vy *= -1;

        // Mouse repulsion / attraction
        const dx = mouse.x - n1.x;
        const dy = mouse.y - n1.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < mouse.radius && mouse.active) {
          const force = (1 - distToMouse / mouse.radius) * 1.2;
          n1.x -= (dx / distToMouse) * force;
          n1.y -= (dy / distToMouse) * force;
        }

        n1.pulsePhase += n1.pulseSpeed;

        // Connect to neighbors
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          const maxDist = 145;

          if (dist < maxDist) {
            const alpha = Math.pow(1 - dist / maxDist, 1.5) * 0.22;

            // Draw connecting synaptic fiber
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(122, 31, 43, ${alpha})`;
            ctx.lineWidth = (1 - dist / maxDist) * 1.2;
            ctx.stroke();

            // Randomly trigger action potential pulse
            if (tick % 75 === 0 && Math.random() < 0.08) {
              createPulse(n1, n2);
            }
          }
        }
      }

      // Draw Action Potential sparks
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
        const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

        const pulseGlow = ctx.createRadialGradient(px, py, 0, px, py, 5);
        pulseGlow.addColorStop(0, `rgba(${pulse.color.r}, ${pulse.color.g}, ${pulse.color.b}, 0.85)`);
        pulseGlow.addColorStop(1, `rgba(${pulse.color.r}, ${pulse.color.g}, ${pulse.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = pulseGlow;
        ctx.fill();
      }

      // Draw Nodes (Synaptic Soma)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.25;
        const r = node.radius * pulseScale;

        // Outer halo glow
        const nodeGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
        nodeGlow.addColorStop(0, `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.4)`);
        nodeGlow.addColorStop(1, `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = nodeGlow;
        ctx.fill();

        // Core solid node
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.85)`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
