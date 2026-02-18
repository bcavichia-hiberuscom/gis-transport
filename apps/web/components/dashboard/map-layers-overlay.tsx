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
    Menu
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
            <div className="absolute top-4 right-4 z-[400] pointer-events-auto">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="h-10 w-10 bg-card/95 backdrop-blur-md border border-border/40 rounded-xl shadow-2xl flex items-center justify-center hover:bg-primary/10 transition-all group relative ring-1 ring-black/5"
                >
                    <Layers className="h-5 w-5 text-primary" />
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-2 right-2 z-[400] w-64 bg-card/98 backdrop-blur-xl border border-border/50 shadow-2xl flex flex-col h-auto max-h-[calc(100vh-3rem)] rounded-2xl pointer-events-auto overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black uppercase italic tracking-tighter text-foreground/80">Configuración</h2>
                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary h-5 px-1.5 italic">
                            CAPAS
                        </Badge>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-all"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    <div className="p-2 space-y-1">
                        <LayerToggleItem
                            icon={<Fuel className="h-3.5 w-3.5" />}
                            label="Gasolineras"
                            checked={layers.gasStations}
                            onToggle={() => toggleLayer("gasStations")}
                        />
                        <LayerToggleItem
                            icon={<Zap className="h-3.5 w-3.5" />}
                            label="Estaciones EV"
                            checked={layers.evStations}
                            onToggle={() => toggleLayer("evStations")}
                        />
                    </div>

                    {customZones && customZones.length > 0 && (
                        <>
                            <div className="h-px bg-border/5 my-2" />
                            <div className="px-4 py-2 text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] italic">
                                Zonas de Gestión
                            </div>
                            <div className="px-2 space-y-0.5">
                                {customZones.map((zone) => {
                                    const isHidden = hiddenZones?.includes(zone.id);
                                    return (
                                        <div
                                            key={zone.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                    isHidden ? "bg-muted-foreground/30" : "bg-primary"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-semibold truncate tracking-tight",
                                                    isHidden && "text-muted-foreground"
                                                )}>
                                                    {zone.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onToggleZoneVisibility?.(zone.id)}
                                                    className={cn(
                                                        "h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                                                        isHidden ? "text-muted-foreground" : "text-primary hover:bg-primary/10"
                                                    )}
                                                    title={isHidden ? "Mostrar zona" : "Ocultar zona"}
                                                >
                                                    {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                                                    className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                    title="Eliminar zona"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="h-px bg-border/5 my-2" />

                    <div className="p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onAddZone();
                                // Maybe keep open? User usually wants to see the map while adding
                            }}
                            className="w-full h-9 text-[10px] font-black uppercase tracking-tight gap-1.5 border-dashed border-border/40 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all shadow-sm rounded-xl"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nueva Zona
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="p-4 bg-muted/10 border-t border-border/5 text-[9px] font-black italic text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center justify-between">
                <span>Configuración de Mapa</span>
                <ChevronRight className="h-3 w-3" />
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
                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                checked ? "bg-primary/5 text-primary" : "text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "opacity-50 transition-transform group-hover:scale-110",
                    checked && "text-primary opacity-100"
                )}>
                    {icon}
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{label}</span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onToggle}
                className="scale-75 data-[state=checked]:bg-primary"
            />
        </div>
    );
}
