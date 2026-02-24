"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { createPortal } from "react-dom";
import L from "leaflet";

interface WindFlowLayerProps {
  opacity?: number;
  visible?: boolean;
  data?: {
    lat: number;
    lon: number;
    speed: number;
    direction: number;
  }[];
}

export function WindFlowLayer({ opacity = 1.0, visible = false, data = [] }: WindFlowLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Increased count for better visibility
    const particleCount = 700;
    const particles: { x: number, y: number, px: number, py: number, l: number, m: number, v: number }[] = [];

    // GRID CACHE for O(1) particle updates
    const gridSize = 25;
    const grid: { vx: number, vy: number, speed: number }[] = [];

    const updateGrid = () => {
      grid.length = 0;
      if (!data || data.length === 0) return;

      const w = canvas.width;
      const h = canvas.height;

      for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
          const x = (gx / (gridSize - 1)) * w;
          const y = (gy / (gridSize - 1)) * h;
          const latlng = map.containerPointToLatLng([x, y]);

          let tw = 0, fvx = 0, fvy = 0, fsp = 0;
          for (const d of data) {
            const weight = 1 / (Math.pow(d.lat - latlng.lat, 2) + Math.pow(d.lon - latlng.lng, 2) + 0.005);
            const rad = d.direction * (Math.PI / 180);
            fvx += -Math.sin(rad) * weight;
            fvy += Math.cos(rad) * weight;
            fsp += (d.speed || 0) * weight;
            tw += weight;
          }
          const mag = Math.sqrt(fvx * fvx + fvy * fvy) || 1;
          grid.push({ vx: fvx / mag, vy: fvy / mag, speed: fsp / (tw || 1) });
        }
      }
    };

    function getWindAt(x: number, y: number) {
      if (grid.length === 0 || !canvas) return { vx: 0, vy: 1, speed: 5 };
      const cw = canvas.width;
      const ch = canvas.height;
      const gx = Math.min(gridSize - 1, Math.max(0, Math.floor((x / cw) * gridSize)));
      const gy = Math.min(gridSize - 1, Math.max(0, Math.floor((y / ch) * gridSize)));
      return grid[gy * gridSize + gx];
    }



    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x, y, px: x, py: y,
          l: 0,
          m: 120 + Math.random() * 180,
          v: 0.3 + Math.random() * 0.4
        });
      }
    };

    function animate() {
      if (!ctx || !canvas) return;

      // Adjusted clear for slightly longer trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      // VIBRANT NEON
      ctx.strokeStyle = `rgba(180, 255, 50, ${opacity * 0.8})`;


      particles.forEach(p => {
        const wind = getWindAt(p.x, p.y);
        const speedFactor = (wind.speed || 8) * p.v * 0.22;

        const vx = wind.vx * speedFactor;
        const vy = wind.vy * speedFactor;

        // Slightly thicker lines for visibility
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
        p.l++;

        if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100 || p.l > p.m) {
          const nx = Math.random() * canvas.width;
          const ny = Math.random() * canvas.height;
          p.x = nx; p.y = ny; p.px = nx; p.py = ny; p.l = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      updateGrid();
      initParticles();
    };

    map.on("move zoom viewreset", resize);
    resize();
    animate();

    return () => {
      map.off("move zoom viewreset", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [map, visible, opacity, data]);

  if (!visible) return null;

  return createPortal(
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 450, pointerEvents: 'none', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: 'block' }} />
    </div>,
    map.getContainer()
  );
}
