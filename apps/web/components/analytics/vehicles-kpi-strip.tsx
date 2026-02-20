"use client";

import { Activity, Wrench, Zap, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehiclesKPIStripProps {
  totalVehicles?: number;
  availableVehicles?: number;
  maintenanceVehicles?: number;
  avgConsumption?: number;
  trends?: {
    total?: { value: string; positive: boolean };
    available?: { value: string; positive: boolean };
    maintenance?: { value: string; positive: boolean };
    consumption?: { value: string; positive: boolean };
  };
}

interface KPIItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "blue" | "green" | "red" | "amber";
  trend?: { value: string; positive: boolean };
}

function KPIItem({ label, value, icon: Icon, tone = "blue", trend }: KPIItemProps) {
  const toneMap: Record<string, { iconBg: string; iconText: string; dot: string }> = {
    blue: { iconBg: "bg-blue-50/50", iconText: "text-blue-600", dot: "bg-blue-500" },
    green: { iconBg: "bg-emerald-50/50", iconText: "text-emerald-600", dot: "bg-emerald-500" },
    red: { iconBg: "bg-rose-50/50", iconText: "text-rose-600", dot: "bg-rose-500" },
    amber: { iconBg: "bg-amber-50/50", iconText: "text-amber-600", dot: "bg-amber-500" },
  };

  const currentTone = toneMap[tone] || toneMap.blue;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white border border-slate-100 rounded-xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-200 transition-all group relative overflow-hidden">
      {/* Subtle indicator dot */}
      <div className={cn("absolute top-6 right-6 h-1 w-1 rounded-full", currentTone.dot)} />

      <div className="flex items-center justify-between">
        <div className={cn(
          "h-10 w-10 flex items-center justify-center rounded-lg border border-slate-100 transition-colors group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800",
          currentTone.iconBg,
          currentTone.iconText
        )}>
          <Icon className="h-4 w-4 stroke-[2.5]" />
        </div>
        {trend && (
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-[9px] font-black tracking-tighter tabular-nums px-1.5 py-0.5 rounded",
              trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend.positive ? "+" : "-"}{trend.value}
            </span>
            <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-1">Vs Last Period</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
          {label}
        </p>
        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          {value}
        </h4>
      </div>
    </div>
  );
}

export function VehiclesKPIStrip({
  totalVehicles = 0,
  availableVehicles = 0,
  maintenanceVehicles = 0,
  avgConsumption = 0,
  trends,
}: VehiclesKPIStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-8 bg-slate-50/10 border-b border-slate-100">
      <KPIItem label="Total Fleet" value={totalVehicles} icon={Gauge} tone="blue" trend={trends?.total} />
      <KPIItem label="Available" value={availableVehicles} icon={Activity} tone="green" trend={trends?.available} />
      <KPIItem label="Maintenance" value={maintenanceVehicles} icon={Wrench} tone="amber" trend={trends?.maintenance} />
      <KPIItem label="Avg Consumption" value={`${avgConsumption.toFixed(1)} L/100km`} icon={Zap} tone="red" trend={trends?.consumption} />
    </div>
  );
}
