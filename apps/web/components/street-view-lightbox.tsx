"use client";

/**
 * Full-screen lightbox for KartaView street-level imagery.
 *
 * Capabilities:
 *  • Zoom — mouse-wheel or ±buttons (0.5×–8×)
 *  • Pan  — click-drag when zoomed past 1×
 *  • Double-click to toggle 3× zoom / reset
 *  • Full-resolution image (falls back to processed URL on error)
 *  • "Open in KartaView" deep-link (ExternalLink button)
 *  • Keyboard: Escape=close, ←→=navigate
 *  • Photo navigation when multiple photos exist
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KartaViewPhoto } from "@/lib/types/kartaview";

interface StreetViewLightboxProps {
  photos: KartaViewPhoto[];
  initialIndex: number;
  onClose: () => void;
}

export function StreetViewLightbox({
  photos,
  initialIndex,
  onClose,
}: StreetViewLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const photo = photos[idx];
  const displayUrl = useFallback
    ? photo.imageUrl
    : photo.fullResUrl || photo.imageUrl;

  // ── Helpers ──

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgLoaded(false);
    setUseFallback(false);
  }, []);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      setIdx((prev) => {
        const next = prev + dir;
        return next < 0
          ? photos.length - 1
          : next >= photos.length
            ? 0
            : next;
      });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgLoaded(false);
      setUseFallback(false);
    },
    [photos.length],
  );

  // ── Keyboard: Escape / Arrow keys ──

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, navigate]);

  // ── Mouse-wheel zoom (non-passive so we can preventDefault) ──

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) =>
        Math.min(8, Math.max(0.5, prev - e.deltaY * 0.002)),
      );
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Mouse drag-to-pan ──

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  // ── Double-click: toggle 3× / reset ──

  const handleDoubleClick = () => {
    if (zoom > 1) {
      resetView();
      // Keep loaded — the image is already decoded.
      setImgLoaded(true);
    } else {
      setZoom(3);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Top bar: meta + actions ── */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-white/80 text-sm font-mono">
            {photo.shotDate
              ? new Date(photo.shotDate).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          <span className="text-white/50 text-xs font-mono">
            {photo.heading.toFixed(0)}° · {photo.distanceM.toFixed(0)}m
          </span>
          {photos.length > 1 && (
            <span className="text-white/40 text-xs font-mono">
              {idx + 1}/{photos.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Zoom controls ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white"
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.5))}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] text-white/50 font-mono w-10 text-center tabular-nums">
          {(zoom * 100).toFixed(0)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white"
          onClick={() => setZoom((prev) => Math.min(8, prev + 0.5))}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        {zoom !== 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/60 hover:text-white"
            onClick={() => {
              resetView();
              setImgLoaded(true);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* ── Navigation arrows ── */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 text-white/60 hover:text-white hover:bg-black/60"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 text-white/60 hover:text-white hover:bg-black/60"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* ── Image canvas ── */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full flex items-center justify-center overflow-hidden select-none",
          zoom > 1 ? "cursor-grab" : "cursor-zoom-in",
          dragging && "cursor-grabbing",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        <img
          key={`lb-${idx}-${displayUrl}`}
          src={displayUrl}
          alt="Vista de calle — KartaView"
          className={cn(
            "max-w-[90vw] max-h-[85vh] object-contain transition-opacity duration-200",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center",
          }}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (!useFallback) {
              setUseFallback(true);
            } else {
              // Both URLs failed — show broken state rather than spinner
              setImgLoaded(true);
            }
          }}
        />
      </div>
    </div>
  );
}
