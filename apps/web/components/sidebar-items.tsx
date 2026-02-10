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
          "relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group overflow-hidden",
          isSelected
            ? "bg-primary/5 border-primary/30 shadow-md shadow-primary/5"
            : "bg-card border-border/30 hover:border-primary/15 hover:shadow-sm",
        )}
      >

        <div className="flex items-center gap-3 relative z-10">
          <div
            className={cn(
              "relative h-9 w-9 rounded-lg flex items-center justify-center transition-all",
              isSelected
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-muted text-muted-foreground/50 group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            <Car className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold tracking-tight text-foreground/85">{type.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-medium text-muted-foreground/50 font-mono uppercase tracking-tight bg-muted/40 px-1 py-px rounded">
                {String(id).split("-").pop()?.slice(0, 6)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30 hover:border-orange-500/15 hover:shadow-sm transition-all group relative overflow-hidden">

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-lg bg-orange-100/40 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md group-hover:shadow-orange-500/15">
            <Package className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground/85 tracking-tight">{label}</span>
            <span className="text-[8px] font-medium text-muted-foreground/35 uppercase tracking-wide mt-0.5">Entrega</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md relative z-10"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
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
