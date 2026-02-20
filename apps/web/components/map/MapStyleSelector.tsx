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
        maxZoom: 19,
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
        maxZoom: 20,
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
                    className="mb-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden w-52 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estilo de Mapa</span>
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
                                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left group",
                                    style.id === current.id
                                        ? "bg-slate-900 text-white"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <span className="text-base leading-none">{style.emoji}</span>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-[11px] font-bold leading-tight",
                                        style.id === current.id ? "text-white" : "text-slate-900"
                                    )}>
                                        {style.label}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] leading-tight mt-0.5 truncate",
                                        style.id === current.id ? "text-slate-300" : "text-slate-400"
                                    )}>
                                        {style.description}
                                    </span>
                                </div>
                                {style.id === current.id && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
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
                    "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border transition-all duration-200 text-left",
                    open
                        ? "bg-slate-900 text-white border-slate-700 shadow-slate-900/30"
                        : "bg-white/95 backdrop-blur-xl text-slate-700 border-slate-200 hover:border-slate-400 shadow-slate-200/80"
                )}
            >
                <span className="text-sm leading-none">{current.emoji}</span>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    open ? "text-white" : "text-slate-700"
                )}>
                    {current.label}
                </span>
                <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    open ? "rotate-180 text-slate-300" : "text-slate-400"
                )} />
            </button>
        </div>
    );
}
