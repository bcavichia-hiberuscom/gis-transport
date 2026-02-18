"use client";
// components/fleet-dashboard.tsx
//
// Fleet Monitoring Dashboard with real-time KPIs and vehicle table.

import { useMemo, useEffect, useRef, memo } from "react";
import type { POI, FleetVehicle, FleetJob, Driver } from "@gis/shared";
import type { Alert } from "@/lib/utils";
import { useAlertLogs } from "@/hooks/use-alert-logs";
import { getAlertStyles } from "@/lib/utils";

import {
  Battery,
  Fuel,
  Truck,
  ChevronRight,
  Route,
  Package,
  AlertTriangle,
  CheckCircle2,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddGasStationDialog } from "./add-gas-station-dialog";
import { VehicleDetailSheet } from "./vehicle-detail-sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

import dynamic from "next/dynamic";
const MapPreview = dynamic(() => import("./map-preview"), { ssr: false });
import type { RouteData } from "@gis/shared";

interface FleetDashboardProps {
  vehicles: FleetVehicle[];
  jobs?: FleetJob[];
  vehicleAlerts?: Record<string | number, Alert[]>;
  isTracking?: boolean;
  addStopToVehicle?: (
    vehicleId: string | number,
    position: [number, number],
    label?: string,
    eta?: string,
  ) => void;
  startRouting?: () => void;
  isAddStopOpen?: boolean;
  setIsAddStopOpen?: (open: boolean) => void;
  onStartPickingStop?: () => void;
  pickedStopCoords?: [number, number] | null;
  onAddStopSubmit?: (coords: [number, number], label: string, eta?: string) => void;
  drivers?: Driver[];
  selectedVehicleId?: string | number | null;
  onSelectVehicle?: (id: string | number | null) => void;
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
  gasStations?: POI[];
  isGasStationLayerVisible?: boolean;
  onToggleGasStationLayer?: () => void;
  routeData?: RouteData | null;
}

