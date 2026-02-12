"use client";
// components/fleet-dashboard.tsx
//
// Fleet Monitoring Dashboard with real-time KPIs and vehicle table.
// Uses telemetry from CanBusTelemetryProvider (mocked, CAN Bus-ready).

import { useMemo, useEffect, useRef } from "react";
import type { POI, FleetVehicle, FleetJob, Driver } from "@gis/shared";
import type { Alert } from "@/lib/utils";

import {
  Battery,
  Fuel,
  Truck,
  ChevronRight,
  Route,
  Package,
} from "lucide-react";
import { AddGasStationDialog } from "./add-gas-station-dialog";
import { VehicleDetailSheet } from "./vehicle-detail-sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FleetDashboardProps {
  vehicles: FleetVehicle[];
  jobs?: FleetJob[];
  vehicleAlerts?: Record<string | number, Alert[]>;
  isTracking?: boolean;
  addStopToVehicle?: (
    vehicleId: string | number,
    position: [number, number],
    label?: string,
  ) => void;
  startRouting?: () => void;
  isAddStopOpen?: boolean;
  setIsAddStopOpen?: (open: boolean) => void;
  onStartPickingStop?: () => void;
  pickedStopCoords?: [number, number] | null;
  onAddStopSubmit?: (coords: [number, number], label: string) => void;
  drivers?: Driver[];
  selectedVehicleId?: string | number | null;
  onSelectVehicle?: (id: string | number | null) => void;
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
  gasStations?: POI[];
  isGasStationLayerVisible?: boolean;
  onToggleGasStationLayer?: () => void;
}

