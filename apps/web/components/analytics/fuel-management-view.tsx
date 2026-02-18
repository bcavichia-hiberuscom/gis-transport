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
}

function KPIItem({ label, value, icon: Icon }: KPIItemProps) {
  return (
    <div className="flex flex-col gap-5 border-r border-slate-100 p-8 last:border-r-0 hover:bg-slate-50/30 transition-colors">
      <div className="flex items-center">
        <div className="h-9 w-9 flex items-center justify-center border border-slate-200 bg-white text-slate-400 rounded-xl">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">
          {label}
        </p>
        <h4 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">
          {value}
        </h4>
      </div>
      <div className="h-[1px] w-full bg-slate-100 mt-1" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-slate-100">
      <KPIItem
        label="Conductores"
        value={discrepanciesCount}
        icon={AlertTriangle}
      />
      <KPIItem
        label="Desvío Total"
        value={`${totalDiscrepancyLiters.toFixed(0)}L`}
        icon={Fuel}
      />
      <KPIItem label="Estaciones" value={criticalStationsCount} icon={MapPin} />
      <KPIItem label="Pérdida Est." value={formattedLoss} icon={DollarSign} />
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
      {/* ── Header (same bg-white, flush KPI strip like DriversKPIStrip) ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-10 pt-8 pb-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
              Control de Combustible
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">
              Auditoría de Cargas y Desviaciones
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-black uppercase text-[10px] tracking-widest border-slate-200 italic"
          >
            Exportar Datos
          </Button>
        </div>
        <FuelKPIStripInline
          discrepanciesCount={fuelData?.topDiscrepancies?.length ?? 0}
          totalDiscrepancyLiters={totalDiscrepancyLiters}
          criticalStationsCount={fuelData?.criticalStations?.length ?? 0}
          estimatedLossARS={estimatedLossARS}
        />
      </div>

      {/* ── Body: sections self-contained with p-10 border-r bg-white, no wrapper bg ── */}
      <ScrollArea className="flex-1">
        {/* Row 1: Ranking | Estaciones */}
        <div className="flex flex-col lg:flex-row border-b border-slate-100">
          {/* Ranking */}
          <div className="flex-1 p-10 border-r border-slate-100 bg-white">
            <div className="flex items-start justify-between mb-10">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                  Desviaciones por Conductor
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Ranking de Anomalías — Últimos 30 Días
                </p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter italic text-rose-600">
                {fuelData?.topDiscrepancies?.length ?? 0} Flagged
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-slate-900 rounded-full" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Procesando registros...
                  </span>
                </div>
              ) : (
                fuelData?.topDiscrepancies.map((driver, index) => (
                  <div
                    key={driver.driverId}
                    onClick={() => onDriverClick?.(driver.driverId)}
                    className="py-4 hover:bg-slate-50/60 transition-colors cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-2xl font-black italic tracking-tighter text-slate-200 w-8 text-right select-none">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-sm font-black italic tracking-tighter text-slate-900 uppercase">
                          {driver.driverName}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            ID: {driver.driverId}
                          </span>
                          <span className="text-[9px] font-black text-rose-500 uppercase italic">
                            {driver.flagCount} Alertas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={cn(
                            "text-base font-black italic tracking-tighter",
                            driver.discrepancyPercentage > 8
                              ? "text-rose-600"
                              : "text-slate-900",
                          )}
                        >
                          {driver.discrepancyLiters.toFixed(0)}L
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          Desvío {driver.discrepancyPercentage.toFixed(1)}%
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estaciones Críticas — shrinks to content, no forced full height */}
          <div className="flex-1 p-10 bg-white flex flex-col gap-6 self-start">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                Estaciones Críticas
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Mayor Acumulación de Desvíos
              </p>
            </div>

            <div className="flex flex-col">
              {fuelData?.criticalStations?.map((station) => (
                <div
                  key={station.brand}
                  className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
                >
                  <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">
                    {station.brand}
                  </p>
                  <div className="text-right">
                    <div className="text-sm font-black italic tracking-tighter text-rose-600">
                      +{station.totalDiscrepancyLiters}L
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      {station.locationCount} Loc.
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
  );
}
