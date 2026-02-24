"use client";

import { Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, ShieldCheck, AlertTriangle, Clock, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { DriverFuelSummary } from "@gis/shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";



interface DriverDetailsSheetProps {
  driver: Driver | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function DriverDetailsSheet({
  driver,
  isOpen,
  onOpenChange,
  onClose,
}: DriverDetailsSheetProps) {
  const [fuelSummary, setFuelSummary] = useState<DriverFuelSummary | null>(null);
  const [loadingFuel, setLoadingFuel] = useState(false);

  useEffect(() => {
    if (!driver || !isOpen) return;

    const fetchFuelData = async () => {
      setLoadingFuel(true);
      try {
        const endDate = Date.now();
        const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
        const summary = await fuelService.getDriverFuelSummary(
          driver.id,
          startDate,
          endDate
        );
        setFuelSummary(summary);
      } catch (error) {
        console.error("Failed to fetch fuel summary:", error);
      } finally {
        setLoadingFuel(false);
      }
    };

    fetchFuelData();
  }, [driver, isOpen]);

  if (!driver) return null;

  const speedingCount = Array.isArray(driver.speedingEvents)
    ? driver.speedingEvents.length
    : 0;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 sm:max-w-[420px] border-l border-slate-200 shadow-2xl flex flex-col h-full bg-white">
        <SheetHeader className="sr-only">
          <SheetTitle>Expediente de Personal - {driver.name}</SheetTitle>
        </SheetHeader>

        {/* Header Tecnico */}
        <div className="shrink-0 border-b border-slate-100 px-8 py-8 bg-slate-50/30">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 rounded-lg hover:bg-white transition-colors"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4 text-slate-400" />
            </Button>
            <div className="flex items-center gap-4">
              <div className={cn("h-1.5 w-1.5 rounded-full", driver.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-900")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Disponibles</span>
              <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{driver.isAvailable ? 1 : 0}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900 ml-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">En Servicio</span>
              <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{driver.isAvailable ? 0 : 1}</span>
            </div>
          </div>

          <div className="flex items-end gap-6">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
              {driver.imageUrl ? (
                <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-slate-200 uppercase italic">
                  {driver.id.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Cód. Personal: {driver.id.substring(0, 8)}</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
                {driver.name}
              </h3>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            {/* Metricas de Auditoria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 group transition-colors hover:border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Eficacia</span>
                </div>
                <div className="text-3xl font-black italic text-slate-900 tracking-tighter">
                  {driver.onTimeDeliveryRate}%
                </div>
                <p className="text-[8px] font-bold text-emerald-600 uppercase mt-2 italic">Objetivo superado</p>
              </div>

              <div className={cn(
                "rounded-xl p-5 border transition-colors",
                speedingCount > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className={cn("h-3 w-3", speedingCount > 0 ? "text-rose-500" : "text-slate-400")} />
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest", speedingCount > 0 ? "text-rose-600" : "text-slate-400")}>
                    Infracciones
                  </span>
                </div>
                <div className={cn("text-3xl font-black italic tracking-tighter", speedingCount > 0 ? "text-rose-700" : "text-slate-900")}>
                  {speedingCount}
                </div>
                {speedingCount > 0 && <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 italic animate-pulse">Revisión necesaria</p>}
              </div>
            </div>

            {/* Datos Administrativos */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                Especificaciones Técnicas
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Permiso</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 italic uppercase">{driver.licenseType || "Categoria B"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Antigüedad</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 italic uppercase">{formatDate(driver.hireDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Contacto</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 italic uppercase">{driver.phoneNumber || "S/N Registrado"}</span>
                </div>
              </div>
            </section>

            {/* Analisis de Seguridad */}
            {speedingCount > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                  <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                    Historial de Telemetría (Incidentes)
                  </h4>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="space-y-2">
                  {driver.speedingEvents?.slice(0, 3).map((event: any, i: number) => (
                    <div
                      key={event.id || i}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-900 uppercase italic">Exceso Detectado</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">{new Date(event.timestamp).toLocaleDateString("es-ES")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-rose-600 italic leading-none">{Math.round(event.speed)} km/h</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Límite {Math.round(event.limit)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-slate-900 text-slate-900 font-black uppercase italic tracking-tighter text-sm hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-0.5"
              >
                Generar Informe de Personal
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
