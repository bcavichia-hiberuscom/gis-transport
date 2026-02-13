"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  Battery,
  Users,
  X,
  Zap,
  Activity,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Route,
  Package,
  Trash2,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import type {
  FleetVehicle,
  VehicleMetrics,
  FleetJob,
  Driver,
} from "@gis/shared";
import type { Alert } from "@/lib/utils";
import { GeocodingService } from "@/lib/services/geocoding-service";
import { AddStopDialog } from "./add-stop-dialog";
import { AssignDriverDialog } from "./assign-driver-dialog";
import { useAlertLogs } from "@/hooks/use-alert-logs";

interface VehicleDetailSheetProps {
  vehicle: FleetVehicle | null;
  metrics: VehicleMetrics | null;
  jobs?: FleetJob[];
  alerts?: Alert[];
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
  onClose: () => void;
  drivers?: Driver[];
  vehicles?: FleetVehicle[];
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
}

export const VehicleDetailSheet = memo(function VehicleDetailSheet({
  vehicle,
  metrics,
  jobs = [],
  alerts = [],
  addStopToVehicle,
  startRouting,
  isAddStopOpen = false,
  setIsAddStopOpen,
  onStartPickingStop,
  pickedStopCoords,
  onAddStopSubmit,
  drivers = [],
  vehicles = [],
  onAssignDriver,
  onClose,
}: VehicleDetailSheetProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getVehicleLogs, clearVehicleLogs } = useAlertLogs();

  // Filter jobs assigned to this vehicle — computed every render for guaranteed reactivity
  const assignedJobs = jobs
    .filter((j) => String(j.assignedVehicleId) === String(vehicle?.id))
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  // Separate real Vroom jobs from custom stops
  const realJobs = assignedJobs.filter((j) => j.type === "standard" || !j.type);
  const customStops = assignedJobs.filter((j) => j.type === "custom");
  const completedJobs = realJobs.filter((j) => j.status === "completed").length;

  useEffect(() => {
    // Reset local address state when vehicle changes
    setAddress(null);
    setIsLoadingAddress(false);

    const isMoving = (metrics?.speed ?? 0) > 0;

    if (vehicle?.position && isMoving) {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

      geocodeTimeoutRef.current = setTimeout(async () => {
        setIsLoadingAddress(true);
        try {
          const resolvedAddress = await GeocodingService.reverse(
            vehicle.position![0],
            vehicle.position![1],
          );
          setAddress(resolvedAddress);
        } catch (err) {
          console.error("Geocoding error:", err);
        } finally {
          setIsLoadingAddress(false);
        }
      }, 5000);

      return () => {
        if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      };
    }
  }, [vehicle?.id, metrics?.speed === 0]); // Re-run when vehicle changes OR it stops/starts

  // Get alert logs for this vehicle - MUST be before early return
  const vehicleLogs = useMemo(
    () => (vehicle ? getVehicleLogs(vehicle.id) : []),
    [vehicle?.id, getVehicleLogs],
  );

  if (!vehicle) return null;

  const isElectric =
    vehicle.type.id.includes("electric") ||
    vehicle.type.id === "zero" ||
    metrics?.batteryLevel !== undefined;

  const speed = metrics?.speed || 0;
  const maxSpeed = metrics?.maxSpeed;
  const displaySpeedLimit = maxSpeed || (speed > 0 ? 60 : undefined);
  const energyLevel =
    (isElectric ? metrics?.batteryLevel : metrics?.fuelLevel) ?? 100;
  const movement = metrics?.movementState || "stopped";

  // Check if vehicle is speeding
  const isOverSpeeding = displaySpeedLimit ? speed > displaySpeedLimit : false;

  // Check if there are any critical alerts
  const hasCriticalAlerts = alerts.some((a) => a.severity === "critical");
  const hasAnyAlerts = alerts.length > 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans text-xs">
      {/* Header - Minimalist */}
      <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between shrink-0 bg-background sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -ml-1.5 text-muted-foreground hover:text-foreground rounded-full"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-none">
              {vehicle.label}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
                {vehicle.licensePlate}
              </span>
              <span className="text-[10px] text-muted-foreground/30">•</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tighter opacity-70">
                {isElectric ? "Electric" : "Combustion"}
              </span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider",
            movement === "on_route"
              ? "bg-emerald-100/80 text-emerald-800 border-emerald-200"
              : movement === "moving"
                ? "bg-blue-100/80 text-blue-800 border-blue-200"
                : "bg-zinc-100/80 text-zinc-600 border-zinc-200",
          )}
        >
          {movement === "on_route"
            ? "ON ROUTE"
            : movement === "moving"
              ? "MOVING"
              : "STOPPED"}
        </div>
      </div>

      {/* Scrollable Body - High Density */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Unified Monitor Block (Speed + Location) */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 flex items-center gap-1 uppercase tracking-wider pl-0.5">
            <ShieldCheck className="h-3 w-3" /> Monitor de Seguridad
          </h3>

          <div
            className={cn(
              "relative border rounded-lg p-3 shadow-sm min-h-[110px] flex flex-col justify-between overflow-hidden transition-all duration-200",
              hasCriticalAlerts
                ? "bg-red-50/50 border-red-200/50"
                : hasAnyAlerts
                  ? "bg-amber-50/30 border-amber-200/40"
                  : "bg-card border-border/50",
            )}
          >
            <div className="flex justify-between items-start relative z-10 gap-3">
              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Current Speed */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wide leading-none">
                    Velocidad
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold tracking-tight leading-none",
                      "text-foreground",
                    )}
                  >
                    {speed}
                    <span className="text-[10px] font-medium text-muted-foreground/40 ml-0.5">
                      km/h
                    </span>
                  </div>
                </div>

                {/* Integrated Location */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wide leading-none">
                    Ubicación
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-medium text-foreground leading-tight truncate transition-opacity duration-300",
                      isLoadingAddress
                        ? "opacity-50 animate-pulse"
                        : "opacity-100",
                    )}
                  >
                    {metrics?.address ||
                      address ||
                      (isLoadingAddress
                        ? "Consultando..."
                        : speed > 0
                          ? "Detectando vía..."
                          : "Sin movimiento")}
                  </div>
                </div>
              </div>

              {/* Speed Limit Sign */}
              <div className="flex flex-col items-end shrink-0">
                <div className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wide leading-none mb-0.5">
                  Límite
                </div>
                <div
                  className={cn(
                    "relative inline-flex items-center justify-center h-9 w-9 rounded-full border-2 bg-white shadow-sm",
                    isOverSpeeding ? "border-red-600" : "border-blue-600",
                  )}
                >
                  <span className="text-sm font-bold text-zinc-900 leading-none">
                    {displaySpeedLimit || "--"}
                  </span>
                </div>
              </div>
            </div>
            <Zap
              className={cn(
                "absolute -top-3 -right-3 h-14 w-14 opacity-[0.02] rotate-12",
                "text-primary",
              )}
            />
          </div>
        </div>

        {/* Simplified Data Grid (Energy Only) */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 flex items-center gap-1 uppercase tracking-wider pl-0.5">
            <Activity className="h-3 w-3" /> Telemetría
          </h3>
          <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm space-y-2 group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[9px] uppercase tracking-wide opacity-70">
                {isElectric ? (
                  <Battery className="h-3 w-3 text-blue-500" />
                ) : (
                  <Fuel className="h-3 w-3 text-orange-500" />
                )}
                {isElectric ? "Batería" : "Combustible"}
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className={cn(
                    "text-base font-bold tracking-tight",
                    energyLevel < 20 ? "text-red-500" : "text-foreground",
                  )}
                >
                  {energyLevel}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-semibold">
                  %
                </span>
              </div>
            </div>
            <Progress
              value={energyLevel}
              className={cn(
                "h-1.5 bg-muted/50 rounded-full",
                isElectric ? "[&>div]:bg-blue-500" : "[&>div]:bg-orange-500",
              )}
            />
          </div>
        </div>

        {/* Route Controls Section (Restored) */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 flex items-center gap-1 uppercase tracking-wider pl-0.5">
            <Route className="h-3 w-3" /> Gestión de Ruta
          </h3>
          <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm space-y-3 group hover:border-primary/20 transition-all">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground/70 uppercase">Paradas Activas</span>
                <Badge variant="outline" className="text-[8px] border-primary/10 text-primary">{assignedJobs.length}</Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all gap-2"
                onClick={() => setIsAddStopOpen?.(true)}
              >
                <Plus className="h-3 w-3" />
                Añadir Parada Manual
              </Button>

              {customStops.length > 0 && (
                <div className="mt-1 space-y-1">
                  <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest px-1">Paradas Personalizadas</p>
                  {customStops.map((stop) => (
                    <div key={stop.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border border-border/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3 w-3 text-orange-500 shrink-0" />
                        <span className="text-[10px] font-bold truncate text-foreground/80 lowercase first-letter:uppercase">{stop.label}</span>
                      </div>
                      <Badge className="text-[7px] h-3.5 px-1 bg-orange-100 text-orange-700 border-none uppercase font-black">Manual</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Driver Section */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 flex items-center gap-1 uppercase tracking-wider pl-0.5">
            <Users className="h-3 w-3" /> Conductor
          </h3>
          <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm group hover:border-primary/20 transition-all">
            {vehicle?.driver ? (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden shrink-0">
                  {vehicle.driver.imageUrl ? (
                    <img
                      src={vehicle.driver.imageUrl}
                      alt={vehicle.driver.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users className="h-4 w-4 text-primary/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold truncate">
                      {vehicle.driver.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[8px] uppercase font-semibold px-1.5 h-4 border-primary/20 text-primary"
                    >
                      {vehicle.driver.licenseType || "Cat. B"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {vehicle.driver.onTimeDeliveryRate}% puntual
                      </span>
                    </div>
                    {vehicle.driver.speedingEvents &&
                      vehicle.driver.speedingEvents.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5 text-orange-500" />
                          <span className="text-[9px] font-medium text-orange-500">
                            {vehicle.driver.speedingEvents.length} Exc.
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onAssignDriver?.(vehicle.id, null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all gap-2"
                onClick={() => setIsAssignDriverOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Asignar Conductor
              </Button>
            )}
          </div>
        </div>
      </div>

      {vehicle && (
        <AddStopDialog
          vehicleId={vehicle.id}
          vehicleLabel={vehicle.label}
          open={isAddStopOpen}
          onOpenChange={setIsAddStopOpen || (() => { })}
          onStartPicking={onStartPickingStop}
          pickedCoords={pickedStopCoords}
          onAddStop={
            onAddStopSubmit ||
            ((pos, lbl, eta) => {
              addStopToVehicle?.(vehicle.id, pos, lbl, eta);
              setIsAddStopOpen?.(false); // Close dialog after adding
              setTimeout(() => startRouting?.(), 500);
            })
          }
        />
      )}
      {vehicle && (
        <AssignDriverDialog
          open={isAssignDriverOpen}
          onOpenChange={setIsAssignDriverOpen}
          drivers={drivers}
          vehicleLabel={vehicle.label}
          onAssign={(driver) => onAssignDriver?.(vehicle.id, driver)}
        />
      )}
    </div>
  );
});
