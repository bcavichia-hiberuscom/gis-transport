"use client";

import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { FleetFuelOverview } from "@gis/shared";
import { FuelKPIStrip } from "./fuel-kpi-strip";
import { FuelTrendChart } from "./fuel-trend-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, Fuel, MapPin, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface FuelManagementViewProps {
    onDriverClick?: (driverId: string) => void;
}

export function FuelManagementView({ onDriverClick }: FuelManagementViewProps) {
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

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                            Control de Combustible
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Auditoría de Cargas y Desviaciones
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] tracking-widest border-slate-200">
                            Exportar Datos
                        </Button>
                    </div>
                </div>

                <FuelKPIStrip />
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Ranking de Desviación */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                        Desviaciones por Conductor
                                    </h3>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase">
                                    Top 5
                                </Badge>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-slate-900 rounded-full" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Procesando registros...</span>
                                    </div>
                                ) : fuelData?.topDiscrepancies.map((driver, index) => (
                                    <div
                                        key={driver.driverId}
                                        onClick={() => onDriverClick?.(driver.driverId)}
                                        className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black italic text-slate-300">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                                                    {driver.driverName}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                        ID: {driver.driverId}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-rose-500 uppercase">
                                                        {driver.flagCount} Alert@s
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-lg font-black italic tracking-tighter",
                                                    driver.discrepancyPercentage > 8 ? "text-rose-600" : "text-slate-900"
                                                )}>
                                                    {driver.discrepancyLiters.toFixed(0)}L
                                                </div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Desvío {driver.discrepancyPercentage.toFixed(1)}%</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Puntos Críticos y Patrones */}
                        <div className="flex flex-col gap-8">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full overflow-hidden">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        Estaciones Críticas
                                    </h3>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="space-y-3 pr-2">
                                        {fuelData?.criticalStations?.map((station) => (
                                            <div key={station.brand} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-[10px] font-black text-slate-900 uppercase">{station.brand}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-rose-600">+{station.totalDiscrepancyLiters}L</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">{(station.locationCount)} Loc.</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Patrones de Riesgo */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-5">
                                    <ShieldAlert className="h-4 w-4 text-slate-400" />
                                    Patrones Detectados
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {fuelData?.riskFactors?.map((risk) => (
                                        <div key={risk.factor} className="p-3 rounded-lg border border-slate-50 bg-slate-50/50 flex flex-col gap-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{risk.factor}</span>
                                            <div className="text-lg font-black text-slate-900 italic">{risk.occurrences}</div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Incidencias</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tendencia General */}
                    {fuelData?.trendData && fuelData.trendData.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                            <FuelTrendChart
                                data={fuelData.trendData || []}
                                title="Análisis de Integridad de Flota"
                            />
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
