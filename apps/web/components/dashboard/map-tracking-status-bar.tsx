"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Navigation,
    Zap,
    Fuel,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { FleetVehicle, FleetJob } from "@gis/shared";

interface MapTrackingStatusBarProps {
    vehicle: FleetVehicle | null;
    isTracking: boolean;
    fleetJobs?: FleetJob[];
    onClose?: () => void;
}

export function MapTrackingStatusBar({ vehicle, isTracking, fleetJobs = [], onClose }: MapTrackingStatusBarProps) {
    if (!vehicle) return null;

    const isDriving = vehicle.metrics?.movementState === "on_route" || (vehicle.metrics?.speed ?? 0) > 0;
    const speed = vehicle.metrics?.speed || 0;
    const battery = vehicle.metrics?.batteryLevel ?? vehicle.metrics?.fuelLevel ?? 0;
    const isElectric = vehicle.type.id.includes("electric") || vehicle.type.id === "zero";

    // Calculate real progress
    const progressValue = useMemo(() => {
        const assignedJobs = fleetJobs.filter(j => String(j.assignedVehicleId) === String(vehicle.id));
        if (assignedJobs.length === 0) return 0;
        const completed = assignedJobs.filter(j => j.status === "completed").length;
        return Math.round((completed / assignedJobs.length) * 100);
    }, [fleetJobs, vehicle.id]);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-2xl px-4 pointer-events-none">
            <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-3 flex flex-col gap-3 pointer-events-auto ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between gap-4">
                    {/* Vehicle Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                            isTracking ? "bg-slate-900 border-slate-900 shadow-md" : "bg-slate-100 border-slate-200 text-slate-400"
                        )}>
                            <Navigation className={cn("h-5 w-5 text-white", isDriving && "animate-pulse")} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-[12px] font-black uppercase tracking-tight truncate">{vehicle.label}</h3>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-black uppercase border-none h-4 px-1.5",
                                    isDriving ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"
                                )}>
                                    {isDriving ? "En Ruta" : "Parado"}
                                </Badge>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {vehicle.licensePlate || "SIN MATRÍCULA"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    <div className="flex-1 max-w-[160px] hidden sm:flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Progreso</span>
                            <span className="text-[10px] font-black text-slate-900">{progressValue}%</span>
                        </div>
                        <Progress value={progressValue} className="h-1 bg-slate-100" />
                    </div>

                    {/* Quick Telemetry */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-black tracking-tight leading-none">{speed}</span>
                                <span className="text-[7px] font-black uppercase text-slate-400">km/h</span>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">Velocidad</span>
                        </div>

                        <div className="h-6 w-px bg-slate-100" />

                        <div className="flex flex-col items-end min-w-[50px]">
                            <div className="flex items-baseline gap-1">
                                {isElectric ? <Zap className="h-2.5 w-2.5 text-emerald-500" /> : <Fuel className="h-2.5 w-2.5 text-slate-400" />}
                                <span className="text-base font-black tracking-tight leading-none">{battery}%</span>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">{isElectric ? "Carga" : "Comb."}</span>
                        </div>

                        <div className="ml-2 pl-2 border-l border-slate-100">
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
