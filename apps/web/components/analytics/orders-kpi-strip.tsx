"use client";

import { Activity, Package, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdersKPIStripProps {
  totalJobs?: number;
  completedJobs?: number;
  pendingJobs?: number;
  completionRate?: number;
  trends?: {
    total?: { value: string; positive: boolean } | null;
    completed?: { value: string; positive: boolean } | null;
    pending?: { value: string; positive: boolean } | null;
    sla?: { value: string; positive: boolean } | null;
  };
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
          <span className={cn(trend.positive ? "trend-up" : "trend-down")}>
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

export function OrdersKPIStrip({
  totalJobs = 0,
  completedJobs = 0,
  pendingJobs = 0,
  completionRate = 0,
  trends,
}: OrdersKPIStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPIItem label="Total Pedidos" value={totalJobs} icon={Package} trend={trends?.total || undefined} />
      <KPIItem label="Completados" value={completedJobs} icon={CheckCircle2} trend={trends?.completed || undefined} />
      <KPIItem label="En Curso" value={pendingJobs} icon={Activity} trend={trends?.pending || undefined} />
      <KPIItem label="SLA Objetivo" value={`${completionRate}%`} icon={Zap} trend={trends?.sla || undefined} />
    </div>
  );
}
