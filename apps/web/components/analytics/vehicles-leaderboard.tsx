"use client";

import { useMemo } from "react";
import { Gauge, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleLeaderboardItem {
  id: string | number;
  label: string;
  value: number;
  metric: "consumption" | "health" | "utilization" | "maintenance";
  status?: "good" | "warning" | "critical";
}

interface VehiclesLeaderboardProps {
  vehicles?: VehicleLeaderboardItem[];
  title?: string;
  subtitle?: string;
}

const defaultVehicles: VehicleLeaderboardItem[] = [
  { id: "vh-001", label: "MAD-1001", value: 7.2, metric: "consumption", status: "good" },
  { id: "vh-002", label: "MAD-1002", value: 8.5, metric: "consumption", status: "warning" },
  { id: "vh-003", label: "MAD-1003", value: 22.5, metric: "consumption", status: "critical" },
  { id: "vh-004", label: "MAD-1004", value: 6.8, metric: "consumption", status: "good" },
  { id: "vh-005", label: "MAD-1005", value: 10.2, metric: "consumption", status: "warning" },
];

export function VehiclesLeaderboard({
  vehicles = defaultVehicles,
  title = "Rendimiento de Vehículos",
  subtitle = "Top consumo de combustible",
}: VehiclesLeaderboardProps) {
  const sortedVehicles = useMemo(() => {
    return [...(vehicles || [])].sort((a, b) => a.value - b.value);
  }, [vehicles]);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "consumption":
        return <Zap className="h-3 w-3" />;
      case "health":
        return <Gauge className="h-3 w-3" />;
      case "maintenance":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Gauge className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "bg-emerald-50 border-emerald-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "critical":
        return "bg-rose-50 border-rose-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case "good":
        return "text-emerald-700";
      case "warning":
        return "text-amber-700";
      case "critical":
        return "text-rose-700";
      default:
        return "text-slate-700";
    }
  };

  return (
    <div className="bg-white border-t border-slate-100 p-6 sm:p-8">
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {sortedVehicles.length > 0 ? (
          sortedVehicles.map((vehicle, idx) => (
            <div
              key={vehicle.id}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-sm",
                getStatusColor(vehicle.status)
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs">
                  {idx + 1}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <p className="text-sm font-black uppercase text-slate-900 truncate">
                    {vehicle.label}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                    {vehicle.metric === "consumption" && "Consumo"}
                    {vehicle.metric === "health" && "Salud"}
                    {vehicle.metric === "utilization" && "Utilización"}
                    {vehicle.metric === "maintenance" && "Mantenimiento"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn("text-lg font-extrabold tabular-nums", getStatusTextColor(vehicle.status))}>
                    {vehicle.value.toFixed(1)}
                    {vehicle.metric === "consumption" && " L/100km"}
                    {(vehicle.metric === "health" || vehicle.metric === "utilization") && "%"}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg", getStatusColor(vehicle.status))}>
                  {getMetricIcon(vehicle.metric)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">Sin datos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