const AlertLogsSection = ({ vehicleId, vehicleLabel }: { vehicleId: string | number | null; vehicleLabel?: string }) => {
  const { getVehicleLogs } = useAlertLogs();
  const logs = useMemo(() => (vehicleId ? getVehicleLogs(vehicleId) : []), [vehicleId, getVehicleLogs]);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Alertas y Seguridad</span>
        <Badge variant="secondary" className="text-[10px] font-medium">Historial</Badge>
      </div>
      <div className="flex-1 relative min-h-0">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-2">
            {vehicleId && logs.length > 0 ? (
              logs.map((log, idx) => {
                const styles = getAlertStyles(log.severity as any);
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div key={`${log.id}-${idx}`} className={cn("flex gap-3 p-3 border rounded-md transition-all", styles.bg, styles.border)}>
                    <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", styles.badge.split(' ')[0])}>
                      <AlertTriangle className={cn("h-3.5 w-3.5", styles.icon)} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[11px] font-medium", styles.icon)}>{log.alertTitle}</span>
                        <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 mt-0.5 leading-relaxed">{log.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-8 w-8 text-emerald-600/40 mb-2" />
                <p className="text-xs text-muted-foreground">{vehicleId ? "Sin alertas registradas" : "Seleccione un vehiculo"}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export const FleetDashboard = memo(function FleetDashboard({
  vehicles,
  jobs = [],
  vehicleAlerts = {},
  isTracking,
  addStopToVehicle,
  startRouting,
  isAddStopOpen,
  setIsAddStopOpen,
  onStartPickingStop,
  pickedStopCoords,
  onAddStopSubmit,
  drivers,
  selectedVehicleId,
  onSelectVehicle,
  onAssignDriver,
  gasStations = [],
  isGasStationLayerVisible,
  onToggleGasStationLayer,
  routeData,
}: FleetDashboardProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | number | null>(selectedVehicleId ?? null);

  useEffect(() => {
    setLocalSelectedId(selectedVehicleId ?? null);
  }, [selectedVehicleId]);

  const [dashboardIsAddStopOpen, setDashboardIsAddStopOpen] = useState(false);
  const waitingForPickRef = useRef(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<"all" | "standard" | "custom">("all");
  const [vehicleAssignmentFilter, setVehicleAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all");

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(localSelectedId)) || null,
    [vehicles, localSelectedId],
  );

  useEffect(() => {
    if (pickedStopCoords && waitingForPickRef.current && localSelectedId) {
      setDashboardIsAddStopOpen(true);
      waitingForPickRef.current = false;
    }
  }, [pickedStopCoords, localSelectedId]);

  const handleStartPickingStop = () => {
    waitingForPickRef.current = true;
    setDashboardIsAddStopOpen(false);
    onStartPickingStop?.();
  };

  const sortedGasStations = useMemo(() => {
    return [...gasStations].sort((a, b) => {
      const priceA = a.prices?.diesel || a.prices?.gasoline95 || 0;
      const priceB = b.prices?.diesel || b.prices?.gasoline95 || 0;
      return priceA - priceB;
    });
  }, [gasStations]);

  const [showAllGasStations, setShowAllGasStations] = useState(false);
  const [selectedGasStation, setSelectedGasStation] = useState<POI | null>(null);
  const [isGasStationDialogOpen, setIsGasStationDialogOpen] = useState(false);

  const displayedGasStations = useMemo(() => {
    return showAllGasStations ? sortedGasStations : sortedGasStations.slice(0, 5);
  }, [sortedGasStations, showAllGasStations]);

  const handleRowClick = (vehicleId: string | number) => {
    setLocalSelectedId(vehicleId);
    onSelectVehicle?.(vehicleId);
  };

  const kpis = useMemo(() => {
    const activeCount = vehicles.filter((v) => v.metrics?.status === "active").length;
    const onRouteCount = vehicles.filter((v) => v.metrics?.movementState === "on_route").length;
    const alertsCount = vehicles.filter((v) => v.id && vehicleAlerts[v.id]?.length > 0).length;
    const hasElectricVehicles = vehicles.some((v) => v.type.id.includes("electric") || v.type.id === "zero");
    const hasFuelVehicles = vehicles.some((v) => !v.type.id.includes("electric") && v.type.id !== "zero");
    const fuelLevels = vehicles.filter(v => v.metrics?.fuelLevel !== undefined).map(v => v.metrics!.fuelLevel!);
    const batteryLevels = vehicles.filter(v => v.metrics?.batteryLevel !== undefined).map(v => v.metrics!.batteryLevel!);

    return {
      activeVehicles: activeCount,
      avgFuel: fuelLevels.length ? Math.round(fuelLevels.reduce((a, b) => a + b, 0) / fuelLevels.length) : null,
      avgBattery: batteryLevels.length ? Math.round(batteryLevels.reduce((a, b) => a + b, 0) / batteryLevels.length) : null,
      onRouteCount,
      alertsCount,
      pendingJobsCount: jobs.length,
      hasElectricVehicles,
      hasFuelVehicles
    };
  }, [vehicles, jobs, vehicleAlerts]);

  if (vehicles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
        <div className="h-16 w-16 bg-secondary rounded-lg flex items-center justify-center mb-6">
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No hay flota activa</h3>
        <p className="text-sm text-muted-foreground mt-2">Agregue vehiculos desde la pestana de flota</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-5 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight text-foreground leading-none">Fleet Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-1">Metricas y Operaciones en Tiempo Real</p>
        </div>

        {/* KPI Summary */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-foreground">{kpis.activeVehicles}</span>
            <span className="text-xs text-muted-foreground">Activos</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-foreground" />
            <span className="text-sm font-semibold text-foreground">{kpis.pendingJobsCount}</span>
            <span className="text-xs text-muted-foreground">Pedidos</span>
          </div>
          {kpis.alertsCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-sm font-semibold text-destructive">{kpis.alertsCount}</span>
                <span className="text-xs text-muted-foreground">Alertas</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Vehiculos Activos</span>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground leading-none">{kpis.activeVehicles}</span>
          <span className="text-[11px] text-muted-foreground">de {vehicles.length} totales</span>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">En Ruta</span>
            <Route className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground leading-none">{kpis.onRouteCount}</span>
          <span className="text-[11px] text-emerald-600">{vehicles.length > 0 ? Math.round((kpis.onRouteCount / vehicles.length) * 100) : 0}% utilizacion</span>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{kpis.hasElectricVehicles ? "Bateria Media" : "Combustible Medio"}</span>
            {kpis.hasElectricVehicles ? <Battery className="h-4 w-4 text-muted-foreground" /> : <Fuel className="h-4 w-4 text-muted-foreground" />}
          </div>
          <span className="text-2xl font-semibold text-foreground leading-none">{kpis.hasElectricVehicles ? (kpis.avgBattery ?? "--") : (kpis.avgFuel ?? "--")}%</span>
          <span className="text-[11px] text-muted-foreground">promedio de flota</span>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pedidos Activos</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground leading-none">{kpis.pendingJobsCount}</span>
          <span className="text-[11px] text-muted-foreground">en cola</span>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">

        {/* Left Column: Vehicle List & Gas Stations */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Vehicle List */}
          <div className="flex-1 basis-0 flex flex-col min-h-0 bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Flota Conectada</span>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {vehicles.length}
                </Badge>
              </div>
              <div className="flex gap-0.5 bg-secondary p-0.5 rounded-md">
                {(["all", "assigned", "unassigned"] as const).map((filter) => {
                  const count = vehicles.filter(v => {
                    const hasJob = jobs.some(j => String(j.assignedVehicleId) === String(v.id));
                    if (filter === "assigned") return hasJob;
                    if (filter === "unassigned") return !hasJob;
                    return true;
                  }).length;

                  return (
                    <button
                      key={filter}
                      onClick={() => setVehicleAssignmentFilter(filter)}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-medium rounded-md transition-all flex items-center justify-center gap-1",
                        vehicleAssignmentFilter === filter
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter === "all" ? "Todos" : filter === "assigned" ? "Asignados" : "Libres"}
                      <span className="text-[9px] text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="p-2 space-y-0.5">
                  {vehicles
                    .filter((v) => {
                      const hasJob = jobs.some(j => String(j.assignedVehicleId) === String(v.id));
                      if (vehicleAssignmentFilter === "assigned") return hasJob;
                      if (vehicleAssignmentFilter === "unassigned") return !hasJob;
                      return true;
                    })
                    .map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleRowClick(v.id)}
                        className={cn(
                          "group flex items-center gap-3 p-2.5 rounded-md transition-all cursor-pointer",
                          localSelectedId === v.id
                            ? "bg-secondary"
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-all",
                          localSelectedId === v.id ? "bg-foreground text-card" : "bg-secondary text-muted-foreground"
                        )}>
                          <Truck className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-medium truncate text-foreground">{v.label}</h3>
                            {vehicleAlerts[v.id]?.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{v.licensePlate || "SIN PLACA"}</span>
                        </div>
                        {localSelectedId === v.id && <ChevronRight className="h-3.5 w-3.5 text-foreground shrink-0" />}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Gas Station List */}
          <div className="flex-1 basis-0 flex flex-col min-h-0 bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-foreground">Gasolineras</span>
              {isGasStationLayerVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] font-medium px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllGasStations(!showAllGasStations)}
                >
                  {showAllGasStations ? "Ver menos" : "Ver todas"}
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
              <ScrollArea className="h-full w-full">
                {!isGasStationLayerVisible ? (
                  <div className="flex flex-col items-center justify-center min-h-[120px] h-full p-6 text-center gap-2">
                    <Fuel className="h-6 w-6 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Capa Inactiva</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-foreground underline"
                        onClick={onToggleGasStationLayer}
                      >
                        Activar ahora
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {displayedGasStations.length > 0 ? (
                      displayedGasStations.map((station) => (
                        <div
                          key={station.id}
                          onClick={() => {
                            setSelectedGasStation(station);
                            setIsGasStationDialogOpen(true);
                          }}
                          className="p-2.5 rounded-md hover:bg-secondary transition-all cursor-pointer group flex justify-between items-center gap-3"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-medium truncate text-foreground">{station.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{station.address || "S/D"}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-semibold text-emerald-700">{station.prices?.diesel || station.prices?.gasoline95 || "--"}</span>
                              <span className="text-[9px] text-muted-foreground">EUR/L</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Fuel className="h-5 w-5 text-muted-foreground/30 mb-1.5" />
                        <p className="text-xs text-muted-foreground">Sin datos</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Center Column: Jobs Table & Alert Logs */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          <div className="flex-1 grid grid-rows-2 gap-4 min-h-0">
            {/* Jobs Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground">Cola de Pedidos Activos</span>
                  <div className="flex bg-secondary p-0.5 rounded-md">
                    {(["all", "standard", "custom"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setJobTypeFilter(t)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-medium rounded-md transition-all",
                          jobTypeFilter === t
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t === "all" ? "Todos" : t === "standard" ? "Logistica" : "Manuales"}
                      </button>
                    ))}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium">{jobs.filter(j => jobTypeFilter === "all" || j.type === jobTypeFilter).length} pendientes</Badge>
              </div>
              <div className="flex-1 relative min-h-0">
                <ScrollArea className="h-full w-full">
                  <div className="border-collapse">
                    {(() => {
                      const filteredJobsList = jobs.filter(job => {
                        const jobType = job.type || "standard";
                        const matchesType = jobTypeFilter === "all" || jobType === jobTypeFilter;
                        const matchesVehicle = !localSelectedId || String(job.assignedVehicleId) === String(localSelectedId);
                        return matchesType && matchesVehicle;
                      });

                      if (filteredJobsList.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Package className="h-7 w-7 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground">Sin pedidos activos</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left text-[11px]">
                          <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10 border-b border-border">
                            <tr>
                              <th className="px-4 py-2.5 font-medium text-muted-foreground">Pedido</th>
                              <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Estado</th>
                              <th className="px-4 py-2.5 font-medium text-muted-foreground">Asignacion</th>
                              <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">ETA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredJobsList.map((job) => {
                              const assignedVehicle = vehicles.find(v => String(v.id) === String(job.assignedVehicleId));
                              const assignedDriver = assignedVehicle?.driver;

                              return (
                                <tr key={job.id} className="hover:bg-secondary/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium text-foreground">{job.label}</span>
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "w-fit text-[9px] h-4 px-1.5 font-medium",
                                          job.type === "custom" ? "text-amber-700 bg-amber-50" : "text-foreground"
                                        )}
                                      >
                                        {job.type === "custom" ? "Manual" : "Logistica"}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-md text-[10px] font-medium",
                                      job.status === "completed" ? "bg-emerald-50 text-emerald-700" : (job.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-secondary text-muted-foreground")
                                    )}>
                                      {job.status === "completed" ? "Completado" : (job.status === "in_progress" ? "En Curso" : "Pendiente")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {assignedVehicle ? (
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <Truck className="h-3 w-3 text-muted-foreground" />
                                          <span className="font-medium text-foreground">{assignedVehicle.label}</span>
                                        </div>
                                        {assignedDriver && (
                                          <span className="text-[10px] text-muted-foreground ml-4.5">{assignedDriver.name}</span>
                                        )}
                                      </div>
                                    ) : <span className="text-muted-foreground/40">--</span>}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                    {job.eta ? (
                                      (() => {
                                        try {
                                          const d = new Date(job.eta);
                                          return isNaN(d.getTime()) ? (job.estimatedArrival || "--:--") : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        } catch {
                                          return job.estimatedArrival || "--:--";
                                        }
                                      })()
                                    ) : (job.estimatedArrival || "--:--")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Alert Logs */}
            <AlertLogsSection vehicleId={localSelectedId} vehicleLabel={selectedVehicle?.label} />
          </div>
        </div>

        {/* Right Column: Map & Vehicle Detail */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          {/* Map Preview */}
          <div className="h-[180px] bg-card border border-border rounded-lg overflow-hidden relative shrink-0">
            <MapPreview
              vehicle={selectedVehicle}
              jobs={jobs.filter(j => localSelectedId && String(j.assignedVehicleId) === String(localSelectedId))}
              routeData={routeData}
              vehicleAlerts={vehicleAlerts}
            />
          </div>

          {/* Vehicle Detail */}
          <div className="flex-1 min-h-0 bg-card border border-border rounded-lg overflow-hidden relative">
            {!selectedVehicle ? (
              <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center">
                <ChevronRight className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground">Seleccione vehiculo para telemetria</p>
              </div>
            ) : (
              <VehicleDetailSheet
                vehicle={selectedVehicle}
                metrics={selectedVehicle.metrics || null}
                jobs={jobs}
                alerts={vehicleAlerts[selectedVehicle.id] || []}
                onClose={() => setLocalSelectedId(null)}
                addStopToVehicle={addStopToVehicle}
                startRouting={startRouting}
                isAddStopOpen={dashboardIsAddStopOpen}
                setIsAddStopOpen={setDashboardIsAddStopOpen}
                onStartPickingStop={handleStartPickingStop}
                pickedStopCoords={pickedStopCoords}
                drivers={drivers}
                vehicles={vehicles}
                onAssignDriver={onAssignDriver}
              />
            )}
          </div>
        </div>
      </div>

      <AddGasStationDialog
        isOpen={isGasStationDialogOpen}
        onOpenChange={setIsGasStationDialogOpen}
        gasStation={selectedGasStation}
        vehicles={vehicles}
        onAddToVehicle={(vehicleId, coords, label) => {
          addStopToVehicle?.(vehicleId, coords, label);
          setSelectedGasStation(null);
          setTimeout(() => startRouting?.(), 500);
        }}
      />
    </div>
  );
});
