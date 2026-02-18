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
    const toneMap: Record<string, { iconBg: string; iconText: string; divider: string; label: string }> = {
        blue: { iconBg: "bg-sky-50", iconText: "text-sky-600", divider: "bg-sky-100", label: "text-sky-500" },
        green: { iconBg: "bg-emerald-50", iconText: "text-emerald-600", divider: "bg-emerald-100", label: "text-emerald-500" },
        red: { iconBg: "bg-rose-50", iconText: "text-rose-600", divider: "bg-rose-100", label: "text-rose-500" },
        amber: { iconBg: "bg-amber-50", iconText: "text-amber-600", divider: "bg-amber-100", label: "text-amber-500" },
    };

    const toneCls = toneMap[tone] || toneMap.blue;

    return (
        <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
            <div className="flex items-center justify-between">
                <div className={cn(
                    "h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors",
                    toneCls.iconBg,
                    toneCls.iconText
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                {trend && (
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter",
                        trendType === "positive" ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em] mb-1", toneCls.label)}>{label}</p>
                <h4 className="text-xl md:text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
                    {value}
                </h4>
            </div>
            <div className={cn("h-[1px] w-full mt-1", toneCls.divider)} />
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
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-b border-slate-100", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!fuelData) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-b border-slate-100", className)}>
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No hay datos</p>
                </div>
            </div>
        );
    }

    const complianceRate = (fuelData.statusBreakdown.compliant / fuelData.totals.transactionCount) * 100;
    const discrepancyStatus =
        fuelData.totals.discrepancyPercentage > 10
            ? "critical"
            : fuelData.totals.discrepancyPercentage > 5
                ? "warning"
                : "good";

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-b border-slate-100", className)}>
            <KPIItem label="Combustible" value={`${fuelData.totals.declaredLiters.toFixed(0)}L`} icon={Fuel} tone="amber" />
            <KPIItem label="Conformidad" value={`${complianceRate.toFixed(1)}%`} icon={TrendingUp} tone="green" />
            <KPIItem label="Discrepancias" value={discrepanciesCount ?? fuelData.statusBreakdown.flagged} icon={AlertTriangle} tone="red" />
            <KPIItem label="Pérdida Est." value={`€${(fuelData.totals.estimatedLossEuro || 0).toFixed(0)}`} icon={TrendingDown} tone="amber" />
        </div>
    );
}
