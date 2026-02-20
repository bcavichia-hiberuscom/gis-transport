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
            color: "#0f172a",
          },
          {
            name: "Demoras en Entrega",
            impact: Math.round(100 - avgScore),
            color: "#334155",
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
        active: { value: "3", positive: true }, // Mock based on recent logins
        score: { value: "0.8%", positive: true }, // Mock
        alerts: { value: "1", positive: false }, // Mock
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

  // Two-column layout doesn't need local collapse state

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      onClick={() => onDriverSelect?.(driver)}
      className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-200 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="h-12 w-12 bg-slate-50/50 flex items-center justify-center rounded-2xl overflow-hidden border border-slate-100/50 group-hover:bg-slate-50 transition-colors">
            {driver.imageUrl ? (
              <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-400">{driver.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className={cn(
            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm",
            driver.isAvailable ? "bg-emerald-500" : "bg-blue-500"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">{driver.name}</h4>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {driver.licenseType || 'Class B'} • ID: {driver.id.substring(0, 8)}
              </p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</span>
              <span className={cn(
                "w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                driver.isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              )}>
                {driver.isAvailable ? 'Disponible' : 'En Servicio'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguridad</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[11px] font-bold tabular-nums",
                  ((driver as any).safetyScore || 95) < 85 ? "text-rose-600" : "text-slate-900"
                )}>
                  {(driver as any).safetyScore || 95}/100
                </span>
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(driver as any).safetyScore || 95}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100">
                <Truck className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Unidad</span>
                <span className="text-[11px] font-medium text-slate-600 truncate">
                  {fleetVehicles.find((v) => v.id === (driver as any).vehicleId)?.type?.label ?? 'Sin Vincular'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Turno</span>
                <span className="text-[11px] font-medium text-slate-600">{(driver as any).activeHoursToday ?? '0.0'}h / 8h</span>
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
      <div className="shrink-0 bg-white border-b border-slate-100">
        <div className="px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Gestión Operativa
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Drivers & Fleet Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "drivers" && (
              <Button
                className="h-9 px-5 bg-slate-900 text-white hover:bg-black transition-all text-[9px] font-black uppercase italic tracking-widest rounded-xl border border-slate-900"
                onClick={() => setIsAddOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Registrar
              </Button>
            )}
          </div>
        </div>

        <DriversSubNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={activeTab === "overview" ? (
            <PeriodSelector
              currentPeriod={currentPeriod}
              onPeriodChange={setCurrentPeriod}
            />
          ) : null}
        />
      </div>

      <div className="flex-1 min-h-0">
        <div className="flex flex-col h-full">
          {activeTab === "overview" && (
            <ScrollArea className="h-full">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DriversKPIStrip
                  activeDriversCount={analyticsData.activeDriversCount}
                  avgScore={analyticsData.avgScore}
                  totalSpeedingEvents={analyticsData.totalSpeeding}
                  trends={analyticsData.trends}
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
            </ScrollArea>
          )}

          {activeTab === "drivers" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white flex flex-col h-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              {/* Two-column split: Disponibles | En Servicio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0">
                {/* Column: Disponibles */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-slate-50/5 hover:border-slate-200 transition-all shadow-sm h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-6 bg-white border-b border-slate-100/60 relative overflow-hidden group/header">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    <div className="flex flex-col gap-0.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Disponibles</h3>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter pl-3.5">Listos para Operar</p>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="relative group/search">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={availSearch}
                          onChange={(e) => setAvailSearch(e.target.value)}
                          className="h-8 w-32 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-2 text-[10px] font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Activity className="h-3 w-3 text-slate-400" />
                        <select
                          className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0 cursor-pointer uppercase tracking-tighter"
                          value={availMinScore}
                          onChange={(e) => setAvailMinScore(Number(e.target.value))}
                        >
                          <option value="0">Score</option>
                          <option value="90">&gt; 90</option>
                          <option value="80">&gt; 80</option>
                          <option value="70">&gt; 70</option>
                        </select>
                      </div>

                      <div className="ml-2 flex flex-col items-end border-l border-slate-100 pl-4">
                        <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">
                          {String(groups.available.length).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div className="p-3 sm:p-4 grid grid-cols-1 gap-3 pb-10">
                      {groups.available.length > 0 ? (
                        groups.available.map(renderDriverCard)
                      ) : (
                        <div className="py-8 sm:py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">No se detecta personal disponible</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column: En Servicio */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-slate-50/5 hover:border-slate-200 transition-all shadow-sm h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-6 bg-white border-b border-slate-100/60 relative overflow-hidden group/header">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    <div className="flex flex-col gap-0.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">En Servicio</h3>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter pl-3.5">En Operación</p>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="relative group/search">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={assignSearch}
                          onChange={(e) => setAssignSearch(e.target.value)}
                          className="h-8 w-32 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-2 text-[10px] font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Activity className="h-3 w-3 text-slate-400" />
                        <select
                          className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0 cursor-pointer uppercase tracking-tighter"
                          value={assignMinScore}
                          onChange={(e) => setAssignMinScore(Number(e.target.value))}
                        >
                          <option value="0">Score</option>
                          <option value="90">&gt; 90</option>
                          <option value="80">&gt; 80</option>
                          <option value="70">&gt; 70</option>
                        </select>
                      </div>

                      <div className="ml-2 flex flex-col items-end border-l border-slate-100 pl-4">
                        <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">
                          {String(groups.assigned.length).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div className="p-3 sm:p-4 grid grid-cols-1 gap-3 pb-10">
                      {groups.assigned.length > 0 ? (
                        groups.assigned.map(renderDriverCard)
                      ) : (
                        <div className="py-8 sm:py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">Sin actividad operativa registrada</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
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
