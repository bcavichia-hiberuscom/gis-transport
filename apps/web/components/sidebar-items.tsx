"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Car, Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleType, FleetJob, FleetVehicle } from "@gis/shared";
import type { Alert } from "@/lib/utils";

interface VehicleItemProps {
  id: string | number;
  type: VehicleType;
  isSelected: boolean;
  alerts?: Alert[];
  onSelect: (id: string | number) => void;
  onRemove: (id: string | number) => void;
}

export const VehicleItem = memo(
  function VehicleItem({
    id,
    type,
    isSelected,
    onSelect,
    onRemove,
  }: VehicleItemProps) {
    return (
      <div
        onClick={() => onSelect(id)}
        className={cn(
          "relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group",
          isSelected
            ? "bg-primary/[0.05] border-primary/30 shadow-[0_4px_12px_-4px_rgba(var(--primary-rgb),0.1)]"
            : "bg-muted/30 border-border/20 shadow-sm",
        )}
      >
        {/* Selection indicator track */}
        {isSelected && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div
            className={cn(
              "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
              isSelected
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-muted/60 text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105",
            )}
          >
            <Car className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className={cn(
              "text-[13px] font-black tracking-tight truncate transition-colors",
              isSelected ? "text-foreground" : "text-foreground group-hover:text-primary"
            )}>
              {type.label}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black text-muted-foreground font-mono tracking-tighter bg-muted px-1.5 py-0.5 rounded border border-border group-hover:text-muted-foreground transition-colors uppercase">
                ID-{String(id).split("-").pop()?.slice(0, 4).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/40 hover:text-red-500 hover:bg-red-50/50 rounded-lg relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  },
  (prev: VehicleItemProps, next: VehicleItemProps) => {
    return (
      prev.id === next.id &&
      prev.type === next.type &&
      prev.isSelected === next.isSelected &&
      prev.alerts === next.alerts &&
      prev.onSelect === next.onSelect &&
      prev.onRemove === next.onRemove
    );
  },
);

interface JobItemProps {
  id: string | number;
  label: string;
  onRemove: (id: string | number) => void;
}

export const JobItem = memo(
  function JobItem({ id, label, onRemove }: JobItemProps) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/15 shadow-sm transition-all group relative">
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md group-hover:shadow-orange-500/10">
            <Package className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-black text-foreground group-hover:text-primary tracking-tight truncate">{label}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Pedido • Entrega</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/40 hover:text-red-500 hover:bg-red-50/50 rounded-lg relative z-10"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  },
  (prev: JobItemProps, next: JobItemProps) => {
    return (
      prev.id === next.id &&
      prev.label === next.label &&
      prev.onRemove === next.onRemove
    );
  },
);

interface JobsListProps {
  jobs: FleetJob[];
  onRemove: (id: string | number) => void;
}

export const JobsList = memo(
  function JobsList({ jobs, onRemove }: JobsListProps) {
    return (
      <>
        {jobs.map((j: FleetJob) => (
          <JobItem key={j.id} id={j.id} label={j.label} onRemove={onRemove} />
        ))}
      </>
    );
  },
  (prev: JobsListProps, next: JobsListProps) => {
    return prev.jobs === next.jobs && prev.onRemove === next.onRemove;
  },
);

interface VehiclesListProps {
  vehicles: FleetVehicle[];
  selectedVehicleId: string | number | null;
  vehicleAlerts?: Record<string | number, Alert[]>;
  onSelect: (id: string | number | null) => void;
  onRemove: (id: string | number) => void;
}

export const VehiclesList = memo(
  function VehiclesList({
    vehicles,
    selectedVehicleId,
    vehicleAlerts = {},
    onSelect,
    onRemove,
  }: VehiclesListProps) {
    return (
      <>
        {vehicles.map((v: FleetVehicle) => (
          <VehicleItem
            key={v.id}
            id={v.id}
            type={v.type}
            isSelected={selectedVehicleId === v.id}
            alerts={vehicleAlerts[v.id] || []}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </>
    );
  },
  (prev: VehiclesListProps, next: VehiclesListProps) => {
    return (
      prev.vehicles === next.vehicles &&
      prev.selectedVehicleId === next.selectedVehicleId &&
      prev.vehicleAlerts === next.vehicleAlerts &&
      prev.onSelect === next.onSelect &&
      prev.onRemove === next.onRemove
    );
  },
);
