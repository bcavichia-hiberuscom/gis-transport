"use client";

import { cn } from "@/lib/utils";
import { Users2, ShieldAlert, Award, TrendingUp } from "lucide-react";

interface DriversKPIStripProps {
  className?: string;
  activeDriversCount: number;
  totalSpeedingEvents: number;
  avgScore: number;
}

interface KPIItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "blue" | "green" | "red" | "amber";
}

function KPIItem({ label, value, icon: Icon, tone = "blue" }: KPIItemProps) {
  const toneMap: Record<string, { iconBg: string; iconText: string; divider: string; label: string }> = {
    blue: {
      iconBg: "bg-sky-50",
      iconText: "text-sky-600",
      divider: "bg-sky-100",
      label: "text-sky-500",
    },
    green: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      divider: "bg-emerald-100",
      label: "text-emerald-500",
    },
    red: {
      iconBg: "bg-rose-50",
      iconText: "text-rose-600",
      divider: "bg-rose-100",
      label: "text-rose-500",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      divider: "bg-amber-100",
      label: "text-amber-500",
    },
  };

  const toneCls = toneMap[tone] || toneMap.blue;

  return (
    <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
      <div className="flex items-center justify-between">
        <div className={cn(
          "h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors",
          toneCls.iconBg,
          toneCls.iconText,
          "border-transparent group-hover:opacity-95"
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 transition-colors", toneCls.label)}>
          {label}
        </p>
        <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900 transition-colors">
          {value}
        </h4>
      </div>
      <div className={cn("h-[1px] w-full mt-1 transition-colors", toneCls.divider)} />
    </div>
  );
}

export function DriversKPIStrip({
  className,
  activeDriversCount,
  totalSpeedingEvents,
  avgScore,
}: DriversKPIStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-transparent border-t border-slate-100",
        className,
      )}
    >
      <KPIItem label="Conductores" value={activeDriversCount} icon={Users2} tone="blue" />
      <KPIItem label="Puntaje Prom." value={`${avgScore}%`} icon={TrendingUp} tone="green" />
      <KPIItem label="Alertas" value={totalSpeedingEvents} icon={ShieldAlert} tone="red" />
      <KPIItem label="Eficiencia" value="98.2%" icon={Award} tone="amber" />
    </div>
  );
}
