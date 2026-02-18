"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    Navigation,
    Zap,
    Fuel,
    ShieldCheck,
    Clock,
    Maximize2,
    Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { FleetVehicle } from "@gis/shared";

interface MapTrackingStatusBarProps {
    vehicle: FleetVehicle | null;
    isTracking: boolean;
}

export function MapTrackingStatusBar({ vehicle, isTracking }: MapTrackingStatusBarProps) {
    if (!vehicle) return null;

    const isDriving = vehicle.metrics?.movementState === "on_route" || (vehicle.metrics?.speed ?? 0) > 0;
    const speed = vehicle.metrics?.speed || 0;
    const battery = vehicle.metrics?.batteryLevel ?? vehicle.metrics?.fuelLevel ?? 0;
    const isElectric = vehicle.type.id.includes("electric") || vehicle.type.id === "zero";

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-4xl px-4 pointer-events-none">
            <div className="w-full bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-4 flex flex-col gap-4 pointer-events-auto ring-1 ring-black/5">
                {/* Main Stats Bar */}
                <div className="flex items-center justify-between gap-6">
                    {/* Vehicle Identity */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                            isTracking ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/50 border-border/10 text-muted-foreground/40"
                        )}>
                            <Navigation className={cn("h-6 w-6 transition-transform", isDriving && "animate-pulse")} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black uppercase tracking-tight truncate">{vehicle.label}</h3>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-black uppercase border-none h-4 px-1.5",
                                    isDriving ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                                )}>
                                    {isDriving ? "En Movimiento" : "Estacionado"}
                                </Badge>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap">
                                VIN: {vehicle.id.toString().padEnd(12, '0').slice(0, 12)} | {vehicle.licensePlate || "WO-123456"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    <div className="flex-1 max-w-md hidden md:flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Progreso de Entrega</span>
                            <span className="text-[11px] font-black text-primary">85%</span>
                        </div>
                        <Progress value={85} className="h-1.5 bg-muted/50" />
                    </div>

                    {/* Quick Telemetry */}
                    <div className="flex items-center gap-6 shrink-0">
                        {/* Speed */}
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black tracking-tight leading-none">{speed}</span>
                                <span className="text-[8px] font-black uppercase text-muted-foreground/40">km/h</span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1">Velocidad</span>
                        </div>

                        <div className="h-8 w-px bg-border/20 mx-1" />

                        {/* Energy */}
                        <div className="flex flex-col items-end min-w-[70px]">
                            <div className="flex items-baseline gap-1.5">
                                {isElectric ? <Zap className="h-3 w-3 text-emerald-500" /> : <Fuel className="h-3 w-3 text-orange-500" />}
                                <span className="text-xl font-black italic tracking-tighter leading-none">{battery}%</span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1">Nivel {isElectric ? "Carga" : "Comb."}</span>
                        </div>
                    </div>
                </div>

                {/* Status Bar Footer */}
                <div className="pt-3 border-t border-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-wider">Sistemas OK</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                            <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-wider">ETA: 14:30 (A tiempo)</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-7 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 border border-border/10">
                            <Activity className="h-3 w-3 mr-1.5 opacity-50" />
                            Seguimiento Live Activo
                        </Badge>
                        <button className="h-7 w-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
