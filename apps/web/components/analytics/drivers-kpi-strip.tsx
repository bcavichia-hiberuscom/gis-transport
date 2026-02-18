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
}

function KPIItem({ label, value, icon: Icon }: KPIItemProps) {
  return (
    <div className="flex flex-col gap-5 border-r border-slate-100 p-8 last:border-r-0 hover:bg-slate-50/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 flex items-center justify-center border border-slate-200 bg-white text-slate-400 rounded-xl">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">
          {label}
        </p>
        <h4 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
          {value}
        </h4>
      </div>
      <div className="h-[1px] w-full bg-slate-100 mt-1" />
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
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border-b border-slate-100",
        className,
      )}
    >
      <KPIItem label="Personnel" value={activeDriversCount} icon={Users2} />
      <KPIItem
        label="Security Score"
        value={`${avgScore}%`}
        icon={TrendingUp}
      />
      <KPIItem label="Alerts" value={totalSpeedingEvents} icon={ShieldAlert} />
      <KPIItem label="Efficiency" value="98.2%" icon={Award} />
    </div>
  );
}
