"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Fuel } from "lucide-react";

interface FuelDiscrepancyChartProps {
    tankCapacity: number;
    before: number;
    declared: number;
    expected: number;
    after: number;
    discrepancy: number;
    unit?: string;
    status: "compliant" | "review" | "flagged" | "approved" | "rejected";
    className?: string;
}

export function FuelDiscrepancyChart({
    tankCapacity,
    before,
    declared,
    expected,
    after,
    discrepancy,
    unit = "L",
    status,
    className,
}: FuelDiscrepancyChartProps) {
    const displayUnit = unit === "GAL" ? "L" : unit;
    const finalTeorico = before + declared;
    const scaleMax = Math.max(tankCapacity * 1.1, finalTeorico, after);
    const getPercent = (val: number) => (val / scaleMax) * 100;
    const isHighDiscrepancy = finalTeorico > after;

    const discrepancyLiters = Math.abs(finalTeorico - after);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Contextual Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100/50">
                <div className="flex items-center gap-2">
                    <Fuel className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Análisis del Depósito</span>
                </div>
                {isHighDiscrepancy && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        -{discrepancyLiters.toFixed(1)} {displayUnit}
                    </span>
                )}
            </div>

            {/* Visual Bars */}
            <div className="space-y-4">
                {/* Expected State */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Proyección Auditoría</span>
                        <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{finalTeorico.toFixed(0)} {displayUnit}</span>
                    </div>
                    <div className="h-3 w-full bg-[#f4f4f5] rounded-full overflow-hidden relative shadow-inner">
                        {/* Base level */}
                        <div 
                            className="absolute left-0 top-0 h-full bg-[#A1A1AA]" 
                            style={{ width: `${getPercent(before)}%` }} 
                        />
                        {/* Expected boost */}
                        <div 
                            className="absolute top-0 h-full bg-[#1C1C1C]" 
                            style={{ left: `${getPercent(before)}%`, width: `${getPercent(declared)}%` }} 
                        />
                    </div>
                </div>

                {/* Real State (Sensor) */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Lectura Telemetría</span>
                        <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{after.toFixed(0)} {displayUnit}</span>
                    </div>
                    <div className="h-4 w-full bg-[#f4f4f5] rounded-sm overflow-hidden relative border border-[#EAEAEA] shadow-inner">
                        {/* Real fill */}
                        <div 
                            className={cn(
                                "absolute left-0 top-0 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                isHighDiscrepancy ? "bg-[#EF4444]" : "bg-[#1C1C1C]"
                            )} 
                            style={{ width: `${getPercent(after)}%` }} 
                        />
                        {/* Ghost Discrepancy */}
                        {isHighDiscrepancy && (
                            <div 
                                className="absolute top-0 h-full bg-red-500/20 animate-pulse border-l-2 border-red-500" 
                                style={{ left: `${getPercent(after)}%`, width: `${getPercent(discrepancyLiters)}%` }} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Operational Meta */}
            <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", isHighDiscrepancy ? "bg-[#EF4444]" : "bg-[#D4F04A]")} />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado: {status.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-px bg-slate-200" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Capacidad: {tankCapacity}L</span>
                </div>
            </div>
        </div>
    );
}
