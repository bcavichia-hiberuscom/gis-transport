"use client";

import { Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Car, AlertTriangle, ArrowLeft, ShieldCheck, Phone, Award, MapPin } from "lucide-react";
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
    <div className="flex flex-col flex-1 min-h-0 bg-background border-l border-border/10 overflow-hidden font-sans">
      {/* Premium Header Container */}
      <div className="relative shrink-0">
        {/* Background Accent */}
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
              Perfil de Operador
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {driver.licenseNumber || "ID-" + driver.id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Card Overlay */}
        <div className="px-5 pb-6 relative z-10 flex flex-col items-center">
          <div className="relative group">
            <div className="h-20 w-20 rounded-[2rem] bg-muted/20 border-4 border-background shadow-2xl overflow-hidden relative">
              {driver.imageUrl ? (
                <img
                  src={driver.imageUrl}
                  alt={driver.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/[0.02]">
                  <Users className="h-8 w-8 text-primary/20" />
                </div>
              )}
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold text-foreground tracking-tighter">
            {driver.name}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "mt-2 text-[10px] uppercase font-bold tracking-[0.1em] px-3 py-0.5 border-border/10",
              driver.isAvailable
                ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                : "bg-blue-500/5 text-blue-600 border-blue-500/20"
            )}
          >
            {driver.isAvailable ? "Disponible" : "En Operación"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 pb-10 space-y-6">

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/10 border border-border/15 rounded-2xl p-4 hover:bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Licencia</span>
              </div>
              <span className="text-[13px] font-black text-foreground/80 leading-none">
                {driver.licenseType || "Cat. B"}
              </span>
            </div>
            <div className="bg-muted/10 border border-border/15 rounded-2xl p-4 hover:bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rendimiento</span>
              </div>
              <span className="text-[13px] font-black text-emerald-600 leading-none">
                {driver.onTimeDeliveryRate || 100}%
              </span>
            </div>
          </div>

          {/* Performance Detailed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Puntualidad en Entregas</h3>
              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="bg-muted/10 border border-border/15 rounded-2xl p-4 relative overflow-hidden group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground tracking-tighter">
                    {driver.onTimeDeliveryRate || 100}
                    <span className="text-sm font-bold text-muted-foreground/40 ml-1">%</span>
                  </span>
                </div>
                <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black px-2 py-0">SCORE EXCELENTE</Badge>
              </div>
              <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${driver.onTimeDeliveryRate || 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Información de Contacto</h3>
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="bg-muted/5 border border-border/10 rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center justify-between hover:bg-muted/10 border-b border-border/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Móvil</span>
                    <span className="text-[12px] font-bold text-foreground">{driver.phoneNumber || "+34 600 000 000"}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:bg-blue-500/10">Llamar</Button>
              </div>
            </div>
          </div>

          {/* Security Alerts - Technical Redesign */}
          {speeedingCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-[10px] font-black text-red-600/50 uppercase tracking-[0.2em]">Registro de Incidencias</h3>
                <AlertTriangle className="h-3.5 w-3.5 text-red-600/40" />
              </div>
              <div className="bg-red-500/[0.02] border border-red-500/20 rounded-2xl">
                <div className="p-4 bg-red-500/[0.03] border-b border-red-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                    <span className="text-[11px] font-black text-red-700 uppercase tracking-tight">Excesos de Velocidad</span>
                  </div>
                  <span className="text-[14px] font-black text-red-700">{speeedingCount}</span>
                </div>
                <div className="divide-y divide-red-500/5">
                  {driver.speedingEvents!.slice(0, 5).map((event: any, i: number) => (
                    <div key={event.id || i} className="p-3.5 flex items-center justify-between hover:bg-red-500/[0.02]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-foreground/80">{Math.round(event.speed)} km/h</span>
                          <span className="text-[9px] font-bold text-red-500/40 uppercase tracking-tighter">vs {Math.round(event.limit)} límite</span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase font-mono">
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' }) : "—"} • {event.timestamp ? new Date(event.timestamp).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' }) : "—"}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-red-500/5 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-red-500/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
