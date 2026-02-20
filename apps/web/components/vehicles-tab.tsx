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
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetVehicle, VehicleType } from "@gis/shared";
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
    const maintenanceCount = fleetVehicles.filter((v) => (v as any).status === "maintenance").length;
    const availableCount = fleetVehicles.length - maintenanceCount;
    const totalConsumption = fleetVehicles.reduce((acc, v) => acc + ((v as any).fuelConsumption || 0), 0);
    const avgConsumption = fleetVehicles.length > 0 ? totalConsumption / fleetVehicles.length : 0;
    const utilizationRate = fleetVehicles.length > 0 ? Math.round((availableCount / fleetVehicles.length) * 100) : 0;

    return {
      totalVehicles: fleetVehicles.length,
      availableVehicles: availableCount,
      maintenanceVehicles: maintenanceCount,
      utilizationRate,
      avgConsumption,
      trendData: fleetVehicles.map(v => ({ name: v.label, utilization: 85, goal: 85 })),
      consumptionTrendData: [
        { name: "Lun", consumption: 7.8, goal: 7.5 },
        { name: "Mar", consumption: 8.2, goal: 7.5 },
        { name: "Mie", consumption: 7.4, goal: 7.5 },
        { name: "Jue", consumption: 9.1, goal: 7.5 },
        { name: "Vie", consumption: 8.5, goal: 7.5 },
        { name: "Sab", consumption: 7.9, goal: 7.5 },
        { name: "Dom", consumption: 7.2, goal: 7.5 },
      ],
      factorData: [
        { name: "Motor", impact: 60, color: "#0f172a" },
        { name: "Aerodinámica", impact: 40, color: "#334155" }
      ],
      leaderboardData: fleetVehicles.map((v, idx) => ({
        id: v.id,
        label: (v as any).licensePlate || v.label,
        value: (v as any).fuelConsumption || (8 + Math.random() * 10),
        mileage: (v as any).mileage || (idx * 2500 + 500),
        metric: "consumption" as const,
        status: (((v as any).fuelConsumption || 10) > 15 ? "critical" : "good") as "critical" | "good" | "warning"
      })),
      trends: {
        total: { value: "1", positive: true },
        available: { value: "2", positive: true },
        maintenance: { value: "0", positive: true },
        consumption: { value: "0.1", positive: true },
      }
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
      className="group bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <Truck className="h-5 w-5" />
          </div>
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
            (vehicle as any).status !== "maintenance" ? "bg-emerald-500" : "bg-amber-400"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-bold text-slate-900 truncate tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                {(vehicle as FleetVehicle).licensePlate || vehicle.label || vehicle.id}
              </h4>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                {(vehicle as FleetVehicle).brand || 'UNIT'} • {(vehicle as FleetVehicle).type.label}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
              <span className={cn(
                "text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit",
                (vehicle as FleetVehicle).status !== "maintenance" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {(vehicle as FleetVehicle).status !== "maintenance" ? 'Óptimo' : 'Mantenimiento'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Eficiencia</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-900 tabular-nums">72%</span>
                <div className="flex-1 h-1 bg-slate-100 rounded-full">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-600 tabular-nums truncate">
                {((vehicle as FleetVehicle).mileage || 0).toLocaleString()} km
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-600 tabular-nums truncate">
                {((vehicle as FleetVehicle).fuelConsumption || 0).toFixed(1)} L/100
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      <div className="shrink-0 bg-white border-b border-slate-100">
        <div className="px-6 py-6 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              HUB GLOBAL DE OPERACIONES
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              GESTIÓN DE ACTIVOS
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <PeriodSelector
              currentPeriod={currentPeriod}
              onPeriodChange={setCurrentPeriod}
            />
            {activeTab === "vehicles" && (
              <Button
                className="h-9 px-6 bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Añadir Unidad
              </Button>
            )}
          </div>
        </div>

        <VehiclesSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-slate-50/20">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              <VehiclesKPIStrip
                totalVehicles={analyticsData.totalVehicles}
                availableVehicles={analyticsData.availableVehicles}
                maintenanceVehicles={analyticsData.maintenanceVehicles}
                avgConsumption={analyticsData.avgConsumption}
                trends={analyticsData.trends}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white border-y border-slate-100">
                <VehiclesTrendChart data={analyticsData.trendData} />
                <VehiclesFactorsChart data={analyticsData.factorData} />
              </div>
              <VehiclesLeaderboard
                vehicles={analyticsData.leaderboardData}
                trendData={analyticsData.consumptionTrendData}
              />
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <VehiclesKPIStrip
                totalVehicles={analyticsData.totalVehicles}
                availableVehicles={analyticsData.availableVehicles}
                maintenanceVehicles={analyticsData.maintenanceVehicles}
                avgConsumption={analyticsData.avgConsumption}
                trends={analyticsData.trends}
              />

              <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Column: Available */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm max-h-[700px]">
                  <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Unidades Operativas</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{groups.available.length}</span>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {groups.available.length > 0 ? (
                        groups.available.map(renderVehicleCard)
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[9px] font-bold text-slate-300 uppercase italic">Sin unidades registradas</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Column: Maintenance */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm max-h-[700px]">
                  <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">En Taller / Revisión</span>
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{groups.maintenance.length}</span>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {groups.maintenance.length > 0 ? (
                        groups.maintenance.map(renderVehicleCard)
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[9px] font-bold text-slate-300 uppercase italic">Sin unidades en taller</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <Wrench className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Mantenimiento Predictivo</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">Este módulo se encuentra en fase de integración con telemetría avanzada.</p>
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
