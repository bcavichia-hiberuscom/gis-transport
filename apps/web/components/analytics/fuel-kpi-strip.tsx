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
}

function KPIItem({ label, value, icon: Icon, trend, trendType }: KPIItemProps) {
    return (
        <div className="flex flex-col gap-5 border-r border-slate-100 p-8 last:border-r-0 hover:bg-slate-50/30 transition-colors">
            <div className="flex items-center justify-between">
                <div className="h-9 w-9 flex items-center justify-center border border-slate-200 bg-white text-slate-400 rounded-xl">
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
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">{label}</p>
                <h4 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                    {value}
                </h4>
            </div>
            <div className="h-[1px] w-full bg-slate-100 mt-1" />
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
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border-b border-slate-100", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-5 border-r border-slate-100 p-8 last:border-r-0 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                        <div className="h-8 bg-slate-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (!fuelData) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border-b border-slate-100", className)}>
                <div className="flex flex-col gap-5 border-r border-slate-100 p-8 last:border-r-0">
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
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border-b border-slate-100", className)}>
            <KPIItem
                label="Combustible"
                value={`${fuelData.totals.declaredLiters.toFixed(0)}L`}
                icon={Fuel}
            />
            <KPIItem
                label="Conformidad"
                value={`${complianceRate.toFixed(1)}%`}
                icon={TrendingUp}
            />
            <KPIItem
                label="Discrepancias"
                value={discrepanciesCount ?? fuelData.statusBreakdown.flagged}
                icon={AlertTriangle}
            />
            <KPIItem
                label="Pérdida Est."
                value={`€${(fuelData.totals.estimatedLossEuro || 0).toFixed(0)}`}
                icon={TrendingDown}
            />
        </div>
    );
}
