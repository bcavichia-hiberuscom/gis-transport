"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Wrench, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetVehicle } from "@gis/shared";

interface MaintenanceManagementProps {
  fleetVehicles: FleetVehicle[];
  onAddMaintenance?: () => void;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  type: "preventive" | "corrective";
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: "pending" | "in-progress" | "completed";
}

export function MaintenanceManagement({
  fleetVehicles,
  onAddMaintenance,
}: MaintenanceManagementProps) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  const handleAddMaintenance = () => {
    onAddMaintenance?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Mantenimientos Programados
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
              Gestiona los mantenimientos de tu flota
            </p>
          </div>

          <Button
            onClick={handleAddMaintenance}
            className="h-10 px-6 sm:px-8 bg-slate-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase italic tracking-widest rounded-xl border border-slate-900 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2.5" />
            <span className="hidden sm:inline">Programar Mtto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {maintenances.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
              <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-sm mb-4">
                No hay mantenimientos programados
              </p>
              <Button
                onClick={handleAddMaintenance}
                className="bg-slate-900 text-white hover:bg-black text-[10px] font-black uppercase"
              >
                <Plus className="h-3 w-3 mr-1" />
                Programar Primer Mantenimiento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenances.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="bg-white border border-slate-100 rounded-lg p-4 hover:shadow-sm transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-black uppercase text-slate-900">
                          {
                            fleetVehicles.find(
                              (v) => v.id === maintenance.vehicleId
                            )?.id
                          }
                        </h4>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                            maintenance.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : maintenance.status === "in-progress"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-800"
                          )}
                        >
                          {maintenance.status === "completed"
                            ? "Completado"
                            : maintenance.status === "in-progress"
                              ? "En Progreso"
                              : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-2">
                        {maintenance.description}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {maintenance.scheduledDate.toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-black uppercase">
                          {maintenance.type === "preventive"
                            ? "Preventivo"
                            : "Correctivo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
