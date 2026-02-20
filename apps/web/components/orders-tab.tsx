"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  ChevronRight,
  Package,
  Clock,
  MapPin,
  Zap,
  AlertTriangle,
  TrendingUp,
  Settings2,
  Users,
  ChevronDown,
  Truck,
  Activity,
} from "lucide-react";
import { cn, calculateDistance } from "@/lib/utils";
import type { FleetJob, FleetVehicle, RouteData, VehicleGroup, Zone } from "@gis/shared";

// Analytical & Corporate Components
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";

// KPI and Chart Components
import { OrdersKPIStrip } from "./analytics/orders-kpi-strip";
import { OrdersTrendChart } from "./analytics/orders-trend-chart";
import { OrdersStatusChart } from "./analytics/orders-status-chart";
import { OrdersLeaderboard } from "./analytics/orders-leaderboard";
import { AsignacionView } from "./analytics/assignment-view";

interface OrdersTabProps {
  fleetJobs: FleetJob[];
  fleetVehicles: FleetVehicle[];
  activeZones: Zone[];
  isLoading: boolean;
  routeData?: RouteData | null;
  isCalculatingRoute?: boolean;
  addJob: () => void;
  fetchJobs?: () => Promise<void>;
  removeJob?: (jobId: string | number) => void;
  setJobAssignments?: (assignments: { jobId: string | number; vehicleId?: string | number, groupId?: string | number }[]) => void;
  startRouting?: (overrides?: { vehicles?: FleetVehicle[], jobs?: FleetJob[] }) => Promise<any>;
  onJobSelect?: (job: FleetJob) => void;
  vehicleGroups?: VehicleGroup[];
  addVehicleGroup?: (name: string, vehicleIds?: (string | number)[]) => Promise<string | null>;
  removeVehicleGroup?: (groupId: string | number) => Promise<void>;
  toggleVehicleInGroup?: (groupId: string | number, vehicleId: string | number) => Promise<void>;
  updateVehicleGroupName?: (groupId: string | number, name: string) => Promise<void>;
}

