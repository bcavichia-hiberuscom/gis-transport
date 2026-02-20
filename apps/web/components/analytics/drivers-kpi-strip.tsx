"use client";

import { cn } from "@/lib/utils";
import { Users2, ShieldAlert, Award, TrendingUp } from "lucide-react";

interface DriversKPIStripProps {
  className?: string;
  activeDriversCount: number;
  totalSpeedingEvents: number;
  avgScore: number;
  trends?: {
    active?: { value: string; positive: boolean };
    score?: { value: string; positive: boolean };
    alerts?: { value: string; positive: boolean };
  };
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
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
            <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-1">vs periodo anterior</span>
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

export function DriversKPIStrip({
  className,
  activeDriversCount,
  totalSpeedingEvents,
  avgScore,
  trends,
  title,
  subtitle,
  actions,
}: DriversKPIStripProps) {
  return (
    <div className={cn("flex flex-col bg-white border-b border-slate-100", className)}>
      {(title || actions) && (
        <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/5">
          <div className="flex flex-col gap-1">
            {title && (
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center shrink-0">{actions}</div>}
        </div>
      )}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50/10",
        )}
      >
        <KPIItem label="Operadores Activos" value={activeDriversCount} icon={Users2} tone="blue" trend={trends?.active} />
        <KPIItem label="Puntaje Seguridad" value={`${avgScore}%`} icon={TrendingUp} tone="green" trend={trends?.score} />
        <KPIItem label="Alertas Telemetría" value={totalSpeedingEvents} icon={ShieldAlert} tone="red" trend={trends?.alerts} />
        <KPIItem label="Eficiencia Servicio" value="98.2%" icon={Award} tone="amber" trend={{ value: "0.5%", positive: true }} />
      </div>
    </div>
  );
}
