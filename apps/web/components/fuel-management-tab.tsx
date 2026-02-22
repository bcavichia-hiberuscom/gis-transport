"use client";

import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { FleetFuelOverview } from "@gis/shared";
import { FuelTrendChart } from "./analytics/fuel-trend-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronRight,
  MapPin,
  Fuel,
  DollarSign,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";

// ─── KPI Strip ────────────────────────────────────────────────────────────────

interface KPIItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}

function KPIItem({ label, value, icon: Icon, trend }: KPIItemProps) {
  return (
    <div className="kpi-card group">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 flex items-center justify-center bg-[#F7F8FA] border border-[#EAEAEA] text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C] transition-all">
          <Icon strokeWidth={1.5} className="h-4 w-4" />
        </div>
        {trend && (
           <span className={cn(trend.positive ? "trend-up" : "trend-down")}>
            {trend.positive ? "+" : ""}{trend.value}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPIItem label="Anomalías" value={discrepanciesCount} icon={AlertTriangle} trend={{ value: "2", positive: false }} />
      <KPIItem label="Varianza Total" value={`${totalDiscrepancyLiters.toFixed(0)}L`} icon={Fuel} trend={{ value: "5.2%", positive: false }} />
      <KPIItem label="Hubs Críticos" value={criticalStationsCount} icon={MapPin} />
      <KPIItem label="Riesgo Estimado" value={formattedLoss} icon={DollarSign} trend={{ value: "12%", positive: false }} />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface FuelManagementTabProps {
  onDriverClick?: (driverId: string) => void;
}

export function FuelManagementTab({ onDriverClick }: FuelManagementTabProps) {
  const [fuelData, setFuelData] = useState<FleetFuelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>("30d");

  useEffect(() => {
    const fetchFuelData = async () => {
      try {
        const now = Date.now();
        let startDate = now - 30 * 24 * 60 * 60 * 1000;
        
        if (currentPeriod === "7d") startDate = now - 7 * 24 * 60 * 60 * 1000;
        else if (currentPeriod === "90d") startDate = now - 90 * 24 * 60 * 60 * 1000;
        else if (currentPeriod === "year") startDate = new Date(new Date().getFullYear(), 0, 1).getTime();

        const data = await fuelService.getFleetFuelOverview(startDate, now);
        setFuelData(data);
      } catch (error) {
        console.error("Failed to fetch fuel overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFuelData();
  }, [currentPeriod]);

  const totalDiscrepancyLiters =
    fuelData?.topDiscrepancies?.reduce(
      (acc, d) => acc + d.discrepancyLiters,
      0,
    ) ?? 0;

  const FUEL_PRICE_PER_LITER = 1200;
  const estimatedLossARS = totalDiscrepancyLiters * FUEL_PRICE_PER_LITER;

  return (
    <div className="flex flex-col grow h-full bg-white animate-in fade-in duration-500">
      {/* Premium Operational Header */}
      <div className="shrink-0 border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex items-center justify-between gap-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <Fuel strokeWidth={1.5} className="h-5 w-5" />
              Gestión de Combustible
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Monitoreo táctico de eficiencia y auditoría proactiva de consumos.
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-white">
        <div className="p-10 space-y-10">
          <div className="flex justify-end mb-6">
             <PeriodSelector currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />
          </div>
          
            <FuelKPIStripInline
              discrepanciesCount={fuelData?.topDiscrepancies?.length ?? 0}
              totalDiscrepancyLiters={totalDiscrepancyLiters}
              criticalStationsCount={fuelData?.criticalStations?.length ?? 0}
              estimatedLossARS={estimatedLossARS}
            />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 premium-card rounded-lg h-[400px] border-[#EAEAEA] bg-white p-4 overflow-hidden animate-in fade-in duration-700">
              {fuelData?.trendData && fuelData.trendData.length > 0 && (
                <FuelTrendChart
                  data={fuelData.trendData}
                  title="Telemetría vs Auditoría"
                />
              )}
            </div>
            
            <div className="p-6 premium-card h-[400px] flex flex-col gap-6 border-[#EAEAEA] bg-white animate-in fade-in duration-700">
              <div className="flex flex-col gap-0.5 pb-4 border-b border-[#EAEAEA]">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-2">
                  <MapPin strokeWidth={1.5} className="h-4 w-4 text-[#6B7280]/60" />
                  Hubs Críticos
                </h3>
              </div>

              <div className="flex flex-col gap-3 flex-1 overflow-auto pr-1">
                {fuelData?.criticalStations?.map((station) => (
                  <div
                    key={station.brand}
                    className="flex items-center justify-between p-4 bg-[#F7F8FA] border border-[#EAEAEA] hover:border-[#1C1C1C]/40 rounded-lg transition-all group"
                  >
                    <div className="flex flex-col gap-0.5">
                       <p className="text-[12px] font-medium text-[#1C1C1C] uppercase group-hover:text-[#1C1C1C]">
                         {station.brand}
                       </p>
                       <span className="text-[9px] text-[#6B7280]/60 font-medium uppercase tracking-wider">Punto de Auditoría</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-medium text-red-600 tabular-nums">
                        +{station.totalDiscrepancyLiters.toFixed(0)}L
                      </div>
                      <div className="text-[9px] text-[#6B7280]/40 font-medium uppercase tracking-wider">
                        {station.locationCount} REGISTROS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            
          {/* Ranking */}
          <div className="p-8 premium-card border-[#EAEAEA] bg-white rounded-lg animate-in fade-in duration-500 mb-10">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAEAEA]">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-3">
                    <div className="h-3 w-1 bg-red-600 rounded-full" />
                    Alertas de Auditoría Logística
                  </h3>
                  <p className="text-[10px] font-normal text-[#6B7280] uppercase tracking-wider ml-4">
                    Historial de varianza (30 días)
                  </p>
                </div>
                <div className="px-3 py-1 bg-red-50 border border-red-100 rounded">
                  <span className="text-[10px] font-medium text-red-600 uppercase tracking-wider">{fuelData?.topDiscrepancies?.length ?? 0} Reportes Críticos</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              {loading ? (
                <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 bg-[#F7F8FA] rounded-lg border border-dashed border-[#EAEAEA]">
                  <Activity strokeWidth={1.5} className="h-8 w-8 text-[#6B7280]/20 animate-pulse" />
                  <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">Sincronizando Sistema...</span>
                </div>
              ) : (
                fuelData?.topDiscrepancies.map((driver, index) => (
                  <div
                    key={driver.driverId}
                    onClick={() => onDriverClick?.(driver.driverId)}
                    className="p-4 bg-white border-b border-[#EAEAEA] hover:bg-[#F7F8FA] transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-8 w-8 bg-[#1C1C1C] flex items-center justify-center text-[#D4F04A] font-medium text-[11px] rounded">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-medium text-[#1C1C1C] uppercase group-hover:text-[#1C1C1C]">
                          {driver.driverName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase">ID: {driver.driverId.substring(0, 8)}</span>
                          <span className="text-[9px] font-medium text-red-600 uppercase bg-red-50 px-1.5 rounded">{driver.flagCount} ALERTAS</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex flex-col items-end">
                         <div className="text-xl font-medium text-[#1C1C1C] tabular-nums">
                           {driver.discrepancyPercentage.toFixed(1)}%
                         </div>
                         <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase">Varianza</span>
                       </div>
                       <ChevronRight strokeWidth={1.5} className="h-4 w-4 text-[#6B7280]/40 group-hover:text-[#1C1C1C] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