export function OrdersTab({
  fleetJobs,
  fleetVehicles,
  activeZones,
  isLoading,
  routeData,
  isCalculatingRoute,
  addJob,
  fetchJobs,
  removeJob,
  setJobAssignments,
  startRouting,
  onJobSelect,
  vehicleGroups = [],
  addVehicleGroup,
  removeVehicleGroup,
  toggleVehicleInGroup,
  updateVehicleGroupName,
}: OrdersTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>("30d");
  const [visibleLogsJobId, setVisibleLogsJobId] = useState<string | number | null>(null);

  const analyticsData = useMemo(() => {
    const totalJobs = fleetJobs.length;
    const completedJobs = fleetJobs.filter((j) => (j as any).status === "completed").length;
    const pendingJobs = fleetJobs.filter((j) => (j as any).status === "pending").length;
    const inProgressJobs = fleetJobs.filter((j) => (j as any).status === "in_progress").length;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    const totalDistance = fleetJobs.reduce((acc, j) => acc + ((j as any).distance || 0), 0);

    const trendData = [
      { name: "Semana 1", completed: Math.max(0, completedJobs - 8), pending: Math.max(0, pendingJobs - 3), goal: 10 },
      { name: "Semana Actual", completed: completedJobs, pending: pendingJobs, goal: 10 },
    ];

    const statusData = [
      { name: "Completadas", value: completedJobs, color: "#10b981" },
      { name: "Pendientes", value: pendingJobs, color: "#f59e0b" },
      { name: "En Proceso", value: inProgressJobs, color: "#3b82f6" },
    ];

    const leaderboardData = fleetJobs
      .map((j) => ({
        id: j.id,
        label: (j as any).label || String(j.id),
        value: (j as any).distance || 0,
        metric: "distance" as const,
        status: (j as any).status === "completed" ? ("good" as const) : (j as any).status === "in_progress" ? ("warning" as const) : ("critical" as const),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalJobs,
      completedJobs,
      pendingJobs,
      inProgressJobs,
      completionRate,
      trendData: totalJobs > 0 ? trendData : [],
      statusData,
      leaderboardData,
      trends: {
        completed: { value: "5%", positive: true },
        total: { value: "12%", positive: true },
        pending: { value: "1", positive: false },
        sla: { value: "0.4%", positive: true },
      }
    };
  }, [fleetJobs, currentPeriod]);

  const renderJobCard = (job: FleetJob) => {
    const assignedVehicle = fleetVehicles.find(v => String(v.id) === String(job.assignedVehicleId));
    const assignedGroup = vehicleGroups.find(g => String(g.id) === String(job.assignedGroupId));
    const isLogsVisible = visibleLogsJobId === job.id;

    const distanceValue = job.distance ?? (
      (assignedVehicle && job.position)
        ? (calculateDistance(assignedVehicle.position, job.position) / 1000)
        : 0
    );
    const distanceFormatted = distanceValue > 0 ? `${distanceValue.toFixed(1)} km` : null;

    return (
      <div
        key={job.id}
        onClick={() => onJobSelect?.(job)}
        className="group bg-white border border-slate-100 rounded-lg p-5 hover:bg-slate-50/50 transition-all cursor-pointer relative"
      >
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-md border border-slate-200 text-[10px] font-black italic text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              {String((job as any).label || "PK").substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-[12px] font-black text-slate-900 truncate tracking-tighter uppercase group-hover:text-blue-600 transition-colors italic">
                    {(job as any).label || job.id}
                  </h4>
                  {(job as any).priority === "high" && (
                    <span className="h-4 px-1.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded flex items-center uppercase tracking-widest border border-rose-100 italic">CRITICAL</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] tabular-nums">
                    UNIT ID: {String(job.id).substring(0, 8)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-900 transition-transform group-hover:translate-x-1" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ASIGNACIÓN</span>
                {assignedVehicle ? (
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase italic truncate">{assignedVehicle.label}</span>
                  </div>
                ) : assignedGroup ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase italic truncate">{assignedGroup.name}</span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 uppercase italic italic">POOL ABIERTO</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RESPONSABLE</span>
                {assignedVehicle?.driver ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase italic truncate">{assignedVehicle.driver.name}</span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 uppercase italic">PENDIENTE</span>
                )}
              </div>
            </div>

            {(distanceFormatted || job.eta) && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-slate-300" />
                  <span className="text-[9px] font-black text-slate-500 tracking-tighter uppercase tabular-nums">{distanceFormatted || "N/A KM"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tabular-nums">{job.eta || "09:00"}</span>
                  </div>
                  {(job as any).status === "completed" && (
                    <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Zap className="h-2 w-2 text-emerald-600 fill-emerald-600" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      <div className="shrink-0 bg-white border-b border-slate-100">
        <div className="px-8 py-8 flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              Despacho y Control Operativo
            </h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Monitoreo de Carga y Auditoría de Distribución
            </p>
          </div>

          <div className="flex items-center gap-4">
            <PeriodSelector currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />
            {activeTab === "orders" && (
              <Button
                className="h-10 px-6 bg-slate-950 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-slate-100 transition-all border-b-2 border-slate-800"
                onClick={addJob}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Registrar Pedido
              </Button>
            )}
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-8 gap-10">
          {["overview", "orders", "assignment"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
                activeTab === tab
                  ? "text-slate-900 font-black"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Settings2 className={cn("h-3.5 w-3.5", activeTab === tab ? "text-slate-950" : "text-slate-400")} />
              {tab === "overview" ? "Analytics" : tab === "orders" ? "Gestión" : "Asignación"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-white">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 bg-slate-50/10">
              <OrdersKPIStrip
                totalJobs={analyticsData.totalJobs}
                completedJobs={analyticsData.completedJobs}
                pendingJobs={analyticsData.pendingJobs}
                completionRate={analyticsData.completionRate}
                trends={analyticsData.trends}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white border-y border-slate-100 divide-x divide-slate-100">
                <OrdersTrendChart data={analyticsData.trendData} />
                <OrdersStatusChart data={analyticsData.statusData} />
              </div>
              <OrdersLeaderboard items={analyticsData.leaderboardData} />
            </div>
          )}

          {activeTab === "orders" && (
            <div className="flex-1 flex flex-col min-h-full bg-white relative">
              {/* Subtle tech grid background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              {fleetJobs.length === 0 ? (
                <div
                  onClick={addJob}
                  className="flex-1 flex flex-col items-center justify-center p-20 cursor-pointer group animate-in fade-in duration-300 relative z-10"
                >
                  <div className="relative mb-8 transition-transform duration-300">
                    <Package className="h-24 w-24 text-slate-100 group-hover:text-slate-200 transition-colors" />
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-white border border-slate-100 text-slate-300 rounded-lg flex items-center justify-center group-hover:text-blue-600 group-hover:border-blue-100 group-hover:shadow-md transition-all">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-300 group-hover:text-slate-900 transition-colors">
                      No hay pedidos asignados
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm leading-relaxed transition-colors group-hover:text-blue-600">
                      Crea el primero
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 space-y-8 relative z-10 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-12 items-start">
                    {/* Columna: Pool de Pendientes */}
                    <div className="bg-white rounded-none border-0 flex flex-col max-h-[calc(100vh-340px)] relative">
                      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-900 pb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Pool de Pendientes</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Esperando auditoría logística</p>
                        </div>
                        <span className="text-[10px] font-black tabular-nums bg-slate-900 text-white px-2 py-0.5 rounded tracking-tighter">
                          {fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId).length}
                        </span>
                      </div>

                      <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-3 pb-10">
                          {fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId).length > 0 ? (
                            fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId).map(renderJobCard)
                          ) : (
                            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl opacity-40">
                              <Package className="h-10 w-10 text-slate-300 mb-3" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sin carga pendiente</span>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Columna: Asignaciones en Curso */}
                    <div className="bg-white rounded-none border-0 flex flex-col max-h-[calc(100vh-340px)] relative">
                      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-200 pb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Asignaciones Activas</span>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Flota en movimiento o preparada</p>
                        </div>
                        <span className="text-[10px] font-black tabular-nums bg-slate-100 text-slate-600 px-2 py-0.5 rounded tracking-tighter border border-slate-200">
                          {fleetJobs.filter(j => !!j.assignedVehicleId || !!j.assignedGroupId).length}
                        </span>
                      </div>

                      <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-3 pb-10">
                          {fleetJobs.filter(j => !!j.assignedVehicleId || !!j.assignedGroupId).length > 0 ? (
                            fleetJobs.filter(j => !!j.assignedVehicleId || !!j.assignedGroupId).map(renderJobCard)
                          ) : (
                            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl opacity-40">
                              <Truck className="h-10 w-10 text-slate-300 mb-3" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sin flota activa</span>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "assignment" && (
            <div className="flex-1">
              <AsignacionView
                fleetJobs={fleetJobs}
                fleetVehicles={fleetVehicles}
                activeZones={activeZones}
                setJobAssignments={setJobAssignments || (() => { })}
                startRouting={startRouting || (async () => { })}
                isCalculatingRoute={isCalculatingRoute}
                vehicleGroups={vehicleGroups}
                addVehicleGroup={addVehicleGroup}
                removeVehicleGroup={removeVehicleGroup}
                toggleVehicleInGroup={toggleVehicleInGroup}
                updateVehicleGroupName={updateVehicleGroupName}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
