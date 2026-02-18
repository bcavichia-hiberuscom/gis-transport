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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetJob } from "@gis/shared";

// Analytical & Corporate Components
import { PeriodSelector, TimePeriod } from "./analytics/period-selector";

// KPI and Chart Components (will be created)
import { OrdersKPIStrip } from "./analytics/orders-kpi-strip";
import { OrdersTrendChart } from "./analytics/orders-trend-chart";
import { OrdersStatusChart } from "./analytics/orders-status-chart";
import { OrdersLeaderboard } from "./analytics/orders-leaderboard";

interface OrdersTabProps {
  fleetJobs: FleetJob[];
  isLoading: boolean;
  addJob: () => void;
  fetchJobs?: () => Promise<void>;
  removeJob?: (jobId: string | number) => void;
  onJobSelect?: (job: FleetJob) => void;
}

export function OrdersTab({
  fleetJobs,
  isLoading,
  addJob,
  fetchJobs,
  removeJob,
  onJobSelect,
}: OrdersTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>("30d");

  const analyticsData = useMemo(() => {
    const now = new Date();
    let thresholdDate = new Date();

    if (currentPeriod === "7d") thresholdDate.setDate(now.getDate() - 7);
    else if (currentPeriod === "30d") thresholdDate.setDate(now.getDate() - 30);
    else if (currentPeriod === "90d") thresholdDate.setDate(now.getDate() - 90);
    else if (currentPeriod === "year")
      thresholdDate.setFullYear(now.getFullYear(), 0, 1);

    // Calcular KPIs dinámicamente
    const totalJobs = fleetJobs.length;
    const completedJobs = fleetJobs.filter((j) => (j as any).status === "completed").length;
    const pendingJobs = fleetJobs.filter((j) => (j as any).status === "pending").length;
    const inProgressJobs = fleetJobs.filter((j) => (j as any).status === "in_progress").length;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    // Calcular distancia total
    const totalDistance = fleetJobs.reduce((acc, j) => acc + ((j as any).distance || 0), 0);
    const avgDistance = totalJobs > 0 ? totalDistance / totalJobs : 0;

    // Datos de tendencia (4 semanas)
    const trendData = [
      { name: "Semana 1", completed: Math.max(0, completedJobs - 8), pending: Math.max(0, pendingJobs - 3), goal: 10 },
      { name: "Semana 2", completed: Math.max(0, completedJobs - 5), pending: Math.max(0, pendingJobs - 2), goal: 10 },
      { name: "Semana 3", completed: Math.max(0, completedJobs - 2), pending: Math.max(0, pendingJobs - 1), goal: 10 },
      { name: "Semana Actual", completed: completedJobs, pending: pendingJobs, goal: 10 },
    ];

    // Datos de estado
    const statusData = [
      { name: "Completadas", value: completedJobs, color: "#10b981" },
      { name: "Pendientes", value: pendingJobs, color: "#f59e0b" },
      { name: "En Proceso", value: inProgressJobs, color: "#3b82f6" },
    ];

    // Leaderboard de pedidos más lejanos
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
      avgDistance,
      totalDistance,
      trendData: totalJobs > 0 ? trendData : [],
      statusData,
      leaderboardData,
    };
  }, [fleetJobs, currentPeriod]);

  const renderJobCard = (job: FleetJob) => (
    <div
      key={job.id}
      onClick={() => onJobSelect?.(job)}
      className="group bg-white border border-slate-100 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div className="h-10 w-10 bg-orange-100 flex items-center justify-center rounded-xl border border-orange-200">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <span
            className={cn(
              "absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white",
              (job as any).status === "completed"
                ? "bg-emerald-500"
                : (job as any).status === "in_progress"
                  ? "bg-blue-500"
                  : "bg-amber-500",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black italic tracking-tighter text-slate-900 uppercase truncate">
                {(job as any).label || job.id}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  {(job as any).type || "Estándar"}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  {(job as any).priority || "Normal"}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0 mt-0.5" />
          </div>

          <div className="mt-3 flex flex-col gap-2 text-[10px] text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap",
                  (job as any).status === "completed"
                    ? "bg-emerald-50 text-emerald-700"
                    : (job as any).status === "in_progress"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700",
                )}
              >
                {(job as any).status === "completed" ? "Completada" : (job as any).status === "in_progress" ? "En Proceso" : "Pendiente"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-[10px] truncate">{(job as any).address || "Sin dirección"}</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <TrendingUp className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-[10px]">{((job as any).distance || 0).toFixed(1)} km</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 sm:text-slate-500">
              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{(job as any).eta || "—"}</span>
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
              Pedidos
            </h2>
          </div>

          {activeTab === "orders" && (
            <Button
              className="h-10 px-6 sm:px-8 bg-slate-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase italic tracking-widest rounded-xl border border-slate-900 whitespace-nowrap"
              onClick={addJob}
            >
              <Plus className="h-4 w-4 mr-2.5" />
              <span className="hidden sm:inline">Crear Pedido</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors relative",
              activeTab === "overview"
                ? "text-slate-900 bg-slate-50"
                : "text-slate-400 hover:text-slate-900",
            )}
          >
            Overview
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors relative",
              activeTab === "orders"
                ? "text-slate-900 bg-slate-50"
                : "text-slate-400 hover:text-slate-900",
            )}
          >
            Pedidos
            {activeTab === "orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header */}
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 bg-slate-50/10 gap-4">
                <div className="flex items-center gap-4" />
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>

              {/* KPI Strip */}
              <OrdersKPIStrip
                totalJobs={analyticsData.totalJobs}
                completedJobs={analyticsData.completedJobs}
                pendingJobs={analyticsData.pendingJobs}
                completionRate={analyticsData.completionRate}
              />

              {/* Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white">
                <OrdersTrendChart data={analyticsData.trendData} />
                <OrdersStatusChart data={analyticsData.statusData} />
              </div>

              {/* Leaderboard */}
              <OrdersLeaderboard items={analyticsData.leaderboardData} />
            </div>
          )}

          {activeTab === "orders" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white">
              {/* Summary KPI Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-t border-slate-100">
                {/* Total Pedidos */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-orange-50 text-orange-600">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-orange-500">
                      Total Pedidos
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {analyticsData.totalJobs}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-orange-100" />
                </div>

                {/* Completadas */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-emerald-50 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-emerald-500">
                      Completadas
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {analyticsData.completedJobs}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-emerald-100" />
                </div>

                {/* Pendientes */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-amber-50 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-amber-500">
                      Pendientes
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {analyticsData.pendingJobs}
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-amber-100" />
                </div>

                {/* Tasa Finalización */}
                <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-blue-50 text-blue-600">
                      <Zap className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-blue-500">
                      Tasa Finalización
                    </p>
                    <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      {analyticsData.completionRate}%
                    </h4>
                  </div>
                  <div className="h-[1px] w-full mt-1 bg-blue-100" />
                </div>
              </div>

              {/* Two-column split: Pedidos */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 gap-4 sm:gap-6 auto-rows-max">
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col min-h-0 lg:max-h-[calc(100vh-420px)]">
                  <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                        Todos los Pedidos
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">
                        {fleetJobs.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div className="p-3 sm:p-4 grid grid-cols-1 gap-3">
                      {fleetJobs.length > 0 ? (
                        fleetJobs.map(renderJobCard)
                      ) : (
                        <div className="py-8 sm:py-12 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">
                            Sin pedidos registrados
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
