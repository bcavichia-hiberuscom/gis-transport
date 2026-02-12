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
  Map,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface VehicleDetailSheetProps {
  vehicle: FleetVehicle | null;
  metrics: VehicleMetrics | null;
  jobs?: FleetJob[];
  alerts?: Alert[];
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
  onClose: () => void;
  drivers?: Driver[];
  vehicles?: FleetVehicle[];
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
}

export function VehicleDetailSheet({
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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getVehicleLogs, clearVehicleLogs } = useAlertLogs();

  const assignedJobs = jobs
    .filter((j) => String(j.assignedVehicleId) === String(vehicle?.id))
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const realJobs = assignedJobs.filter((j) => j.source === "vroom" || !j.source);
  const customStops = assignedJobs.filter((j) => j.source === "custom_stop");
  const completedJobs = realJobs.filter((j) => j.status === "completed").length;

  useEffect(() => {
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
  }, [vehicle?.id, metrics?.speed === 0]);

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
  const energyLevel = (isElectric ? metrics?.batteryLevel : metrics?.fuelLevel) ?? 100;
  const movement = metrics?.movementState || "stopped";
  const isOverSpeeding = displaySpeedLimit ? speed > displaySpeedLimit : false;
  const hasCriticalAlerts = alerts.some((a) => a.severity === "critical");

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background border-l border-border/10 overflow-hidden font-sans">
      {/* Premium Header Container (Matching Driver DNA) */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent h-48" />

        {/* Navigation & Title */}
        <div className="px-5 py-4 flex items-center gap-4 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/40 hover:text-foreground hover:bg-muted/50 rounded-lg"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground tracking-tight truncate">
              Monitor de Vehículo
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {vehicle.licensePlate}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-5 pb-6 relative z-10 flex flex-col items-center">
          <div className="relative group">
            <div className="h-20 w-20 rounded-[2rem] bg-muted/20 border-4 border-background shadow-2xl flex items-center justify-center overflow-hidden">
              <Zap className={cn(
                "h-10 w-10 opacity-20",
                isElectric ? "text-blue-500" : "text-orange-500"
              )} />
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold text-foreground tracking-tighter">
            {vehicle.label}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "mt-2 text-[10px] uppercase font-bold tracking-[0.1em] px-3 py-0.5 border-border/10",
              movement === "on_route"
                ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                : movement === "moving"
                  ? "bg-blue-500/5 text-blue-600 border-blue-500/20"
                  : "bg-muted/20 text-muted-foreground border-border/20"
            )}
          >
            {movement === "on_route" ? "En Ruta" : movement === "moving" ? "En Marcha" : "Detenido"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 pb-10 space-y-7">

          {/* Main Telemetry Monitor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Telemetría en Vivo</h3>
              <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>

            <div className={cn(
              "bg-muted/10 border border-border/15 rounded-2xl p-5 relative overflow-hidden",
              isOverSpeeding && "bg-red-500/[0.02] border-red-500/20"
            )}>
              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Velocidad Actual</span>
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "text-4xl font-black tracking-tighter",
                      isOverSpeeding ? "text-red-500" : "text-foreground"
                    )}>
                      {speed}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground/40">km/h</span>
                  </div>
                </div>

                <div className={cn(
                  "h-14 w-14 rounded-full border-4 flex flex-col items-center justify-center shadow-lg bg-background",
                  isOverSpeeding ? "border-red-500" : "border-primary"
                )}>
                  <span className="text-[8px] font-black text-muted-foreground leading-none">LIMIT</span>
                  <span className="text-xl font-black text-foreground">{displaySpeedLimit || "--"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-border/5">
                <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ubicación</span>
                  <p className={cn(
                    "text-[12px] font-bold text-foreground/80 leading-snug mt-0.5 truncate",
                    isLoadingAddress && "animate-pulse"
                  )}>
                    {metrics?.address || address || "Detectando dirección..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estado del Sistema</h3>
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="bg-muted/10 border border-border/15 rounded-2xl p-5">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    isElectric ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
                  )}>
                    {isElectric ? <Battery className="h-5 w-5" /> : <Fuel className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      {isElectric ? "Batería" : "Combustible"}
                    </span>
                    <span className="text-2xl font-black text-foreground tracking-tighter">
                      {energyLevel}<span className="text-sm font-bold text-muted-foreground/40 ml-1">%</span>
                    </span>
                  </div>
                </div>
                <Badge className={cn(
                  "border-none text-[9px] font-black px-2 py-0",
                  energyLevel > 20 ? "bg-emerald-500 text-white" : "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                )}>
                  {energyLevel > 20 ? "ÓPTIMO" : "BAJO"}
                </Badge>
              </div>
              <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    isElectric ? "bg-blue-500" : "bg-orange-500"
                  )}
                  style={{ width: `${energyLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Operator Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Operador Asignado</h3>
              <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="bg-muted/10 border border-border/15 rounded-2xl p-5">
              {vehicle?.driver ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-muted/20 border-2 border-background shadow-md overflow-hidden shrink-0">
                    {vehicle.driver.imageUrl ? (
                      <img src={vehicle.driver.imageUrl} alt={vehicle.driver.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/5">
                        <Users className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-black text-foreground truncate">{vehicle.driver.name}</h4>
                      <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary">
                        {vehicle.driver.licenseType || "CAT. B"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground">{vehicle.driver.onTimeDeliveryRate}% Score</span>
                      </div>
                      {vehicle.driver.speedingEvents && vehicle.driver.speedingEvents.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-[10px] font-black text-red-600">
                            {vehicle.driver.speedingEvents.length} Incid.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg shrink-0"
                    onClick={() => onAssignDriver?.(vehicle.id, null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="h-16 w-16 bg-muted/5 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-border/20">
                    <UserPlus className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sin operador asignado</p>
                    <p className="text-[11px] font-bold text-muted-foreground/50">Vincule un conductor para iniciar operaciones</p>
                  </div>
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="mt-2 w-full bg-primary/10 hover:bg-primary/20 text-primary border-none font-black text-[10px] uppercase tracking-widest h-10 rounded-xl"
                  >
                    Asignar Conductor
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Improved Route List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hoja de Ruta</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black px-1.5">
                  {completedJobs}/{realJobs.length} OK
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg" onClick={() => setIsAddStopOpen?.(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> PARADA
              </Button>
            </div>
            <div className="bg-muted/10 border border-border/15 rounded-2xl overflow-hidden">
              {assignedJobs.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-2">
                  <Map className="h-10 w-10 text-muted-foreground/10" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sin paradas activas</p>
                </div>
              ) : (
                <div className="divide-y divide-border/5">
                  {assignedJobs.map((job, idx) => (
                    <div key={job.id} className="p-4 flex items-center gap-4 hover:bg-muted/10">
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center border-2 text-[11px] font-black shrink-0",
                        job.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/30 text-muted-foreground"
                      )}>
                        {job.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-foreground truncate">{job.label}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-40" /> {job.estimatedArrival || "--:--"}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 opacity-40" /> {job.address || "Dirección..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security History */}
          {vehicleLogs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-[10px] font-black text-red-600/50 uppercase tracking-[0.2em]">Historial de Seguridad</h3>
                <button onClick={() => clearVehicleLogs(vehicle.id)} className="text-[9px] font-bold text-red-600/40 hover:text-red-600">LIMPIAR</button>
              </div>
              <div className="bg-red-500/[0.02] border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="divide-y divide-red-500/5">
                  {vehicleLogs.map((log, idx) => (
                    <div key={log.id + idx} className="p-4 flex items-start gap-3 hover:bg-red-500/[0.02]">
                      <div className={cn(
                        "h-2 w-2 rounded-full mt-1.5 shrink-0",
                        log.severity === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-orange-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-foreground">{log.alertTitle}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5 leading-snug">{log.message}</p>
                        <time className="text-[9px] font-bold text-muted-foreground/40 mt-1.5 block uppercase tracking-tighter">
                          {new Date(log.timestamp).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <AssignDriverDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        drivers={drivers}
        vehicleLabel={vehicle.label}
        onAssign={(driver) => {
          onAssignDriver?.(vehicle.id, driver);
          setIsAssignDialogOpen(false);
        }}
      />

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
            ((pos, lbl) => {
              addStopToVehicle?.(vehicle.id, pos, lbl);
              setIsAddStopOpen?.(false);
              setTimeout(() => startRouting?.(), 500);
            })
          }
        />
      )}
    </div>
  );
}
