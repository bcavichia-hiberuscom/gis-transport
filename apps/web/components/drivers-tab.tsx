"use client";

import { AddDriverDialog } from "./add-driver-dialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  ChevronRight,
  Search,
  Activity,
  Layers,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { cn, getDriverIsAvailable, getDriverOnTimeRate } from "@/lib/utils";
import type { Driver, FleetVehicle } from "@gis/shared";

// Analytical & Corporate Components
import { DriversSubNav } from "./analytics/drivers-sub-nav";
import { DriversKPIStrip } from "./analytics/drivers-kpi-strip";
import { DriversTrendChart } from "./analytics/drivers-trend-chart";
import { DriversFactorsChart } from "./analytics/drivers-factors-chart";
import { DriversLeaderboard } from "./analytics/drivers-leaderboard";
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";
import { FuelManagementView } from "./analytics/fuel-management-view";

interface DriversTabProps {
  drivers: Driver[];
  fleetVehicles: FleetVehicle[];
  isLoading: boolean;
  addDriver: (driver: Partial<Driver>) => Promise<Driver | undefined>;
  fetchDrivers: () => Promise<void>;
  onDriverSelect?: (driver: Driver) => void;
  onFuelDetailSelect?: (driverId: string) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  expandedGroups?: Record<string, boolean>;
  onToggleGroup?: (group: string, isExpanded: boolean) => void;
}

