"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Layers,
    Fuel,
    Zap,
    Map as MapIcon,
    Maximize,
    ChevronRight,
    Plus,
    Eye,
    EyeOff,
    Package,
    Trash2,
    X,
    Menu,
    CloudDrizzle,
    Thermometer,
    Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { LayerVisibility, CustomPOI } from "@gis/shared";

interface MapLayersOverlayProps {
    layers: LayerVisibility;
    toggleLayer: (layerId: keyof LayerVisibility) => void;
    onAddZone: () => void;
    customZones?: CustomPOI[];
    hiddenZones?: string[];
    onToggleZoneVisibility?: (id: string) => void;
    onDeleteZone?: (id: string) => void;
}

export function MapLayersOverlay({
    layers,
    toggleLayer,
    onAddZone,
    customZones,
    hiddenZones,
    onToggleZoneVisibility,
    onDeleteZone
}: MapLayersOverlayProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    if (isCollapsed) {
        return (
            <div className="absolute top-6 right-6 z-[400] pointer-events-auto group">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="h-12 w-12 bg-white border border-[#EAEAEA] rounded-lg shadow-xl flex items-center justify-center hover:bg-[#1C1C1C] hover:text-[#D4F04A] hover:border-[#1C1C1C] transition-all duration-300"
                    title="Capas y Configuración"
                >
                    <Layers strokeWidth={1.5} className="h-5 w-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-[400] w-72 bg-white border border-[#EAEAEA] shadow-2xl flex flex-col h-auto max-h-[calc(100vh-4rem)] rounded-lg pointer-events-auto overflow-hidden animate-in slide-in-from-right-2 fade-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[#EAEAEA] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#1C1C1C]" />
                        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Capas</h2>
                        <Badge className="text-[10px] font-medium bg-[#1C1C1C] text-[#D4F04A] h-5 px-2 rounded-full tabular-nums border-none shadow-none uppercase tracking-wider">
                            Map
                        </Badge>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-md hover:bg-[#F7F8FA] flex items-center justify-center text-[#6B7280] hover:text-[#1C1C1C] transition-all"
                    >
                        <X strokeWidth={1.5} className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-white">
                <div className="flex flex-col">
                    <div className="p-4 space-y-1.5">
                        <LayerToggleItem
                            icon={<Fuel strokeWidth={1.5} className="h-4 w-4" />}
                            label="Gasolineras"
                            checked={layers.gasStations}
                            onToggle={() => toggleLayer("gasStations")}
                        />
                        <LayerToggleItem
                            icon={<Zap strokeWidth={1.5} className="h-4 w-4" />}
                            label="Carga Eléctrica"
                            checked={layers.evStations}
                            onToggle={() => toggleLayer("evStations")}
                        />
                        <div className="h-[1px] bg-[#EAEAEA] my-2" />
                        <span className="text-[10px] font-medium text-[#6B7280]/60 uppercase tracking-widest pl-1 mb-1 block">Meteorología</span>
                        <LayerToggleItem
                            icon={<CloudDrizzle strokeWidth={1.5} className="h-4 w-4" />}
                            label="Precipitaciones"
                            checked={!!layers.weatherRain}
                            onToggle={() => toggleLayer("weatherRain")}
                        />
                        <LayerToggleItem
                            icon={<Wind strokeWidth={1.5} className="h-4 w-4" />}
                            label="Viento"
                            checked={!!layers.weatherWind}
                            onToggle={() => toggleLayer("weatherWind")}
                        />
                        <LayerToggleItem
                            icon={<Thermometer strokeWidth={1.5} className="h-4 w-4" />}
                            label="Temperatura"
                            checked={!!layers.weatherTemp}
                            onToggle={() => toggleLayer("weatherTemp")}
                        />
                    </div>

                    {customZones && customZones.length > 0 && (
                        <>
                            <div className="h-[1px] bg-[#EAEAEA] mx-6 my-2" />
                            <div className="px-6 py-2 text-[10px] font-medium uppercase text-[#6B7280]/60 tracking-wider">
                                Zonas de Control
                            </div>
                            <div className="px-4 space-y-0.5 pb-4">
                                {customZones.map((zone) => {
                                    const isHidden = hiddenZones?.includes(zone.id);
                                    return (
                                        <div
                                            key={zone.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#F7F8FA] transition-all group"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full shrink-0 transition-all",
                                                    isHidden ? "bg-[#EAEAEA]" : "bg-[#D4F04A] shadow-[0_0_8px_rgba(212,240,74,0.5)]"
                                                )} />
                                                <span className={cn(
                                                    "text-[11px] font-medium truncate uppercase tracking-tight",
                                                    isHidden ? "text-[#6B7280]/40" : "text-[#1C1C1C]"
                                                )}>
                                                    {zone.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onToggleZoneVisibility?.(zone.id)}
                                                    className={cn(
                                                        "h-7 w-7 rounded transition-all",
                                                        isHidden ? "text-[#6B7280]/40" : "text-[#1C1C1C] hover:bg-white"
                                                    )}
                                                >
                                                    {isHidden ? <EyeOff strokeWidth={1.5} className="h-3.5 w-3.5" /> : <Eye strokeWidth={1.5} className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`¿Estás seguro de eliminar la zona "${zone.name}"?`)) {
                                                            onDeleteZone?.(zone.id);
                                                        }
                                                    }}
                                                    className="h-7 w-7 rounded text-red-600 hover:bg-red-50 transition-all"
                                                >
                                                    <Trash2 strokeWidth={1.5} className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="h-[1px] bg-[#EAEAEA] mx-6 my-2" />

                    <div className="p-6">
                        <Button
                            onClick={() => {
                                onAddZone();
                            }}
                            className="w-full h-10 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white text-[11px] font-medium uppercase tracking-wider gap-2 rounded transition-all shadow-none border-none"
                        >
                            <Plus strokeWidth={1.5} className="h-4 w-4" />
                            Nueva Zona
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="p-4 bg-[#F7F8FA] border-t border-[#EAEAEA] text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-widest flex items-center justify-between">
                <span>GIS ENGINE ACTIVE</span>
                <ChevronRight strokeWidth={1.5} className="h-3.5 w-3.5" />
            </div>
        </div>
    );
}

function LayerToggleItem({
    icon,
    label,
    checked,
    onToggle
}: {
    icon: React.ReactNode;
    label: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                onToggle();
            }}
            className={cn(
                "flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300 cursor-pointer group border",
                checked ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#D4F04A]" : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "transition-all",
                    checked ? "text-[#D4F04A]" : "text-[#6B7280]/40"
                )}>
                    {icon}
                </div>
                <span className={cn(
                    "text-[11px] font-medium uppercase tracking-wider transition-colors",
                    checked ? "text-white" : "text-[#1C1C1C]"
                )}>
                    {label}
                </span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-[#D4F04A]"
            />
        </div>
    );
}
