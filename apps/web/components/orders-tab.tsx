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
  Navigation,
  Flame,
  MousePointer2,
  Gauge,
  Workflow,
  Sparkles,
  Route,
  Layers
} from "lucide-react";
import { cn, calculateDistance } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  startRouting?: (overrides?: { vehicles?: FleetVehicle[], jobs?: FleetJob[], preference?: "fastest" | "shortest" | "recommended", traffic?: boolean }) => Promise<any>;
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
  const [activeTab, setActiveTab] = useState(fleetJobs.length === 0 ? "orders" : "overview");
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
      { name: "Completadas", value: completedJobs, color: "#D4F04A" },
      { name: "Pendientes", value: pendingJobs, color: "#6B7280" },
      { name: "En Proceso", value: inProgressJobs, color: "#1C1C1C" },
    ];

    const leaderboardData = fleetJobs
      .map((j) => {
        const isCompleted = (j as any).status === "completed";
        const isInProgress = (j as any).status === "in_progress";
        return {
          id: j.id,
          label: (j as any).label || `ORD-${String(j.id).padStart(3, '0')}`,
          value: (j as any).distance || 15.5,
          metric: "time" as const,
          status: isCompleted ? ("good" as const) : isInProgress ? ("warning" as const) : ("critical" as const),
        };
      })
      .sort((a, b) => (a.status === "critical" ? 1 : 0) - (b.status === "critical" ? 1 : 0) || b.value - a.value)
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
        className="premium-card p-5 group flex flex-col gap-4 border-[#EAEAEA] hover:border-[#D4F04A]/40 transition-all bg-white cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-[#F7F8FA] flex items-center justify-center rounded-lg border border-[#EAEAEA] text-[10px] font-medium text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C] transition-all shrink-0">
              {String((job as any).label || "PK").substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-medium text-[#1C1C1C] truncate tracking-tight">
                  {(job as any).label || job.id}
                </h4>
                {(job as any).priority === "high" && (
                  <span className="h-4 px-1.5 bg-red-50 text-red-700 text-[8px] font-medium rounded border border-red-100 flex items-center tracking-wider">CRÍTICO</span>
                )}
              </div>
              <span className="text-[9px] font-medium text-[#6B7280]/60 tabular-nums uppercase tracking-widest mt-0.5">
                ID: {String(job.id).substring(0, 8)}
              </span>
            </div>
          </div>
          <ChevronRight strokeWidth={1.5} className="h-4 w-4 text-[#6B7280]/40 group-hover:text-[#1C1C1C] transition-all group-hover:translate-x-0.5" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F7F8FA]">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Asignación</span>
            {assignedVehicle ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A]" />
                <span className="text-[11px] font-medium text-[#1C1C1C] truncate">{assignedVehicle.label}</span>
              </div>
            ) : assignedGroup ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-[11px] font-medium text-[#1C1C1C] truncate">{assignedGroup.name}</span>
              </div>
            ) : (
              <span className="text-[10px] font-normal text-[#6B7280]/40 uppercase">Pendiente</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Planificación</span>
            <div className="flex items-center gap-1.5">
              <Clock strokeWidth={1.5} className="h-3 w-3 text-[#6B7280]/60" />
              <span className="text-[11px] font-medium text-[#1C1C1C] tabular-nums">
                {(job as any).status === "completed" ? "Finalizado" : (job.eta || "En cola")}
              </span>
            </div>
          </div>
        </div>

        {distanceFormatted && (
          <div className="pt-3 border-t border-[#F7F8FA] flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Navigation strokeWidth={1.5} className="h-3 w-3 text-[#6B7280]/40" />
                <span className="text-[10px] font-medium text-[#6B7280] tabular-nums">{distanceFormatted}</span>
             </div>
             {(job as any).status === "completed" && (
                <div className="flex items-center gap-1.5 bg-[#D4F04A]/10 px-2 py-0.5 rounded border border-[#D4F04A]/20">
                  <Zap className="h-2.5 w-2.5 text-[#5D6B1A]" />
                  <span className="text-[9px] font-medium text-[#5D6B1A] tracking-tight">SLA OK</span>
                </div>
             )}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="flex flex-col grow h-full bg-white animate-in fade-in duration-500">
      <div className="shrink-0 border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex items-center justify-between gap-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <Package strokeWidth={1.5} className="h-5 w-5" />
              Gestión de Pedidos
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Planificación operativa y optimización dinámica de la cadena de suministro.
            </p>
          </div>

          <div className="flex items-center gap-6">
            {activeTab === "orders" && (
              <Button
                className="h-10 px-6 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white font-medium text-[12px] uppercase tracking-wider rounded-md transition-all shadow-none border-none"
                onClick={addJob}
              >
                <Plus strokeWidth={1.5} className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            )}
          </div>
        </div>

        <div className="flex px-10 gap-8">
          {[
            { id: "overview", label: "Analytics", icon: Activity },
            { id: "orders", label: "Gestión", icon: Layers },
            { id: "assignment", label: "Asignación", icon: Workflow }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-4 text-[11px] font-medium tracking-wider uppercase transition-all relative flex items-center gap-2",
                  isActive
                    ? "text-[#1C1C1C]"
                    : "text-[#6B7280] hover:text-[#1C1C1C]"
                )}
              >
                <tab.icon strokeWidth={isActive ? 2 : 1.5} className={cn("h-4 w-4 transition-all", isActive ? "text-[#1C1C1C] scale-110" : "text-[#6B7280]/60")} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1C1C1C] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-white">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in duration-500 p-10 space-y-10">
              <div className="flex justify-end mb-6">
                <PeriodSelector currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />
              </div>
              <OrdersKPIStrip
                totalJobs={analyticsData.totalJobs}
                completedJobs={analyticsData.completedJobs}
                pendingJobs={analyticsData.pendingJobs}
                completionRate={analyticsData.completionRate}
                trends={analyticsData.trends}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 premium-card rounded-lg overflow-hidden border-[#EAEAEA] divide-x divide-[#EAEAEA] bg-white p-4">
                <OrdersTrendChart data={analyticsData.trendData} />
                <OrdersStatusChart data={analyticsData.statusData} />
              </div>
              <OrdersLeaderboard items={analyticsData.leaderboardData} />
            </div>
          )}

          {activeTab === "orders" && (
            <div className="flex-1 flex flex-col min-h-full bg-white relative px-10 pt-10 pb-20">
              {fleetJobs.length === 0 ? (
                <div className="flex flex-col gap-10 relative z-10 p-4">
                   <div 
                    onClick={addJob}
                    className="flex flex-col items-center justify-center p-24 border-2 border-dashed border-[#EAEAEA] bg-[#F7F8FA] rounded-xl group transition-all cursor-pointer hover:border-[#D4F04A]/60"
                  >
                    <div className="relative mb-8">
                      <Package strokeWidth={1.25} className="h-16 w-16 text-[#6B7280]/20 group-hover:scale-105 transition-all group-hover:text-[#1C1C1C]" />
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#1C1C1C] text-[#D4F04A] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                        <Plus strokeWidth={1.5} className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-base font-medium tracking-tight text-[#1C1C1C] uppercase mb-2">
                       Protocolo Despachador Vacío
                    </h3>
                    <p className="text-[11px] font-normal text-[#6B7280] text-center max-w-sm leading-relaxed">
                      No se han detectado órdenes en el sistema. Inicie una nueva operación para activar los algoritmos de optimización.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Columna: Pool de Pendientes */}
                  <div className="flex flex-col h-full bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6B7280]/20" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#6B7280]" />
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">Pedidos Pendientes</h3>
                      </div>
                      <Badge className="bg-[#F7F8FA] text-[#6B7280] h-6 px-3 border border-[#EAEAEA] font-bold tabular-nums rounded text-[10px]">
                        {fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId && (j as any).status !== "completed").length}
                      </Badge>
                    </div>

                    <div className="flex-1 p-4 bg-[#F7F8FA]/50 flex flex-col gap-4 overflow-y-auto">
                      {fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId && (j as any).status !== "completed").length > 0 ? (
                        fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId && (j as any).status !== "completed").map(renderJobCard)
                      ) : (
                        <div className="py-20 text-center bg-white rounded-md border border-dashed border-[#EAEAEA] flex flex-col items-center justify-center h-full">
                          <Package strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mb-3" />
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Cola Vacía</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna: En Tránsito */}
                  <div className="flex flex-col h-full bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1C1C1C]" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#1C1C1C] outline outline-2 outline-offset-1 outline-[#EAEAEA]" />
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">En Tránsito</h3>
                      </div>
                      <Badge className="bg-[#1C1C1C] text-[#D4F04A] h-6 px-3 border border-[#1C1C1C] font-bold tabular-nums rounded text-[10px]">
                        {fleetJobs.filter(j => (!!j.assignedVehicleId || !!j.assignedGroupId) && (j as any).status !== "completed").length}
                      </Badge>
                    </div>

                    <div className="flex-1 p-4 bg-[#F7F8FA]/50 flex flex-col gap-4 overflow-y-auto">
                      {fleetJobs.filter(j => (!!j.assignedVehicleId || !!j.assignedGroupId) && (j as any).status !== "completed").length > 0 ? (
                        fleetJobs.filter(j => (!!j.assignedVehicleId || !!j.assignedGroupId) && (j as any).status !== "completed").map(renderJobCard)
                      ) : (
                        <div className="py-20 text-center bg-white rounded-md border border-dashed border-[#EAEAEA] flex flex-col items-center justify-center h-full">
                          <Truck strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mb-3" />
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin Actividad</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna: Completados */}
                  <div className="flex flex-col h-full bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4F04A]" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A]" />
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">Finalizados</h3>
                      </div>
                      <Badge className="bg-[#D4F04A]/10 text-[#5D6B1A] border-[#D4F04A]/20 h-6 px-3 font-bold tabular-nums rounded text-[10px]">
                        {fleetJobs.filter(j => (j as any).status === "completed").length}
                      </Badge>
                    </div>

                    <div className="flex-1 p-4 bg-[#F7F8FA]/50 flex flex-col gap-4 overflow-y-auto">
                      {fleetJobs.filter(j => (j as any).status === "completed").length > 0 ? (
                        fleetJobs.filter(j => (j as any).status === "completed").map(renderJobCard)
                      ) : (
                        <div className="py-20 text-center bg-white rounded-md border border-dashed border-[#EAEAEA] flex flex-col items-center justify-center h-full">
                          <Zap strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mb-3" />
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin Historial</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "assignment" && (
            <div className="flex-1 animate-in fade-in duration-500">
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
