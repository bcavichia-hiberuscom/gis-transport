"use client";

import { useEffect, useState } from "react";
import { Fuel, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { fuelService } from "@/lib/services/fuel-service";
import type { FleetFuelOverview } from "@gis/shared";
import { cn } from "@/lib/utils";

interface FuelKPIStripProps {
    className?: string;
}

export function FuelKPIStrip({ className }: FuelKPIStripProps) {
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
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
                    >
                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                        <div className="h-8 bg-slate-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (!fuelData) {
        return (
            <div className={cn("bg-white border border-slate-200 rounded-xl p-6", className)}>
                <p className="text-sm text-slate-500 text-center">
                    No hay datos de combustible disponibles
                </p>
            </div>
        );
    }

    const discrepancyStatus =
        fuelData.totals.discrepancyPercentage > 10
            ? "critical"
            : fuelData.totals.discrepancyPercentage > 5
                ? "warning"
                : "good";

    const complianceRate =
        (fuelData.statusBreakdown.compliant / fuelData.totals.transactionCount) * 100;

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
            {/* Total Discrepancy */}
            <div
                className={cn(
                    "bg-white border rounded-xl p-6 transition-all hover:shadow-md",
                    discrepancyStatus === "critical"
                        ? "border-red-200 bg-red-50/30"
                        : discrepancyStatus === "warning"
                            ? "border-yellow-200 bg-yellow-50/30"
                            : "border-slate-200"
                )}
            >
                <div className="flex items-center justify-between mb-3">
                    <div
                        className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            discrepancyStatus === "critical"
                                ? "bg-red-100"
                                : discrepancyStatus === "warning"
                                    ? "bg-yellow-100"
                                    : "bg-slate-100"
                        )}
                    >
                        <AlertTriangle
                            className={cn(
                                "h-5 w-5",
                                discrepancyStatus === "critical"
                                    ? "text-red-600"
                                    : discrepancyStatus === "warning"
                                        ? "text-yellow-600"
                                        : "text-slate-600"
                            )}
                        />
                    </div>
                    {fuelData.totals.discrepancyLiters > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                </div>
                <div
                    className={cn(
                        "text-3xl font-black italic tracking-tight mb-1",
                        discrepancyStatus === "critical"
                            ? "text-red-900"
                            : discrepancyStatus === "warning"
                                ? "text-yellow-900"
                                : "text-slate-900"
                    )}
                >
                    {fuelData.totals.discrepancyLiters > 0 ? "+" : ""}
                    {fuelData.totals.discrepancyLiters.toFixed(0)}L
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                    Discrepancia Total
                </div>
                <div className="mt-2 text-xs text-slate-600">
                    {fuelData.totals.discrepancyPercentage.toFixed(1)}% del esperado
                </div>
            </div>

            {/* Compliance Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Fuel className="h-5 w-5 text-emerald-600" />
                    </div>
                </div>
                <div className="text-3xl font-black italic tracking-tight text-slate-900 mb-1">
                    {complianceRate.toFixed(1)}%
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                    Tasa de Conformidad
                </div>
                <div className="mt-2 text-xs text-slate-600">
                    {fuelData.statusBreakdown.compliant} de {fuelData.totals.transactionCount} cargas
                </div>
            </div>

            {/* Flagged Transactions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                </div>
                <div className="text-3xl font-black italic tracking-tight text-slate-900 mb-1">
                    {fuelData.statusBreakdown.flagged}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                    Cargas Flagueadas
                </div>
                <div className="mt-2 text-xs text-slate-600">
                    Requieren revisión inmediata
                </div>
            </div>

            {/* Estimated Loss */}
            <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-3xl font-black italic tracking-tight text-rose-900 mb-1">
                    €{(fuelData.totals.estimatedLossEuro || 0).toFixed(0)}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                    Pérdida Económica Est.
                </div>
                <div className="mt-2 text-xs text-rose-600 font-bold">
                    Impacto directo en margen
                </div>
            </div>

            {/* Total Cost */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Fuel className="h-5 w-5 text-slate-600" />
                    </div>
                </div>
                <div className="text-3xl font-black italic tracking-tight text-slate-900 mb-1">
                    €{(fuelData.totals.totalCost / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                    Gasto Total Facturado
                </div>
                <div className="mt-2 text-xs text-slate-600">
                    {fuelData.totals.declaredLiters.toFixed(0)}L cargados
                </div>
            </div>
        </div>
    );
}
