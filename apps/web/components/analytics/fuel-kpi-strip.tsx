"use client";

import { useEffect, useState } from "react";
import { Fuel, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { fuelService } from "@/lib/services/fuel-service";
import type { FleetFuelOverview } from "@gis/shared";
import { cn } from "@/lib/utils";

interface FuelKPIStripProps {
    className?: string;
    discrepanciesCount?: number;
}

interface KPIItemProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendType?: "positive" | "negative";
    tone?: "blue" | "green" | "red" | "amber";
}

function KPIItem({ label, value, icon: Icon, trend, trendType, tone = "blue" }: KPIItemProps) {
    const toneMap: Record<string, { iconBg: string; iconText: string; dot: string }> = {
        blue: { iconBg: "bg-sky-50/50", iconText: "text-sky-600", dot: "bg-sky-500" },
        green: { iconBg: "bg-emerald-50/50", iconText: "text-emerald-600", dot: "bg-emerald-500" },
        red: { iconBg: "bg-rose-50/50", iconText: "text-rose-600", dot: "bg-rose-500" },
        amber: { iconBg: "bg-amber-50/50", iconText: "text-amber-600", dot: "bg-amber-500" },
    };

    const currentTone = toneMap[tone] || toneMap.blue;

    return (
        <div className="flex flex-col gap-6 p-6 bg-white border border-slate-100 rounded-xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-200 transition-all group relative overflow-hidden">
            {/* Subtle indicator dot */}
            <div className={cn("absolute top-6 right-6 h-1 w-1 rounded-full", currentTone.dot)} />

            <div className="flex items-center justify-between">
                <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-lg border border-slate-100 transition-colors group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800",
                    currentTone.iconBg,
                    currentTone.iconText
                )}>
                    <Icon className="h-4 w-4 stroke-[2.5]" />
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        <span className={cn(
                            "text-[9px] font-black tracking-tighter tabular-nums px-1.5 py-0.5 rounded",
                            trendType === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {trend}
                        </span>
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-1">Status Delta</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                    {label}
                </p>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                    {value}
                </h4>
            </div>
        </div>
    );
}

export function FuelKPIStrip({ className, discrepanciesCount }: FuelKPIStripProps) {
    const [fuelData, setFuelData] = useState<FleetFuelOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFuelData = async () => {
            try {
                const endDate = Date.now();
                const startDate = endDate - 30 * 24 * 60 * 60 * 1000; // Last 30 days
                const data = await fuelService.getFleetFuelOverview(startDate, endDate);
                setFuelData(data);
            } catch (error) {
                console.error("Failed to fetch fuel overview:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFuelData();
    }, []);

    if (loading) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-8 bg-slate-50/10 border-b border-slate-100", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[140px] bg-white rounded-xl border border-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!fuelData) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-8 bg-slate-50/10 border-b border-slate-100", className)}>
                <div className="flex flex-col gap-4 p-6 bg-white rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sin registros de telemetría</p>
                </div>
            </div>
        );
    }

    const complianceRate = (fuelData.statusBreakdown.compliant / fuelData.totals.transactionCount) * 100;

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-8 bg-slate-50/10 border-b border-slate-100", className)}>
            <KPIItem label="Consumo Total" value={`${fuelData.totals.declaredLiters.toFixed(0)}L`} icon={Fuel} tone="amber" />
            <KPIItem label="Optimización" value={`${complianceRate.toFixed(1)}%`} icon={TrendingUp} tone="green" />
            <KPIItem label="Incidencias" value={discrepanciesCount ?? fuelData.statusBreakdown.flagged} icon={AlertTriangle} tone="red" />
            <KPIItem label="Pérdida Est." value={`€${(fuelData.totals.estimatedLossEuro || 0).toFixed(0)}`} icon={TrendingDown} tone="amber" />
        </div>
    );
}
