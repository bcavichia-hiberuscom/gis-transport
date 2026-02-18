"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  ChevronRight,
  Wrench,
  Activity,
  AlertTriangle,
  Zap,
  MapPin,
  Gauge,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetVehicle } from "@gis/shared";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";

// Analytical & Corporate Components
import { VehiclesSubNav } from "@/components/analytics/vehicles-sub-nav";
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";
import { VehiclesKPIStrip } from "./analytics/vehicles-kpi-strip";
import { VehiclesTrendChart } from "./analytics/vehicles-trend-chart";
import { VehiclesFactorsChart } from "./analytics/vehicles-factors-chart";
import { VehiclesLeaderboard } from "./analytics/vehicles-leaderboard";

interface VehiclesTabProps {
  fleetVehicles: FleetVehicle[];
  isLoading: boolean;
  addVehicle: (vehicle: Partial<FleetVehicle>) => Promise<FleetVehicle | undefined>;
  fetchVehicles: () => Promise<void>;
  onVehicleSelect?: (vehicle: FleetVehicle) => void;
  expandedGroups?: Record<string, boolean>;
  onToggleGroup?: (group: string, isExpanded: boolean) => void;
}

export function VehiclesTab({
  fleetVehicles,
  isLoading,
  addVehicle,
  fetchVehicles,
  onVehicleSelect,
  expandedGroups,
  onToggleGroup,
}: VehiclesTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>("30d");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const toggleGroup = (group: string) => {
    if (onToggleGroup && expandedGroups) {
      onToggleGroup(group, !expandedGroups[group]);
    }
  };

  const analyticsData = useMemo(() => {
    const now = new Date();
    let thresholdDate = new Date();

    if (currentPeriod === "7d") thresholdDate.setDate(now.getDate() - 7);
    else if (currentPeriod === "30d") thresholdDate.setDate(now.getDate() - 30);
    else if (currentPeriod === "90d") thresholdDate.setDate(now.getDate() - 90);
    else if (currentPeriod === "year")
      thresholdDate.setFullYear(now.getFullYear(), 0, 1);

    // Calcular dinámicamente KPIs basados en datos reales
    const maintenanceCount = fleetVehicles.filter((v) => (v as any).status === "maintenance").length;
    const availableCount = fleetVehicles.length - maintenanceCount;
    const totalConsumption = fleetVehicles.reduce((acc, v) => acc + ((v as any).fuelConsumption || 0), 0);
    const avgConsumption = fleetVehicles.length > 0 ? totalConsumption / fleetVehicles.length : 0;
    const totalMileage = fleetVehicles.reduce((acc, v) => acc + ((v as any).mileage || 0), 0);
    const utilizationRate = fleetVehicles.length > 0 ? Math.round((availableCount / fleetVehicles.length) * 100) : 0;

    // Datos de tendencia (abstracto, será reemplazado con datos reales)
    const trendData = [
      { name: "Semana 1", utilization: Math.max(0, utilizationRate - 8), goal: 85 },
      { name: "Semana 2", utilization: Math.max(0, utilizationRate - 4), goal: 85 },
      { name: "Semana 3", utilization: Math.max(0, utilizationRate - 2), goal: 85 },
      { name: "Semana Actual", utilization: utilizationRate, goal: 85 },
    ];

    // Datos de factores de consumo (abstracto)
    const factorData = avgConsumption > 0
      ? [
          {
            name: "Vehículos Pesados",
            impact: Math.round(totalConsumption * 0.6),
            color: "#0f172a",
          },
          {
            name: "Vehículos Ligeros",
            impact: Math.round(totalConsumption * 0.4),
            color: "#334155",
          },
        ]
      : [];

    // Leaderboard de vehículos por consumo
    const leaderboardData = fleetVehicles
      .map((v) => ({
        id: v.id,
        label: (v as any).licensePlate || String(v.id),
        value: (v as any).fuelConsumption || 0,
        metric: "consumption" as const,
        status: (v as any).fuelConsumption > 20 ? ("critical" as const) : (v as any).fuelConsumption > 15 ? ("warning" as const) : ("good" as const),
      }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 5);

    return {
      totalVehicles: fleetVehicles.length,
      availableVehicles: availableCount,
      maintenanceVehicles: maintenanceCount,
      utilizationRate,
      avgConsumption,
      totalMileage,
      trendData: fleetVehicles.length > 0 ? trendData : [],
      factorData,
      leaderboardData,
    };
  }, [fleetVehicles, currentPeriod]);

  const groups = useMemo(() => {
    return {
      available: fleetVehicles.filter((v) => (v as any).status !== "maintenance"),
      maintenance: fleetVehicles.filter((v) => (v as any).status === "maintenance"),
    };
  }, [fleetVehicles]);

  const renderVehicleCard = (vehicle: FleetVehicle) => (
    <div
      key={vehicle.id}
      onClick={() => onVehicleSelect?.(vehicle)}
      className="group bg-white border border-slate-100 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-xl overflow-hidden border border-slate-200">
            {(vehicle as any).imageUrl ? (
              <img src={(vehicle as any).imageUrl} alt={(vehicle as any).licensePlate} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-slate-400 uppercase">{String(vehicle.id).substring(0, 2)}</span>
            )}
          </div>
          <span className={cn("absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white", (vehicle as any).status !== "maintenance" ? "bg-emerald-500" : "bg-amber-500")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black italic tracking-tighter text-slate-900 uppercase truncate">{(vehicle as any).licensePlate || vehicle.id}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{(vehicle as any).brand || '—'}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{(vehicle as any).model || '—'}</span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0 mt-0.5" />
          </div>

          <div className="mt-3 flex flex-col gap-2 text-[10px] text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap", (vehicle as any).status === "maintenance" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{(vehicle as any).status === "maintenance" ? 'Mantenimiento' : 'Disponible'}</span>
              {(vehicle as any).nextMaintenanceDate && (
                <span className="text-rose-500 font-bold text-[9px]">Próx. mtto</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Users2 className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-[10px] truncate">{vehicle.type?.label || '—'}</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Gauge className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-[10px] truncate">{((vehicle as any).mileage || 0).toLocaleString()} km</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 sm:text-slate-500">
              <Zap className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{((vehicle as any).fuelConsumption || 0).toFixed(1)} L/100km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      {/* High-Level Corporate Header */}
      <div className="shrink-0 bg-white border-b border-slate-100">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
              Auditoría Operativa de Flota
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              Vehículos
            </h2>
          </div>

          {activeTab === "vehicles" && (
            <Button
              className="h-10 px-6 sm:px-8 bg-slate-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase italic tracking-widest rounded-xl border border-slate-900 whitespace-nowrap"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2.5" />
              <span className="hidden sm:inline">Agregar Vehículo</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          )}
        </div>

        <VehiclesSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Auditoría de Desempeño */}
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 bg-slate-50/10 gap-4">
                <div className="flex items-center gap-4" />
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>

              <VehiclesKPIStrip
                totalVehicles={analyticsData.totalVehicles}
                availableVehicles={analyticsData.availableVehicles}
                maintenanceVehicles={analyticsData.maintenanceVehicles}
                avgConsumption={analyticsData.avgConsumption}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white">
                <VehiclesTrendChart data={analyticsData.trendData} />
                <VehiclesFactorsChart data={analyticsData.factorData} />
              </div>

              <VehiclesLeaderboard vehicles={analyticsData.leaderboardData} />
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white">
              {/* Manager KPI Panel - Vehicles Tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-t border-slate-100">
                {/* Total Vehículos */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-sky-50 text-sky-600">
                      <Users2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-sky-500">
                      Total Vehículos
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {analyticsData.totalVehicles}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-sky-100" />
                </div>

                {/* Disponibles */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-emerald-50 text-emerald-600">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-emerald-500">
                      Disponibles
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {groups.available.length}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-emerald-100" />
                </div>

                {/* Mantenimiento */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-amber-50 text-amber-600">
                      <Wrench className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-amber-500">
                      Mantenimiento
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {groups.maintenance.length}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-amber-100" />
                </div>

                {/* Consumo Combustible */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-rose-50 text-rose-600">
                      <Zap className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-rose-500">
                      Consumo Prom.
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      0 L
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-rose-100" />
                </div>
              </div>

              {/* Two-column split: Disponibles | Mantenimiento */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-max">
                {/* Column: Disponibles */}
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col min-h-0 lg:max-h-[calc(100vh-420px)]">
                  <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Disponibles</span>
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{groups.available.length}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div className="p-3 sm:p-4 grid grid-cols-1 gap-3">
                      {groups.available.length > 0 ? (
                        groups.available.map(renderVehicleCard)
                      ) : (
                        <div className="py-8 sm:py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">No hay vehículos disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column: Mantenimiento */}
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col min-h-0 lg:max-h-[calc(100vh-420px)]">
                  <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.3)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Mantenimiento</span>
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{groups.maintenance.length}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div className="p-3 sm:p-4 grid grid-cols-1 gap-3">
                      {groups.maintenance.length > 0 ? (
                        groups.maintenance.map(renderVehicleCard)
                      ) : (
                        <div className="py-8 sm:py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">Sin vehículos en mantenimiento</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white">
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                  <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">Módulo de mantenimiento próximamente</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <AddVehicleDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={async (val: Partial<FleetVehicle>) => {
          await addVehicle(val);
          setIsAddOpen(false);
          await fetchVehicles();
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
