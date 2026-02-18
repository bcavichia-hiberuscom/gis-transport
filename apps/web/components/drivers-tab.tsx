"use client";

import { AddDriverDialog } from "./add-driver-dialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  ChevronDown,
  ChevronRight,
  Search,
  Activity,
  Layers,
  Clock,
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

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      onClick={() => onDriverSelect?.(driver)}
      className="group relative bg-white border-b border-slate-100 p-5 transition-all hover:bg-slate-50 cursor-pointer overflow-hidden border-r last:border-r-0"
    >
      <div className="flex gap-4 items-center relative z-10">
        <div className="relative">
          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 rounded-xl">
            {driver.imageUrl ? (
              <img
                src={driver.imageUrl}
                alt={driver.name}
                className="h-full w-full object-cover grayscale opacity-90"
              />
            ) : (
              <span className="text-[10px] font-black text-slate-400 uppercase italic">
                {driver.id.substring(0, 2)}
              </span>
            )}
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white",
              driver.isAvailable ? "bg-emerald-500" : "bg-slate-900",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className="text-[12px] font-black italic tracking-tighter text-slate-900 truncate uppercase group-hover:text-blue-600 transition-colors leading-tight">
              {driver.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {driver.licenseType || "Cat. B"}
              </span>
              <span className="h-0.5 w-0.5 bg-slate-300" />
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                  {getDriverOnTimeRate(driver)}% Eficacia
                </span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-1 group-hover:text-slate-900 transition-all shrink-0" />
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
                <div className="flex items-center gap-4"></div>
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
              {/* Grupo: Disponibles */}
              <div className="border-b border-slate-100">
                <button
                  onClick={() => toggleGroup("available")}
                  className="w-full flex items-center justify-between px-8 py-4 group hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                      Disponibles
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">
                      {groups.available.length}
                    </span>
                  </div>
                  {expandedGroups?.available ? (
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                </button>
                {expandedGroups?.available && (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 bg-white">
                    {groups.available.length > 0 ? (
                      groups.available.map(renderDriverCard)
                    ) : (
                      <div className="col-span-full py-12 text-center border-t border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">
                          No se detecta personal disponible
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grupo: En Servicio */}
              <div className="border-b border-slate-100">
                <button
                  onClick={() => toggleGroup("assigned")}
                  className="w-full flex items-center justify-between px-8 py-4 group hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                      En Servicio
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">
                      {groups.assigned.length}
                    </span>
                  </div>
                  {expandedGroups?.assigned ? (
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                </button>
                {expandedGroups?.assigned && (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 bg-white">
                    {groups.assigned.length > 0 ? (
                      groups.assigned.map(renderDriverCard)
                    ) : (
                      <div className="col-span-full py-12 text-center border-t border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">
                          Sin actividad operativa registrada
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
