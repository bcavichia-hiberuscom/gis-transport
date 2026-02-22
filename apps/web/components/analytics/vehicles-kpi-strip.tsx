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

export function VehiclesKPIStrip({
  totalVehicles = 0,
  availableVehicles = 0,
  maintenanceVehicles = 0,
  avgConsumption = 0,
  trends,
}: VehiclesKPIStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPIItem label="Total Flota" value={totalVehicles} icon={Gauge} trend={trends?.total} />
      <KPIItem label="Disponibles" value={availableVehicles} icon={Activity} trend={trends?.available} />
      <KPIItem label="En Mantenimiento" value={maintenanceVehicles} icon={Wrench} trend={trends?.maintenance} />
      <KPIItem label="Consumo Medio" value={`${avgConsumption.toFixed(1)} L/100`} icon={Zap} trend={trends?.consumption} />
    </div>
  );
}
