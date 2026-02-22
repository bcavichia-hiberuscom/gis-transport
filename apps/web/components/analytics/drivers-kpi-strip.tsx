"use client";

import { cn } from "@/lib/utils";
import { Users2, ShieldAlert, Award, Activity } from "lucide-react";

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
  trend?: { value: string; positive: boolean };
}

function KPIItem({ label, value, icon: Icon, trend }: KPIItemProps) {
  return (
    <div className="kpi-card group">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 flex items-center justify-center bg-[#F7F8FA] border border-[#EAEAEA] text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C] transition-all">
          <Icon strokeWidth={1.5} className="h-4 w-4" />
        </div>
        {trend && (
          <span className={cn(
            trend.positive ? "trend-up" : "trend-down"
          )}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.1em]">
          {label}
        </span>
        <h4 className="text-[32px] font-medium tracking-tight text-[#1C1C1C] leading-none tabular-nums">
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
    <div className={cn("flex flex-col bg-white", className)}>
      {(title || actions) && (
        <div className="px-10 py-6 flex items-center justify-between gap-6 border-b border-[#EAEAEA]">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-[13px] font-medium tracking-tight text-[#1C1C1C]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#6B7280]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center shrink-0">{actions}</div>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem label="Operadores Activos" value={activeDriversCount} icon={Users2} trend={trends?.active} />
        <KPIItem label="Seguridad Vial" value={`${avgScore}%`} icon={Award} trend={trends?.score} />
        <KPIItem label="Incidencias" value={totalSpeedingEvents} icon={ShieldAlert} trend={trends?.alerts} />
        <KPIItem label="Cumplimiento" value="98.2%" icon={Activity} trend={{ value: "0.5%", positive: true }} />
      </div>
    </div>
  );
}
