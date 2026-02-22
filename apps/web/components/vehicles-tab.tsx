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
import { Badge } from "@/components/ui/badge";
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
        { name: "Motor", impact: 60, color: "#1C1C1C" },
        { name: "Aerodinámica", impact: 40, color: "#6B7280" }
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
      className="premium-card p-5 cursor-pointer group border-[#EAEAEA] hover:border-[#D4F04A]/40 transition-all bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="h-10 w-10 bg-[#F7F8FA] flex items-center justify-center rounded-lg border border-[#EAEAEA] transition-all group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C]">
            <Truck strokeWidth={1.5} className="h-5 w-5" />
          </div>
          <span className={cn(
            "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
            (vehicle as any).status !== "maintenance" ? "bg-[#D4F04A]" : "bg-[#6B7280]"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-medium tracking-tight text-[#1C1C1C] truncate leading-tight">
                {(vehicle as FleetVehicle).licensePlate || vehicle.label || vehicle.id}
              </h4>
              <p className="text-[10px] font-medium text-[#6B7280] mt-0.5 uppercase tracking-wide">
                {(vehicle as FleetVehicle).brand || 'GLOBAL'} • {(vehicle as FleetVehicle).type.label}
              </p>
            </div>
            <div className="h-7 w-7 rounded-md bg-[#F7F8FA] flex items-center justify-center text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] transition-all">
               <ChevronRight strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Estado</span>
              <span className={cn(
                "text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border w-fit",
                (vehicle as FleetVehicle).status !== "maintenance" ? "bg-[#D4F04A]/10 text-[#5D6B1A] border-[#D4F04A]/20" : "bg-[#F7F8FA] text-[#6B7280] border-[#EAEAEA]"
              )}>
                {(vehicle as FleetVehicle).status !== "maintenance" ? 'OPERATIVO' : 'MANTENIMIENTO'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider">Rendimiento</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#1C1C1C] tabular-nums">72%</span>
                <div className="flex-1 h-1 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#EAEAEA]">
                  <div className="h-full bg-[#1C1C1C] rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F7F8FA] grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-[#F7F8FA] flex items-center justify-center rounded-md border border-[#EAEAEA]">
                <Gauge strokeWidth={1.5} className="h-3.5 w-3.5 text-[#6B7280]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-medium text-[#6B7280] uppercase tracking-wider">Km Totales</span>
                <span className="text-[10px] font-medium text-[#1C1C1C] tabular-nums">
                  {((vehicle as FleetVehicle).mileage || 0).toLocaleString()} <span className="text-[8px] ml-0.5">km</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-[#F7F8FA] flex items-center justify-center rounded-md border border-[#EAEAEA]">
                <Zap strokeWidth={1.5} className="h-3.5 w-3.5 text-[#6B7280]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-medium text-[#6B7280] uppercase tracking-wider">Consumo</span>
                <span className="text-[10px] font-medium text-[#1C1C1C] tabular-nums">
                  {((vehicle as FleetVehicle).fuelConsumption || 0).toFixed(1)} <span className="text-[8px] ml-0.5">L/100</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col grow h-full bg-white animate-in fade-in duration-500">
      <div className="shrink-0 border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <Truck strokeWidth={1.5} className="h-5 w-5" />
              Gestión de Flota
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Monitoreo centralizado de activos críticos y telemetría avanzada.
            </p>
          </div>

          {activeTab === "vehicles" && (
            <Button
              className="h-10 px-6 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white text-[12px] font-medium uppercase tracking-wider rounded-md transition-all shadow-none border-none"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus strokeWidth={1.5} className="h-4 w-4 mr-2" />
              Registrar Unidad
            </Button>
          )}
        </div>

        <VehiclesSubNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-white">
        <div className="flex flex-col">
          {activeTab === "overview" && (
            <div className="animate-in fade-in duration-500">
              <div className="px-10 pt-10 pb-6 flex justify-end">
                <PeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={setCurrentPeriod}
                />
              </div>
              <div className="px-10 pb-10">
                <VehiclesKPIStrip
                  totalVehicles={analyticsData.totalVehicles}
                  availableVehicles={analyticsData.availableVehicles}
                  maintenanceVehicles={analyticsData.maintenanceVehicles}
                  avgConsumption={analyticsData.avgConsumption}
                  trends={analyticsData.trends}
                />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 bg-white border-y border-[#EAEAEA] p-4 divide-x divide-[#EAEAEA]">
                <div className="p-4">
                  <VehiclesTrendChart data={analyticsData.trendData} />
                </div>
                <div className="p-4">
                  <VehiclesFactorsChart data={analyticsData.factorData} />
                </div>
              </div>
              
              <div className="p-10">
                 <div className="premium-card rounded-lg overflow-hidden border-[#EAEAEA]">
                    <VehiclesLeaderboard
                      vehicles={analyticsData.leaderboardData}
                      trendData={analyticsData.consumptionTrendData}
                    />
                 </div>
              </div>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="animate-in fade-in duration-500 flex flex-col h-full px-10 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start pb-16">
                {/* Column: Available */}
                <div className="flex flex-col h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#F7F8FA] border border-[#EAEAEA] rounded-t-lg border-b-none">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A]" />
                      <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Unidades en Servicio</h3>
                    </div>
                    <Badge className="bg-[#1C1C1C] text-[#D4F04A] font-medium h-6 px-3 border-none tabular-nums text-[10px] rounded-full">
                      {groups.available.length}
                    </Badge>
                  </div>
                  <div className="bg-white border-x border-[#EAEAEA] border-b rounded-b-lg p-6 flex flex-col gap-4">
                    {groups.available.length > 0 ? (
                      groups.available.map(renderVehicleCard)
                    ) : (
                      <div className="py-20 text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <Truck strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin unidades registradas</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column: Maintenance */}
                <div className="flex flex-col h-full">
                  <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#F7F8FA] border border-[#EAEAEA] rounded-t-lg border-b-none">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#6B7280]/40" />
                      <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">En Mantenimiento</h3>
                    </div>
                    <Badge className="bg-[#6B7280] text-white font-medium h-6 px-3 border-none tabular-nums text-[10px] rounded-full">
                      {groups.maintenance.length}
                    </Badge>
                  </div>
                  <div className="bg-white border-x border-[#EAEAEA] border-b rounded-b-lg p-6 flex flex-col gap-4">
                    {groups.maintenance.length > 0 ? (
                      groups.maintenance.map(renderVehicleCard)
                    ) : (
                      <div className="py-20 text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <Wrench strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin unidades en taller</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="animate-in fade-in duration-200 p-10">
              <div className="premium-card p-16 text-center border-[#EAEAEA] bg-[#F7F8FA] rounded-lg">
                <Wrench strokeWidth={1} className="h-12 w-12 text-[#6B7280]/20 mx-auto mb-6" />
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#1C1C1C] mb-2">Mantenimiento Predictivo</h3>
                <p className="text-[#6B7280] text-[12px] font-normal max-w-xs mx-auto leading-relaxed">Sincronización de telemetría y análisis de ciclos de vida en proceso.</p>
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
