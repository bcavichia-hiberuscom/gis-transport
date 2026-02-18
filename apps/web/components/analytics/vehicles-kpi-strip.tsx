"use client";

import { Activity, Wrench, Zap, Gauge } from "lucide-react";

interface VehiclesKPIStripProps {
  totalVehicles?: number;
  availableVehicles?: number;
  maintenanceVehicles?: number;
  avgConsumption?: number;
}

export function VehiclesKPIStrip({
  totalVehicles = 0,
  availableVehicles = 0,
  maintenanceVehicles = 0,
  avgConsumption = 0,
}: VehiclesKPIStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-slate-100">
      {/* Total Vehículos */}
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm bg-sky-50 text-sky-600">
            <Gauge className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-sky-500">
            Total Vehículos
          </p>
          <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {totalVehicles}
          </h4>
        </div>
        <div className="h-[1px] w-full mt-1 bg-sky-100" />
      </div>

      {/* Disponibles */}
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm bg-emerald-50 text-emerald-600">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-emerald-500">
            Disponibles
          </p>
          <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {availableVehicles}
          </h4>
        </div>
        <div className="h-[1px] w-full mt-1 bg-emerald-100" />
      </div>

      {/* Mantenimiento */}
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm bg-amber-50 text-amber-600">
            <Wrench className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-amber-500">
            Mantenimiento
          </p>
          <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {maintenanceVehicles}
          </h4>
        </div>
        <div className="h-[1px] w-full mt-1 bg-amber-100" />
      </div>

      {/* Consumo Promedio */}
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm bg-rose-50 text-rose-600">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-rose-500">
            Consumo Promedio
          </p>
          <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {avgConsumption.toFixed(1)} L/100km
          </h4>
        </div>
        <div className="h-[1px] w-full mt-1 bg-rose-100" />
      </div>
    </div>
  );
}
