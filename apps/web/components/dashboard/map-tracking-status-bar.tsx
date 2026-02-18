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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-full max-w-3xl px-4 pointer-events-none">
            <div className="w-full bg-card border border-border rounded-lg shadow-md p-4 flex flex-col gap-3 pointer-events-auto">
                {/* Main Stats Bar */}
                <div className="flex items-center justify-between gap-6">
                    {/* Vehicle Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "h-10 w-10 rounded-md flex items-center justify-center shrink-0 transition-all",
                            isTracking ? "bg-foreground text-card" : "bg-secondary text-muted-foreground"
                        )}>
                            <Navigation className={cn("h-5 w-5", isDriving && "animate-pulse")} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold truncate text-foreground">{vehicle.label}</h3>
                                <Badge variant="secondary" className={cn(
                                    "text-[10px] font-medium h-5 px-1.5",
                                    isDriving ? "text-emerald-700 bg-emerald-50" : "text-muted-foreground"
                                )}>
                                    {isDriving ? "En Movimiento" : "Estacionado"}
                                </Badge>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                                {vehicle.licensePlate || "WO-123456"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    <div className="flex-1 max-w-sm hidden md:flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] text-muted-foreground">Progreso de Entrega</span>
                            <span className="text-xs font-semibold text-foreground">85%</span>
                        </div>
                        <Progress value={85} className="h-1.5 bg-secondary" />
                    </div>

                    {/* Quick Telemetry */}
                    <div className="flex items-center gap-6 shrink-0">
                        {/* Speed */}
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-semibold tracking-tight leading-none text-foreground">{speed}</span>
                                <span className="text-[10px] text-muted-foreground">km/h</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Velocidad</span>
                        </div>

                        <div className="h-8 w-px bg-border" />

                        {/* Energy */}
                        <div className="flex flex-col items-end min-w-[60px]">
                            <div className="flex items-baseline gap-1.5">
                                {isElectric ? <Zap className="h-3 w-3 text-emerald-600" /> : <Fuel className="h-3 w-3 text-amber-600" />}
                                <span className="text-lg font-semibold tracking-tight leading-none text-foreground">{battery}%</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{isElectric ? "Carga" : "Comb."}</span>
                        </div>
                    </div>
                </div>

                {/* Status Bar Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] text-muted-foreground">Sistemas OK</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">ETA: 14:30</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="h-6 text-[10px] font-medium text-muted-foreground">
                            <Activity className="h-3 w-3 mr-1.5" />
                            Seguimiento Activo
                        </Badge>
                        <button className="h-6 w-6 rounded-md bg-secondary hover:bg-accent flex items-center justify-center transition-colors">
                            <Maximize2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