export function FleetDashboard({
  vehicles,
  jobs = [],
  vehicleAlerts = {},
  addStopToVehicle,
  startRouting,
  onStartPickingStop,
  pickedStopCoords,
  drivers,
  selectedVehicleId,
  onSelectVehicle,
  onAssignDriver,
  gasStations = [],
  isGasStationLayerVisible = true,
  onToggleGasStationLayer,
}: FleetDashboardProps) {
  // Local state for vehicle detail sheet inside dashboard (independent from gis-map panels)
  const [dashboardVehicleId, setDashboardVehicleId] = useState<
    string | number | null
  >(null);

  // Local state for add-stop dialog - independent from gis-map's isAddStopOpen
  const [dashboardIsAddStopOpen, setDashboardIsAddStopOpen] = useState(false);

  // Track if we're waiting for a pick-from-map action
  const waitingForPickRef = useRef(false);

  // When pickedStopCoords changes (user clicked map after "Select from Map"), reopen dialog
  useEffect(() => {
    if (pickedStopCoords && waitingForPickRef.current && dashboardVehicleId) {
      setDashboardIsAddStopOpen(true);
      waitingForPickRef.current = false;
    }
  }, [pickedStopCoords, dashboardVehicleId]);

  // Wrapper for onStartPickingStop that sets waiting flag and closes dialog
  const handleStartPickingStop = () => {
    waitingForPickRef.current = true;
    setDashboardIsAddStopOpen(false); // Close dialog to allow map interaction
    onStartPickingStop?.();
  };

  const handleRowClick = (vehicle: FleetVehicle) => {
    // Set local dashboard state for the detail sheet
    setDashboardVehicleId(vehicle.id);
    // Notify map for highlighting (without opening properties panel)
    onSelectVehicle?.(vehicle.id);
  };

  const kpis = useMemo(() => {
    const vehiclesWithMetrics = vehicles.filter((v) => v.metrics);

    const hasElectricVehicles = vehicles.some(
      (v) => v.type.id.includes("electric") || v.type.id === "zero",
    );
    const hasFuelVehicles = vehicles.some(
      (v) => !v.type.id.includes("electric") && v.type.id !== "zero",
    );

    const fuelLevels: number[] = [];
    const batteryLevels: number[] = [];
    let activeCount = 0;
    let onRouteCount = 0;
    let alertsCount = 0;

    vehicles.forEach((v) => {
      const m = v.metrics;
      if (m?.status === "active") activeCount++;
      if (m?.movementState === "on_route") onRouteCount++;
      if (v.id && vehicleAlerts[v.id]?.length > 0) alertsCount++;

      const isElectric =
        v.type.id === "zero" ||
        v.type.tags?.includes("0") ||
        v.type.id.toLowerCase().includes("electric") ||
        v.type.label.toLowerCase().includes("electric") ||
        (m?.batteryLevel !== undefined && m?.fuelLevel === undefined);

      if (isElectric && m?.batteryLevel !== undefined) {
        batteryLevels.push(m.batteryLevel);
      } else if (!isElectric && m?.fuelLevel !== undefined) {
        fuelLevels.push(m.fuelLevel);
      }
    });

    return {
      activeVehicles: activeCount,
      avgFuel: fuelLevels.length
        ? Math.round(
          fuelLevels.reduce((sum, val) => sum + val, 0) / fuelLevels.length,
        )
        : null,
      avgBattery: batteryLevels.length
        ? Math.round(
          batteryLevels.reduce((sum, val) => sum + val, 0) /
          batteryLevels.length,
        )
        : null,
      hasFuelVehicles,
      hasElectricVehicles,
      onRouteCount,
      alertsCount,
      pendingJobsCount: jobs.length,
    };
  }, [vehicles, jobs, vehicleAlerts]);

  // Sort gas stations by cheapest price, ascending order
  const sortedGasStations = useMemo(() => {
    return [...gasStations].sort((a, b) => {
      const priceA = a.prices?.diesel || a.prices?.gasoline95 || 0;
      const priceB = b.prices?.diesel || b.prices?.gasoline95 || 0;
      return priceA - priceB;
    });
  }, [gasStations]);

  const [showAllGasStations, setShowAllGasStations] = useState(false);

  const displayedGasStations = useMemo(() => {
    return showAllGasStations
      ? sortedGasStations
      : sortedGasStations.slice(0, 5);
  }, [sortedGasStations, showAllGasStations]);

  const [selectedGasStation, setSelectedGasStation] = useState<POI | null>(
    null,
  );
  const [isGasStationDialogOpen, setIsGasStationDialogOpen] = useState(false);

  if (vehicles.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center bg-background">
        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-border/60">
          <Truck className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-black italic tracking-tighter text-foreground/40 uppercase">
          No hay flota activa
        </h3>
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-2">
          Agregue vehículos desde la pestaña de flota
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      {/* Header Section — fixed at top */}
      <div className="p-4 pb-3 border-b border-border/10 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Dashboard
            </h2>
            <p className="text-[9px] uppercase font-medium text-muted-foreground/50 tracking-wider mt-0.5">
              Métricas en Tiempo Real
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-primary leading-none">
              {kpis.activeVehicles}
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              En Servicio
            </span>
          </div>
        </div>

        {/* KPI Grid - more compact and professional */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-muted/20 border border-border/15 rounded-xl transition-all hover:bg-muted/30 group">
            <div className="flex items-center justify-between mb-1">
              <Route className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[13px] font-bold text-foreground">
                {kpis.onRouteCount}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground/60 transition-colors">
              En Ruta
            </span>
          </div>
          <div className="p-3 bg-muted/20 border border-border/15 rounded-xl transition-all hover:bg-muted/30 group">
            <div className="flex items-center justify-between mb-1">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[13px] font-bold text-foreground">
                {kpis.pendingJobsCount}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground/60 transition-colors">
              Pendientes
            </span>
          </div>

          {kpis.hasElectricVehicles && (
            <div className="p-3 bg-muted/20 border border-border/15 rounded-xl transition-all hover:bg-muted/30 group">
              <div className="flex items-center justify-between mb-1">
                <Battery className="h-3.5 w-3.5 text-cyan-600" />
                <span className="text-[13px] font-bold text-foreground">
                  {kpis.avgBattery !== null ? `${kpis.avgBattery}%` : "--%"}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground group-hover:text-foreground transition-colors">
                Energía
              </span>
            </div>
          )}
          {kpis.hasFuelVehicles && (
            <div className="p-3 bg-muted/20 border border-border/15 rounded-xl transition-all hover:bg-muted/30 group">
              <div className="flex items-center justify-between mb-1">
                <Fuel className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-[13px] font-bold text-foreground">
                  {kpis.avgFuel !== null ? `${kpis.avgFuel}%` : "--%"}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground group-hover:text-foreground transition-colors">
                Combustible
              </span>
            </div>
          )}

          {kpis.alertsCount > 0 && (
            <div className="p-3 bg-red-500/[0.03] border border-red-500/20 rounded-xl flex items-center justify-between col-span-2 group">
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-tight">
                  {kpis.alertsCount} Alertas de incidencia
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-600">
                CRÍTICO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content — max-height ensures scroll always works regardless of flex chain */}
      <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(100vh - 22rem)' }}>
        <div className="space-y-2.5 pb-4">
          <Label className="text-[10px] font-bold uppercase text-foreground/30 tracking-widest pl-1 mb-3 block">
            Monitor de flota ({vehicles.length})
          </Label>

          <div className="space-y-2.5">
            {vehicles.map((vehicle) => {
              const m = vehicle.metrics;
              const movement = m ? m.movementState : null;
              const isElectric =
                vehicle.type.id.includes("electric") ||
                vehicle.type.id === "zero" ||
                (m?.batteryLevel !== undefined && m?.fuelLevel === undefined);
              const energyLevel = isElectric ? m?.batteryLevel : m?.fuelLevel;

              return (
                <div
                  key={vehicle.id}
                  onClick={() => handleRowClick(vehicle)}
                  className="group relative bg-muted/20 border border-border/15 rounded-xl p-3 hover:border-primary/30 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex gap-2.5 items-center min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-primary/40" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[12px] font-bold text-foreground truncate">
                            {vehicle.label}
                          </h3>
                          {vehicleAlerts[vehicle.id]?.length > 0 && (
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                          <span className="font-mono bg-muted/40 px-1 py-px rounded border border-border/10 text-foreground">
                            {vehicle.licensePlate || "N/A"}
                          </span>
                          <span className="truncate text-foreground/70">
                            {vehicle.driver?.name || "SIN ASIGNAR"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <div
                        className={cn(
                          "px-1.5 py-px rounded text-[8px] font-bold uppercase border tracking-widest",
                          movement === "on_route"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : movement === "moving"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                        )}
                      >
                        {movement === "on_route"
                          ? "RUTA"
                          : movement === "moving"
                            ? "MOV"
                            : "STOP"}
                      </div>
                      {m && m.speed > 0 && (
                        <div className="text-[12px] font-black text-foreground leading-none">
                          {m.speed}
                          <span className="text-[8px] text-muted-foreground/60 ml-0.5 font-bold">
                            KM/H
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {energyLevel !== undefined && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2.5 flex-1">
                        {isElectric ? (
                          <Battery className="h-3 w-3 text-cyan-500/40 shrink-0" />
                        ) : (
                          <Fuel className="h-3 w-3 text-orange-500/40 shrink-0" />
                        )}
                        <div className="h-0.5 flex-1 max-w-[80px] bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-700 rounded-full",
                              energyLevel < 20
                                ? "bg-red-500"
                                : isElectric
                                  ? "bg-cyan-500"
                                  : "bg-orange-500",
                            )}
                            style={{ width: `${energyLevel}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-bold",
                            energyLevel < 20
                              ? "text-red-500"
                              : "text-muted-foreground/30",
                          )}
                        >
                          {energyLevel}%
                        </span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gas Stations Section */}
          <div className="mt-6 pt-5 border-t border-border/5">
            <Label className="text-[10px] font-bold uppercase text-foreground/30 tracking-widest pl-1 mb-3 block">
              Suministro cercano ({sortedGasStations.length})
            </Label>
            <div className="space-y-2">
              {sortedGasStations.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-muted-foreground/20 p-4 text-center border border-dashed border-border/20 rounded-xl font-bold uppercase tracking-wider">
                    {isGasStationLayerVisible
                      ? "Sin estaciones disponibles"
                      : "Capa de suministro oculta"}
                  </p>
                  {!isGasStationLayerVisible && onToggleGasStationLayer && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-[9px] font-bold uppercase tracking-widest rounded-xl border-primary/20 text-primary/70 bg-primary/[0.02] hover:bg-primary/[0.05] transition-all"
                      onClick={onToggleGasStationLayer}
                    >
                      <Fuel className="h-3 w-3 mr-2" />
                      Activar Capa
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {displayedGasStations.map((poi) => (
                    <div
                      key={poi.id}
                      className="p-2.5 bg-muted/10 border border-border/10 rounded-xl flex items-center justify-between gap-2 hover:bg-muted/20 hover:border-orange-500/20 cursor-pointer group"
                      onClick={() => {
                        setSelectedGasStation(poi);
                        setIsGasStationDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-7 w-7 bg-orange-500/[0.05] text-orange-500/40 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                          <Fuel className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {poi.name}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground/80 uppercase tracking-tight truncate">
                            {poi.address || "UBICACIÓN DESCONOCIDA"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[12px] font-black text-foreground/80">
                          {poi.prices?.diesel
                            ? `${poi.prices.diesel}€`
                            : poi.prices?.gasoline95
                              ? `${poi.prices.gasoline95}€`
                              : "--"}
                        </span>
                        <span className="text-[7px] font-bold text-muted-foreground/30 uppercase">
                          {poi.prices?.diesel ? "DIESEL" : "G95"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {sortedGasStations.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowAllGasStations(!showAllGasStations)
                      }
                      className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground/20 hover:text-muted-foreground/60 hover:bg-transparent h-7"
                    >
                      {showAllGasStations
                        ? "Contraer"
                        : `Ver ${sortedGasStations.length - 5} adicionales`}
                    </Button>
                  )}
                </>
              )}
            </div>
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
          // Trigger route optimization like when adding a custom stop
          setTimeout(() => startRouting?.(), 500);
        }}
      />

      {/* Vehicle Detail Sheet - Local dashboard state, independent from gis-map panels */}
      {dashboardVehicleId && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-background border-l border-border/40 shadow-lg overflow-hidden flex flex-col">
          <VehicleDetailSheet
            vehicle={vehicles.find((v) => v.id === dashboardVehicleId) || null}
            metrics={
              vehicles.find((v) => v.id === dashboardVehicleId)?.metrics || null
            }
            jobs={jobs}
            alerts={vehicleAlerts[dashboardVehicleId] || []}
            onClose={() => {
              setDashboardVehicleId(null);
              setDashboardIsAddStopOpen(false);
            }}
            addStopToVehicle={addStopToVehicle}
            startRouting={startRouting}
            isAddStopOpen={dashboardIsAddStopOpen}
            setIsAddStopOpen={setDashboardIsAddStopOpen}
            onStartPickingStop={handleStartPickingStop}
            pickedStopCoords={pickedStopCoords}
            // Do NOT pass onAddStopSubmit - let it use fallback with vehicle.id
            drivers={drivers}
            vehicles={vehicles}
            onAssignDriver={onAssignDriver}
          />
        </div>
      )}
    </div>
  );
}
