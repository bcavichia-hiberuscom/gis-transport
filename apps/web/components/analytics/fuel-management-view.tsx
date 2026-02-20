"use client";

import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { FleetFuelOverview } from "@gis/shared";
import { FuelTrendChart } from "./fuel-trend-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronRight,
  MapPin,
  Fuel,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── KPI Strip ────────────────────────────────────────────────────────────────

interface KPIItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendType?: "positive" | "negative";
  tone?: "blue" | "green" | "red" | "amber";
}

function KPIItem({ label, value, icon: Icon, tone = "blue", trend }: KPIItemProps) {
  const toneMap: Record<string, { iconBg: string; iconText: string; dot: string }> = {
    blue: { iconBg: "bg-blue-50/50", iconText: "text-blue-600", dot: "bg-blue-500" },
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
              tone === "red" || tone === "amber" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
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

function FuelKPIStripInline({
  discrepanciesCount,
  totalDiscrepancyLiters = 0,
  criticalStationsCount = 0,
  estimatedLossARS = 0,
}: {
  discrepanciesCount: number;
  totalDiscrepancyLiters?: number;
  criticalStationsCount?: number;
  estimatedLossARS?: number;
}) {
  const formattedLoss =
    estimatedLossARS >= 1_000_000
      ? `$${(estimatedLossARS / 1_000_000).toFixed(1)}M`
      : estimatedLossARS >= 1_000
        ? `$${(estimatedLossARS / 1_000).toFixed(0)}K`
        : `$${estimatedLossARS.toFixed(0)}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-8 bg-slate-50/10 border-b border-slate-100">
      <KPIItem label="Detección Anomalías" value={discrepanciesCount} icon={AlertTriangle} tone="red" trend="+2" />
      <KPIItem label="Varianza Total" value={`${totalDiscrepancyLiters.toFixed(0)}L`} icon={Fuel} tone="amber" trend="5.2%" />
      <KPIItem label="Hubs Críticos" value={criticalStationsCount} icon={MapPin} tone="blue" trend="0" />
      <KPIItem label="Riesgo Estimado" value={formattedLoss} icon={DollarSign} tone="red" trend="+12%" />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

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

  const totalDiscrepancyLiters =
    fuelData?.topDiscrepancies?.reduce(
      (acc, d) => acc + d.discrepancyLiters,
      0,
    ) ?? 0;

  // ~$1,200 ARS per liter as reference price (update to match actual fuel price)
  const FUEL_PRICE_PER_LITER = 1200;
  const estimatedLossARS = totalDiscrepancyLiters * FUEL_PRICE_PER_LITER;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Body: sections self-contained with p-10 border-r bg-white, no wrapper bg ── */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="shrink-0 bg-white border-b border-slate-100">
            <div className="px-6 py-6 flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  CONTROL DE EFICIENCIA ENERGÉTICA
                </p>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  GESTIÓN DE COMBUSTIBLE
                </h2>
              </div>
            </div>

            <FuelKPIStripInline
              discrepanciesCount={fuelData?.topDiscrepancies?.length ?? 0}
              totalDiscrepancyLiters={totalDiscrepancyLiters}
              criticalStationsCount={fuelData?.criticalStations?.length ?? 0}
              estimatedLossARS={estimatedLossARS}
            />
          </div>
          {/* Row 1: Ranking | Estaciones */}
          <div className="flex flex-col lg:flex-row border-b border-slate-100">
            {/* Ranking */}
            <div className="flex-1 p-8 border-r border-slate-100 bg-white">
              <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    Ranking de Varianzas por Operador
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Anomalías detectadas — Últimos 30 días
                  </p>
                </div>
                <span className="px-2 py-0.5 border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-tighter rounded italic bg-rose-50/30">
                  {fuelData?.topDiscrepancies?.length ?? 0} Alertados
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Processing...
                    </span>
                  </div>
                ) : (
                  fuelData?.topDiscrepancies.map((driver, index) => (
                    <div
                      key={driver.driverId}
                      onClick={() => onDriverClick?.(driver.driverId)}
                      className="py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 rounded-xl px-4 -mx-4 transition-colors cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-slate-200 w-6 text-right tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                            {driver.driverName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              ID: {driver.driverId}
                            </span>
                            <span className="text-[9px] font-bold text-rose-500 uppercase">
                              {driver.flagCount} Alerts
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-sm font-bold",
                              driver.discrepancyPercentage > 8
                                ? "text-rose-600"
                                : "text-slate-900",
                            )}
                          >
                            {driver.discrepancyLiters.toFixed(0)}L
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">
                            Variance {driver.discrepancyPercentage.toFixed(1)}%
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Estaciones Críticas — shrinks to content, no forced full height */}
            <div className="flex-1 p-8 bg-white flex flex-col gap-6 self-start">
              <div className="flex flex-col gap-1 mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Hubs de Estaciones Críticas
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Mayor acumulación de incidencias recurrentes
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {fuelData?.criticalStations?.map((station) => (
                  <div
                    key={station.brand}
                    className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl px-4 -mx-4 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {station.brand}
                    </p>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600">
                        +{station.totalDiscrepancyLiters}L
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        {station.locationCount} Points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Chart — FuelTrendChart is now self-contained, no wrapper needed */}
          {fuelData?.trendData && fuelData.trendData.length > 0 && (
            <FuelTrendChart
              data={fuelData.trendData}
              title="Análisis de Integridad de Flota"
            />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
