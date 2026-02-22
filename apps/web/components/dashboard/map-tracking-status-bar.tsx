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
    const battery = vehicle.metrics?.fuelLevel ?? 0;
    const isElectric = vehicle.type.id.includes("electric") || vehicle.type.id === "zero";

    // Calculate real progress
    const progressValue = useMemo(() => {
        const assignedJobs = fleetJobs.filter(j => String(j.assignedVehicleId) === String(vehicle.id));
        if (assignedJobs.length === 0) return 0;
        const completed = assignedJobs.filter(j => j.status === "completed").length;
        return Math.round((completed / assignedJobs.length) * 100);
    }, [fleetJobs, vehicle.id]);

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] w-full max-w-2xl px-6 pointer-events-none">
            <div className="w-full bg-white border border-[#EAEAEA] rounded-lg shadow-2xl p-4 flex flex-col gap-4 pointer-events-auto animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between gap-8">
                    {/* Vehicle Identity */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                            "h-12 w-12 rounded-md flex items-center justify-center shrink-0 border transition-all duration-300",
                            isTracking ? "bg-[#1C1C1C] border-[#1C1C1C] text-[#D4F04A]" : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]"
                        )}>
                            <Navigation strokeWidth={1.5} className={cn("h-6 w-6", isDriving && "animate-pulse")} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[13px] font-medium uppercase tracking-tight truncate text-[#1C1C1C]">{vehicle.label}</h3>
                                <Badge className={cn(
                                    "text-[9px] font-medium uppercase border-none h-4 px-1.5 rounded",
                                    isDriving ? "bg-[#D4F04A] text-[#1C1C1C]" : "bg-[#F7F8FA] text-[#6B7280]"
                                )}>
                                    {isDriving ? "LIVE" : "BASE"}
                                </Badge>
                            </div>
                            <span className="text-[10px] font-medium text-[#6B7280]/60 uppercase tracking-widest mt-0.5">
                                {vehicle.licensePlate || "PT-1234"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    <div className="flex-1 max-w-[200px] hidden sm:flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/60 text-[9px]">Completado</span>
                            <span className="text-[11px] font-medium text-[#1C1C1C] tabular-nums">{progressValue}%</span>
                        </div>
                        <div className="h-1 w-full bg-[#F7F8FA] rounded-full overflow-hidden border border-[#EAEAEA]">
                             <div 
                                className="h-full bg-[#1C1C1C] transition-all duration-1000" 
                                style={{ width: `${progressValue}%` }}
                             />
                        </div>
                    </div>

                    {/* Quick Telemetry */}
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-medium tracking-tight leading-none text-[#1C1C1C] tabular-nums">{speed}</span>
                                <span className="text-[10px] font-medium uppercase text-[#6B7280]/40 tracking-wider">km/h</span>
                            </div>
                            <span className="text-[9px] font-medium uppercase tracking-widest text-[#6B7280]/40">Velocidad</span>
                        </div>

                        <div className="h-8 w-[1px] bg-[#EAEAEA]" />

                        <div className="flex flex-col items-end min-w-[60px]">
                            <div className="flex items-baseline gap-1">
                                {isElectric ? <Zap strokeWidth={1.5} className="h-3.5 w-3.5 text-[#1C1C1C]" /> : <Fuel strokeWidth={1.5} className="h-3.5 w-3.5 text-[#6B7280]" />}
                                <span className="text-2xl font-medium tracking-tight leading-none text-[#1C1C1C] tabular-nums">{battery}%</span>
                            </div>
                            <span className="text-[9px] font-medium uppercase tracking-widest text-[#6B7280]/40">{isElectric ? "Carga" : "Energía"}</span>
                        </div>

                        <div className="ml-2 pl-6 border-l border-[#EAEAEA]">
                            <button
                                onClick={onClose}
                                className="h-9 w-9 rounded-md bg-[#F7F8FA] hover:bg-[#1C1C1C] hover:text-[#D4F04A] flex items-center justify-center transition-all text-[#6B7280]"
                            >
                                <X strokeWidth={1.5} className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