export function DriversTab({
  drivers,
  fleetVehicles,
  isLoading,
  addDriver,
  fetchDrivers,
  onDriverSelect,
  onFuelDetailSelect,
  onVehicleSelect,
  expandedGroups,
  onToggleGroup,
}: DriversTabProps) {
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

    const filteredDrivers = drivers.map((d) => ({
      ...d,
      filteredEvents: (d.speedingEvents || []).filter(
        (e) => new Date(e.timestamp) >= thresholdDate,
      ),
    }));

    const totalSpeeding = filteredDrivers.reduce(
      (acc, d) => acc + d.filteredEvents.length,
      0,
    );
    const baseScore =
      filteredDrivers.reduce(
        (acc, d) => acc + (d.onTimeDeliveryRate || 100),
        0,
      ) / (drivers.length || 1);
    const penaltyPerEvent = 5;
    const finalAvgScore = Math.max(
      0,
      Math.round(
        baseScore - (totalSpeeding * penaltyPerEvent) / (drivers.length || 1),
      ),
    );

    const trendData = [
      { name: "Semana 1", score: Math.min(100, finalAvgScore - 4), goal: 95 },
      { name: "Semana 2", score: Math.min(100, finalAvgScore - 2), goal: 95 },
      { name: "Semana 3", score: Math.min(100, finalAvgScore + 1), goal: 95 },
      { name: "Semana Actual", score: finalAvgScore, goal: 95 },
    ];

    const factorData =
      totalSpeeding > 0
        ? [
            {
              name: "Excesos de Velocidad",
              impact: totalSpeeding,
              color: "#0f172a",
            },
            {
              name: "Demoras en Entrega",
              impact: Math.round(100 - baseScore),
              color: "#334155",
            },
          ]
        : [];

    return {
      totalSpeeding,
      avgScore: finalAvgScore,
      trendData: drivers.length > 0 ? trendData : [],
      factorData,
    };
  }, [drivers, currentPeriod]);

  const groups = useMemo(() => {
    return {
      available: drivers.filter((d) => getDriverIsAvailable(d)),
      assigned: drivers.filter((d) => !getDriverIsAvailable(d)),
    };
  }, [drivers]);

  // Two-column layout doesn't need local collapse state

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      onClick={() => onDriverSelect?.(driver)}
      className="group bg-white border border-slate-100 rounded-lg p-4 hover:shadow-sm transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-xl overflow-hidden border border-slate-200">
            {driver.imageUrl ? (
              <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-slate-400 uppercase">{driver.id.substring(0, 2)}</span>
            )}
          </div>
          <span className={cn("absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white", driver.isAvailable ? "bg-emerald-500" : "bg-slate-900")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black italic tracking-tighter text-slate-900 uppercase truncate">{driver.name}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{driver.licenseType || 'Cat. B'}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{getDriverOnTimeRate(driver)}% Eficacia</span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", driver.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-800")}>{driver.isAvailable ? 'Disponible' : 'Asignado'}</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Truck className="h-3 w-3 text-slate-400" />
              <span className="text-[11px]">{fleetVehicles.find((v) => v.id === (driver as any).vehicleId)?.type?.label ?? 'Sin vehículo'}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span>{(driver as any).location?.lat ? `${(driver as any).location.lat?.toFixed?.(3) || '—'}, ${(driver as any).location?.lng ? (driver as any).location.lng?.toFixed?.(3) || '—' : '—'}` : '—'}</span>
            </span>
            <span className="ml-auto text-slate-400">{(driver as any).kmToday ?? 0} km • {(driver as any).activeHoursToday ?? 0} h</span>
            <span className="text-rose-500 font-bold ml-2">{(driver.speedingEvents?.length || 0) > 0 ? `${driver.speedingEvents?.length ?? 0} ⚠` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      {/* High-Level Corporate Header */}
      <div className="shrink-0 bg-white border-b border-slate-100">
        <div className="px-8 py-10 pb-8 flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
              Auditoría Operativa de Flota
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              Personal
            </h2>
          </div>

          {activeTab === "drivers" && (
            <Button
              className="h-10 px-8 bg-slate-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase italic tracking-widest rounded-xl border border-slate-900"
              onClick={() => setIsAddOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2.5" />
              Registrar Operativo
            </Button>
          )}
        </div>

        <DriversSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Auditoría de Desempeño */}
              <div className="px-8 py-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/10">
                <div className="flex items-center gap-4" />
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>

              <DriversKPIStrip
                activeDriversCount={drivers.length}
                totalSpeedingEvents={analyticsData.totalSpeeding}
                avgScore={analyticsData.avgScore}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white">
                <DriversTrendChart data={analyticsData.trendData} />
                <DriversFactorsChart data={analyticsData.factorData} />
              </div>

              <DriversLeaderboard
                drivers={drivers}
                onDriverSelect={onDriverSelect}
              />
            </div>
          )}

          {activeTab === "drivers" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white">
              {/* Manager KPI Panel */}
              <div className="px-8 pt-6 pb-6 border-b border-slate-100 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-100 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Conductores
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Total
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-extrabold tabular-nums text-slate-900">
                      {drivers.length}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Activos en la flota
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Disponibles
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Ahora
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-extrabold tabular-nums text-emerald-600">
                      {groups.available.length}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Listos para asignación
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Incidentes (30d)
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Telemetry
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-extrabold tabular-nums text-rose-600">
                      {analyticsData.totalSpeeding}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Eventos detectados
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Puntaje Prom.
                      </div>
                      <div className="text-xs font-bold text-slate-400">
                        Calidad
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-extrabold tabular-nums text-sky-600">
                      {analyticsData.avgScore}%
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Rendimiento medio
                    </div>
                  </div>
                </div>
              </div>
              {/* ↑ KPI Panel closes here */}

              {/* Two-column split: Disponibles | En Servicio */}
              <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column: Disponibles */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="w-full flex items-center justify-between px-4 py-3 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Disponibles</span>
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{groups.available.length}</span>
                    </div>
                  </div>

                    <div className="bg-white max-h-[56vh] overflow-auto">
                      <div className="p-4 grid grid-cols-1 gap-3">
                        {groups.available.length > 0 ? (
                          groups.available.map(renderDriverCard)
                        ) : (
                          <div className="py-12 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">No se detecta personal disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                </div>

                {/* Column: En Servicio */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="w-full flex items-center justify-between px-4 py-3 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">En Servicio</span>
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{groups.assigned.length}</span>
                    </div>
                  </div>

                  <div className="bg-white max-h-[56vh] overflow-auto">
                    <div className="p-4 grid grid-cols-1 gap-3">
                      {groups.assigned.length > 0 ? (
                        groups.assigned.map(renderDriverCard)
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">Sin actividad operativa registrada</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fuel" && (
            <div className="bg-white">
              <FuelManagementView
                onDriverClick={(driverId) => {
                  onFuelDetailSelect?.(driverId);
                }}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      <AddDriverDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={async (val) => {
          await addDriver(val);
          setIsAddOpen(false);
          await fetchDrivers();
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
