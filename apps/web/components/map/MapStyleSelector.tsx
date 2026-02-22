"use client";

import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapStyle {
    id: string;
    label: string;
    description: string;
    url: string;
    attribution: string;
    maxZoom?: number;
}

export const MAP_STYLES: MapStyle[] = [
    {
        id: "osm",
        label: "Estándar",
        description: "OpenStreetMap clásico",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    },

    {
        id: "satellite",
        label: "Satélite",
        description: "Imágenes aéreas reales",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
        maxZoom: 18,
    },
    {
        id: "dark",
        label: "Oscuro",
        description: "Modo noche para operaciones",
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
    },
];

interface MapStyleSelectorProps {
    currentStyleId: string;
    onStyleChange: (style: MapStyle) => void;
}

export function MapStyleSelector({ currentStyleId, onStyleChange }: MapStyleSelectorProps) {
    const [open, setOpen] = useState(false);
    const current = MAP_STYLES.find(s => s.id === currentStyleId) ?? MAP_STYLES[0];

    return (
        <div className="absolute bottom-6 left-4 z-[1000]">
            {/* Expanded panel */}
            {open && (
                <div
                    className="mb-2 bg-[#1C1C1C]/95 backdrop-blur-md border border-white/10 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden w-52 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 bg-black/20">
                        <Layers className="h-3 w-3 text-[#D4F04A]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Capa Base</span>
                    </div>
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {MAP_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => {
                                    onStyleChange(style);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-2.5 py-2 rounded transition-all text-left group",
                                    style.id === current.id
                                        ? "bg-white/10 text-white"
                                        : "hover:bg-white/5 text-white/70"
                                )}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider leading-tight",
                                        style.id === current.id ? "text-white" : "text-white/80"
                                    )}>
                                        {style.label}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] leading-tight mt-0.5 truncate uppercase tracking-widest",
                                        style.id === current.id ? "text-[#D4F04A]" : "text-white/40"
                                    )}>
                                        {style.description}
                                    </span>
                                </div>
                                {style.id === current.id && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A] shrink-0 shadow-[0_0_8px_#D4F04A]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-200 text-left",
                    open
                        ? "bg-[#1C1C1C] text-white border-white/20"
                        : "bg-white/95 backdrop-blur-md text-[#1C1C1C] border-[#EAEAEA] hover:border-[#1C1C1C]"
                )}
            >
                <Layers className="h-3.5 w-3.5" />
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    open ? "text-[#D4F04A]" : "text-[#1C1C1C]"
                )}>
                    {current.label}
                </span>
                <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    open ? "rotate-180 text-white/50" : "text-[#6B7280]"
                )} />
            </button>
        </div>
    );
}
