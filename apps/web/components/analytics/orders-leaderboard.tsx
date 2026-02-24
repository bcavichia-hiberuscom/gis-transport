"use client";

import { useMemo } from "react";
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

const STATUS_CONFIG = {
  good: { dot: "bg-[#D4F04A]", text: "text-[#5D6B1A]", badge: "bg-[#D4F04A]/10 border-[#D4F04A]/30 text-[#5D6B1A]", label: "En Tiempo" },
  warning: { dot: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-50 border-amber-200 text-amber-700", label: "Atención" },
  critical: { dot: "bg-red-500", text: "text-red-700", badge: "bg-red-50 border-red-200 text-red-700", label: "Crítico" },
  default: { dot: "bg-[#EAEAEA]", text: "text-[#6B7280]", badge: "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]", label: "---" },
};

export function OrdersLeaderboard({ items = defaultItems }: OrdersLeaderboardProps) {
  const sortedItems = useMemo(() => {
    return [...(items || [])].sort((a, b) => b.value - a.value);
  }, [items]);

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAEAEA]">
        <div>
          <p className="chart-title">Monitor de Cumplimiento SLA</p>
          <p className="chart-subtitle">Detección proactiva de entregas en riesgo</p>
        </div>
        <span className="trend-down">Activo</span>
      </div>

      <div className="flex flex-col divide-y divide-[#F7F8FA]">
        {sortedItems.slice(0, 5).map((item, index) => {
          const cfg = STATUS_CONFIG[item.status || "default"];
          const maxVal = sortedItems[0]?.value || 1;
          const pct = Math.round((item.value / maxVal) * 100);

          return (
            <div
              key={item.id}
              className="group flex items-center justify-between py-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer px-2 -mx-2"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <span className="text-[11px] font-medium text-[#6B7280] w-5 text-center tabular-nums">{index + 1}</span>
                {/* Status dot */}
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot)} />
                {/* Label */}
                <div>
                  <p className="text-[13px] font-medium text-[#1C1C1C] leading-none">{item.label}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 uppercase tracking-wide">Prioritario · Punto {index + 1}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Progress bar */}
                <div className="hidden sm:flex items-center gap-2 w-24">
                  <div className="flex-1 h-1 bg-[#F7F8FA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C1C1C] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#6B7280] tabular-nums">{pct}%</span>
                </div>

                {/* Metric */}
                <div className="text-right min-w-[56px]">
                  <p className="text-[14px] font-medium text-[#1C1C1C] tabular-nums">{item.value.toFixed(1)}</p>
                  <p className="text-[9px] text-[#6B7280] uppercase">km</p>
                </div>

                {/* Status badge */}
                <span className={cn(
                  "text-[9px] font-medium px-2 py-0.5 border rounded-sm uppercase tracking-wide hidden md:block",
                  cfg.badge
                )}>
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
