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
    <div className="flex flex-col gap-3 border-r border-border p-6 last:border-r-0 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground mb-1">
          {label}
        </p>
        <h4 className="text-2xl font-semibold tracking-tight text-foreground">
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
