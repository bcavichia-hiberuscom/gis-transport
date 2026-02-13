"use client";

import { Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Car, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DriverDetailsSheetProps {
  driver: Driver | null;
  onClose: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DriverDetailsSheet({
  driver,
  onClose,
}: DriverDetailsSheetProps) {
  if (!driver) return null;

  const speeedingCount = Array.isArray(driver.speedingEvents)
    ? driver.speedingEvents.length
    : 0;

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden animate-in slide-in-from-right-4 duration-300 font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3 shrink-0 bg-background/50 sticky top-0 z-20 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground rounded-full"
          onClick={onClose}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground leading-none truncate">
            {driver.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
              {driver.licenseNumber || "ID: " + driver.id.slice(-6)}
            </span>
            <Badge
              variant={driver.isAvailable ? "outline" : "secondary"}
              className="text-[8px] uppercase font-black px-1.5 h-3.5 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 py-0"
            >
              {driver.isAvailable ? "Disponible" : "Conductor Asignado"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-8">
          {/* Profile Header */}
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
              {driver.imageUrl ? (
                <img
                  src={driver.imageUrl}
                  alt={driver.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users className="h-10 w-10 text-primary/40" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          </div>

          {/* License Information */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest pl-1">
              Licencia
            </h3>
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Categoría
                </span>
                <span className="text-sm font-bold bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                  {driver.licenseType || "Cat. B"}
                </span>
              </div>
              {driver.licenseNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Número
                  </span>
                  <span className="text-xs font-mono font-bold tracking-wider">
                    {driver.licenseNumber}
                  </span>
                </div>
              )}
              {driver.phoneNumber && (
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground font-medium">
                    Teléfono
                  </span>
                  <a
                    href={`tel:${driver.phoneNumber}`}
                    className="text-xs font-mono font-bold text-blue-600 hover:underline"
                  >
                    {driver.phoneNumber}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest pl-1">
              Métricas de Desempeño
            </h3>
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-foreground">
                      Puntualidad
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-black",
                      driver.onTimeDeliveryRate >= 90
                        ? "text-emerald-600"
                        : driver.onTimeDeliveryRate >= 75
                          ? "text-orange-500"
                          : "text-red-500",
                    )}
                  >
                    {driver.onTimeDeliveryRate}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      driver.onTimeDeliveryRate >= 90
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : driver.onTimeDeliveryRate >= 75
                          ? "bg-orange-500"
                          : "bg-red-500",
                    )}
                    style={{ width: `${driver.onTimeDeliveryRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Speeding Events */}
          {speeedingCount > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider pl-1">
                Alertas de Seguridad
              </h3>
              <div className="bg-card border border-red-200/40 dark:border-red-900/40 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 mb-0.5">
                      Excesos de velocidad detectados
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-snug">
                      <strong>{speeedingCount}</strong> evento{speeedingCount > 1 ? "s" : ""} registrado{speeedingCount > 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
                {/* Individual speeding event details */}
                <div className="space-y-1 pt-2 border-t border-red-200/30 dark:border-red-900/30 max-h-[120px] overflow-y-auto">
                  {driver.speedingEvents!.slice(0, 5).map((event: any, i: number) => (
                    <div
                      key={event.id || i}
                      className="flex items-center justify-between text-[9px] px-2 py-1.5 bg-red-50/50 dark:bg-red-950/20 rounded-md border border-red-100/50 dark:border-red-900/20"
                    >
                      <span className="text-red-700 dark:text-red-400 font-medium">
                        {Math.round(event.speed)} km/h → {Math.round(event.limit)} km/h
                      </span>
                      <span className="text-red-500/60 dark:text-red-500/50 font-mono text-[8px]">
                        {event.timestamp
                          ? new Date(event.timestamp).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                  ))}
                  {speeedingCount > 5 && (
                    <p className="text-[8px] text-red-500/50 dark:text-red-500/40 text-center pt-1 font-medium">
                      +{speeedingCount - 5} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
