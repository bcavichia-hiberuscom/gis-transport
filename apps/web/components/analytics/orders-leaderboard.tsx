"use client";

import { useMemo } from "react";
import { MapPin, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderLeaderboardItem {
  id: string | number;
  label: string;
  value: number;
  metric: "distance" | "time" | "priority";
  status?: "good" | "warning" | "critical";
}

interface OrdersLeaderboardProps {
  items?: OrderLeaderboardItem[];
}

const defaultItems: OrderLeaderboardItem[] = [
  { id: "ord-001", label: "Orden #001", value: 125.5, metric: "distance", status: "good" },
  { id: "ord-002", label: "Orden #002", value: 98.3, metric: "distance", status: "good" },
  { id: "ord-003", label: "Orden #003", value: 156.8, metric: "distance", status: "warning" },
  { id: "ord-004", label: "Orden #004", value: 45.2, metric: "distance", status: "good" },
  { id: "ord-005", label: "Orden #005", value: 203.1, metric: "distance", status: "critical" },
];

export function OrdersLeaderboard({
  items = defaultItems,
}: OrdersLeaderboardProps) {
  const sortedItems = useMemo(() => {
    return [...(items || [])].sort((a, b) => b.value - a.value);
  }, [items]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "distance":
        return <MapPin className="h-3.5 w-3.5" />;
      case "time":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <Zap className="h-3.5 w-3.5" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "distance":
        return "km";
      case "time":
        return "horas";
      default:
        return "unidades";
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900">
            Top Pedidos por Distancia
          </h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Entregas más distantes
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedItems.slice(0, 5).map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-lg hover:shadow-sm transition-all group"
          >
            {/* Rank Badge */}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-black text-[10px]">
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase text-slate-900 truncate">
                  {item.label}
                </span>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", getStatusColor(item.status))}>
                  {item.value.toFixed(1)} {getMetricLabel(item.metric)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-tighter font-semibold flex items-center gap-1 w-fit">
                  {getMetricIcon(item.metric)}
                  <span>{item.metric === "distance" ? "Distancia" : item.metric === "time" ? "Tiempo" : "Prioridad"}</span>
                </span>
              </div>
            </div>

            {/* Icon */}
            <div className={cn("shrink-0 flex items-center justify-center w-8 h-8 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity", getStatusColor(item.status))}>
              {getMetricIcon(item.metric)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
