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
        <div className="kpi-card group">
            <div className="flex items-center justify-between">
                <div className="h-9 w-9 flex items-center justify-center bg-[#F7F8FA] border border-[#EAEAEA] text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C] transition-all">
                    <Icon strokeWidth={1.5} className="h-4 w-4" />
                </div>
                {trend && (
                    <span className={cn(trendType === "positive" ? "trend-up" : "trend-down")}>
                        {trend}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.1em]">
                    {label}
                </span>
                <h4 className="text-[32px] font-medium tracking-tight text-[#1C1C1C] leading-none tabular-nums">
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
                const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
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
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-10", className)}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="kpi-card animate-pulse">
                        <div className="h-9 w-9 bg-[#F7F8FA] border border-[#EAEAEA]" />
                        <div className="h-8 w-24 bg-[#F7F8FA] mt-2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!fuelData) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-10", className)}>
                <div className="kpi-card col-span-4">
                    <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-widest text-center py-4">Sin registros de telemetría</p>
                </div>
            </div>
        );
    }

    const complianceRate = fuelData.totals.transactionCount > 0
        ? (fuelData.statusBreakdown.compliant / fuelData.totals.transactionCount) * 100
        : 0;

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-10", className)}>
            <KPIItem label="Consumo Total" value={`${fuelData.totals.declaredLiters.toFixed(0)}L`} icon={Fuel} />
            <KPIItem label="Optimización" value={`${complianceRate.toFixed(1)}%`} icon={TrendingUp} trendType="positive" />
            <KPIItem
                label="Anomalías"
                value={discrepanciesCount ?? fuelData.statusBreakdown.flagged}
                icon={AlertTriangle}
                trendType="negative"
                trend={discrepanciesCount ? `+${discrepanciesCount}` : undefined}
            />
            <KPIItem label="Pérdida Est." value={`€${(fuelData.totals.estimatedLossEuro || 0).toFixed(0)}`} icon={TrendingDown} />
        </div>
    );
}
