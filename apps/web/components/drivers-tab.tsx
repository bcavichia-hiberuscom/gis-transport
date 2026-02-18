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
      className="group relative bg-card border-b border-border p-4 transition-all hover:bg-secondary cursor-pointer overflow-hidden border-r last:border-r-0"
    >
      <div className="flex gap-3 items-center relative z-10">
        <div className="relative">
          <div className="h-9 w-9 bg-secondary flex items-center justify-center shrink-0 rounded-md">
            {driver.imageUrl ? (
              <img
                src={driver.imageUrl}
                alt={driver.name}
                className="h-full w-full object-cover rounded-md"
              />
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground">
                {driver.id.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
              driver.isAvailable ? "bg-emerald-500" : "bg-foreground",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className="text-xs font-medium text-foreground truncate group-hover:text-foreground transition-colors leading-tight">
              {driver.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {driver.licenseType || "Cat. B"}
              </span>
              <span className="h-0.5 w-0.5 bg-border rounded-full" />
              <span className="text-[10px] text-muted-foreground">
                {getDriverOnTimeRate(driver)}% Eficacia
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-all shrink-0" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-card overflow-hidden">
      {/* Corporate Header */}
      <div className="shrink-0 bg-card border-b border-border">
        <div className="px-8 py-8 pb-6 flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted-foreground">
              Auditoria Operativa de Flota
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground leading-none">
              Personal
            </h2>
          </div>

          {activeTab === "drivers" && (
            <Button
              className="h-9 px-5 text-xs font-medium"
              onClick={() => setIsAddOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
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
              {/* Auditoria de Desempeno */}
              <div className="px-8 py-6 flex items-center justify-between border-b border-border">
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

              <div className="grid grid-cols-1 xl:grid-cols-2 bg-card">
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-card">
              {/* Grupo: Disponibles */}
              <div className="border-b border-border">
                <button
                  onClick={() => toggleGroup("available")}
                  className="w-full flex items-center justify-between px-8 py-4 group hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-foreground">
                      Disponibles
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {groups.available.length}
                    </Badge>
                  </div>
                  {expandedGroups?.available ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {expandedGroups?.available && (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 bg-card">
                    {groups.available.length > 0 ? (
                      groups.available.map(renderDriverCard)
                    ) : (
                      <div className="col-span-full py-10 text-center border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          No se detecta personal disponible
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grupo: En Servicio */}
              <div className="border-b border-border">
                <button
                  onClick={() => toggleGroup("assigned")}
                  className="w-full flex items-center justify-between px-8 py-4 group hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      En Servicio
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {groups.assigned.length}
                    </Badge>
                  </div>
                  {expandedGroups?.assigned ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {expandedGroups?.assigned && (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 bg-card">
                    {groups.assigned.length > 0 ? (
                      groups.assigned.map(renderDriverCard)
                    ) : (
                      <div className="col-span-full py-10 text-center border-t border-border">
                        <p className="text-xs text-muted-foreground">
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
            <div className="bg-card">
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
