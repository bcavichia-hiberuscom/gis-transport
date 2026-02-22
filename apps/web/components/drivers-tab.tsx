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
  Users2,
  AlertTriangle,
} from "lucide-react";
import { cn, getDriverIsAvailable } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Driver, FleetVehicle } from "@gis/shared";

// Analytical & Corporate Components
import { DriversSubNav } from "./analytics/drivers-sub-nav";
import { DriversTrendChart } from "./analytics/drivers-trend-chart";
import { DriversFactorsChart } from "./analytics/drivers-factors-chart";
import { DriversLeaderboard } from "./analytics/drivers-leaderboard";
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";
import { DriversKPIStrip } from "./analytics/drivers-kpi-strip";

interface DriversTabProps {
  drivers: Driver[];
  fleetVehicles: FleetVehicle[];
  isLoading: boolean;
  addDriver: (driver: Partial<Driver>) => Promise<Driver | undefined>;
  fetchDrivers: () => Promise<void>;
  onDriverSelect?: (driver: Driver) => void;
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
  onVehicleSelect,
  expandedGroups,
  onToggleGroup,
}: DriversTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>("30d");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Decoupled Filter States
  const [availSearch, setAvailSearch] = useState("");
  const [availMinScore, setAvailMinScore] = useState(0);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignMinScore, setAssignMinScore] = useState(0);

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

    const activeDrivers = drivers.filter(d => !getDriverIsAvailable(d));
    const avgScore = drivers.length > 0
      ? Math.round(drivers.reduce((acc, d) => acc + ((d as any).safetyScore || 0), 0) / (drivers.length || 1))
      : 0;

    const trendData = [
      { name: "Semana 1", score: Math.max(0, avgScore - 4), goal: 95 },
      { name: "Semana 2", score: Math.max(0, avgScore - 2), goal: 95 },
      { name: "Semana 3", score: Math.max(0, avgScore + 1), goal: 95 },
      { name: "Semana Actual", score: avgScore, goal: 95 },
    ];

    const factorData =
      totalSpeeding > 0
        ? [
          {
            name: "Excesos de Velocidad",
            impact: totalSpeeding,
            color: "#1C1C1C",
          },
          {
            name: "Demoras en Entrega",
            impact: Math.round(100 - avgScore),
            color: "#6B7280",
          },
        ]
        : [];

    return {
      activeDriversCount: activeDrivers.length,
      totalSpeeding,
      avgScore,
      trendData: drivers.length > 0 ? trendData : [],
      factorData,
      trends: {
        active: { value: "3", positive: true },
        score: { value: "0.8%", positive: true },
        alerts: { value: "1", positive: false },
      }
    };
  }, [drivers, currentPeriod]);

  const groups = useMemo(() => {
    const filterFn = (d: Driver, q: string, s: number) => {
      const name = d.name || "";
      const id = String(d.id || "");
      const score = (d as any).safetyScore ?? 100;
      const matchesSearch = name.toLowerCase().includes(q.toLowerCase()) ||
        id.toLowerCase().includes(q.toLowerCase());
      const matchesScore = score >= s;
      return matchesSearch && matchesScore;
    };

    const availableRaw = drivers.filter((d) => getDriverIsAvailable(d));
    const assignedRaw = drivers.filter((d) => !getDriverIsAvailable(d));

    return {
      available: availableRaw.filter(d => filterFn(d, availSearch, availMinScore)),
      assigned: assignedRaw.filter(d => filterFn(d, assignSearch, assignMinScore)),
    };
  }, [drivers, availSearch, availMinScore, assignSearch, assignMinScore]);

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      onClick={() => onDriverSelect?.(driver)}
      className="premium-card p-5 cursor-pointer group border-[#EAEAEA] hover:border-[#D4F04A]/40 transition-all bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="h-12 w-12 bg-[#F7F8FA] flex items-center justify-center rounded-lg overflow-hidden border border-[#EAEAEA] transition-all group-hover:border-[#1C1C1C] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A]">
            {driver.imageUrl ? (
              <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-20" />
            ) : (
              <span className="text-xs font-medium">{driver.name.substring(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Activity strokeWidth={1.5} className="h-5 w-5" />
            </div>
          </div>
          <span className={cn(
            "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
            driver.isAvailable ? "bg-[#D4F04A]" : "bg-blue-600"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-medium tracking-tight text-[#1C1C1C] truncate">{driver.name}</h4>
              <p className="text-[10px] font-medium text-[#6B7280] mt-0.5 uppercase tracking-wider">
                {driver.licenseType || 'CLASS B'} • OP-{driver.id.substring(0, 6)}
              </p>
            </div>
            <div className="h-7 w-7 rounded-md bg-[#F7F8FA] flex items-center justify-center text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] transition-all">
              <ChevronRight strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Estado</span>
              <span className={cn(
                "w-fit px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border",
                driver.isAvailable 
                  ? "bg-[#D4F04A]/10 text-[#5D6B1A] border-[#D4F04A]/20" 
                  : "bg-blue-50 text-blue-700 border-blue-100"
              )}>
                {driver.isAvailable ? 'Disponible' : 'En Misión'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Safety Score</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tabular-nums text-[#1C1C1C]">
                  {(driver as any).safetyScore || 95}%
                </span>
                <div className="flex-1 h-1 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#EAEAEA]">
                  <div className="h-full bg-[#1C1C1C] rounded-full" style={{ width: `${(driver as any).safetyScore || 95}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#F7F8FA] flex items-center justify-center rounded-md border border-[#EAEAEA]">
                <Truck strokeWidth={1.5} className="h-4 w-4 text-[#6B7280]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-medium text-[#6B7280] uppercase tracking-wider">Activo</span>
                <span className="text-[10px] font-medium text-[#1C1C1C] truncate uppercase tabular-nums">
                  {fleetVehicles.find((v) => v.id === (driver as any).vehicleId)?.type?.label ?? 'STANDBY'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#F7F8FA] flex items-center justify-center rounded-md border border-[#EAEAEA]">
                <Clock strokeWidth={1.5} className="h-4 w-4 text-[#6B7280]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-medium text-[#6B7280] uppercase tracking-wider">Jornada</span>
                <span className="text-[10px] font-medium text-[#1C1C1C] tabular-nums">{(driver as any).activeHoursToday ?? '0.0'}h / 8.0h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      {/* Streamlined Operational Header */}
      <div className="shrink-0 bg-white border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <Users2 strokeWidth={1.5} className="h-5 w-5" />
               Recursos Humanos
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Gestión estratégica de operadores y métricas de rendimiento operacional.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === "drivers" && (
              <Button
                className="h-10 px-6 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white text-[12px] font-medium uppercase tracking-wider rounded-md transition-all shadow-none border-none"
                onClick={() => setIsAddOpen(true)}
              >
                <UserPlus strokeWidth={1.5} className="h-4 w-4 mr-2" />
                Registrar Operador
              </Button>
            )}
          </div>
        </div>

        <DriversSubNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex-1 min-h-0 bg-white">
        <ScrollArea className="h-full">
          {activeTab === "overview" && (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              <div className="px-10 pt-10 pb-6 flex justify-end">
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>
              <div className="px-10 pb-10">
                <DriversKPIStrip
                  activeDriversCount={analyticsData.activeDriversCount}
                  avgScore={analyticsData.avgScore}
                  totalSpeedingEvents={analyticsData.totalSpeeding}
                  trends={analyticsData.trends}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white border-y border-[#EAEAEA]">
                <div className="p-4">
                  <DriversTrendChart data={analyticsData.trendData} />
                </div>
                <div className="p-4 border-l border-[#EAEAEA]">
                  <DriversFactorsChart data={analyticsData.factorData} />
                </div>
              </div>

              <div className="p-10">
                 <div className="premium-card rounded-lg overflow-hidden">
                    <DriversLeaderboard
                      drivers={drivers}
                      onDriverSelect={onDriverSelect}
                    />
                 </div>
              </div>
            </div>
          )}

          {activeTab === "drivers" && (
            <div className="animate-in fade-in duration-500 flex flex-col h-full px-10 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Column: Disponibles */}
                <div className="flex flex-col h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#F7F8FA] border border-[#EAEAEA] rounded-t-lg border-b-none">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A]" />
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Operadores Disponibles</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative group/search">
                        <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]/40 group-focus-within/search:text-[#1C1C1C]" />
                        <input
                          type="text"
                          placeholder="BUSCAR..."
                          value={availSearch}
                          onChange={(e) => setAvailSearch(e.target.value)}
                          className="h-8 w-40 bg-white border border-[#EAEAEA] rounded-md pl-9 pr-3 text-[10px] font-medium uppercase tracking-wider focus:border-[#1C1C1C] transition-all outline-none shadow-none"
                        />
                      </div>
                      <Badge className="bg-[#1C1C1C] text-[#D4F04A] font-medium h-6 px-3 border-none tabular-nums text-[10px] rounded-full">
                        {groups.available.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white border-x border-[#EAEAEA] border-b rounded-b-lg p-6 grid grid-cols-1 gap-4">
                    {groups.available.length > 0 ? (
                      groups.available.map(renderDriverCard)
                    ) : (
                      <div className="py-20 text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <Users2 strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin personal en standby</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column: En Servicio */}
                <div className="flex flex-col h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#F7F8FA] border border-[#EAEAEA] rounded-t-lg border-b-none">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Operadores en Servicio</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative group/search">
                        <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]/40 group-focus-within/search:text-[#1C1C1C]" />
                        <input
                          type="text"
                          placeholder="BUSCAR..."
                          value={assignSearch}
                          onChange={(e) => setAssignSearch(e.target.value)}
                          className="h-8 w-40 bg-white border border-[#EAEAEA] rounded-md pl-9 pr-3 text-[10px] font-medium uppercase tracking-wider focus:border-[#1C1C1C] transition-all outline-none shadow-none"
                        />
                      </div>
                      <Badge className="bg-blue-600 text-white font-medium h-6 px-3 border-none tabular-nums text-[10px] rounded-full">
                        {groups.assigned.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white border-x border-[#EAEAEA] border-b rounded-b-lg p-6 grid grid-cols-1 gap-4">
                    {groups.assigned.length > 0 ? (
                      groups.assigned.map(renderDriverCard)
                    ) : (
                      <div className="py-20 text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <Activity strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin actividad operativa</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

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
