"use client";

import { AddDriverDialog } from "./add-driver-dialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  UserPlus,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Car,
  Search,
} from "lucide-react";
import {
  cn,
  getDriverIsAvailable,
  getDriverOnTimeRate,
  getDriverCurrentVehicle,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/sidebar-components";
import type { Driver, FleetVehicle } from "@gis/shared";

type FilterType = "all" | "available" | "assigned";

interface DriversTabProps {
  drivers: Driver[];
  fleetVehicles: FleetVehicle[];
  isLoading: boolean;
  addDriver: (driver: Partial<Driver>) => Promise<Driver | undefined>;
  fetchDrivers: () => Promise<void>;
  onDriverSelect?: (driver: Driver) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  // Persisted toggle state from parent
  expandedGroups?: Record<string, boolean>;
  onToggleGroup?: (group: string, isExpanded: boolean) => void;
}

export function DriversTab({
  drivers,
  fleetVehicles,
  isLoading,
  addDriver,
  fetchDrivers,
  onDriverSelect,
  onVehicleSelect,
  expandedGroups: externalExpandedGroups,
  onToggleGroup,
}: DriversTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use external state if provided, otherwise use local state
  const [localExpandedGroups, setLocalExpandedGroups] = useState<
    Record<string, boolean>
  >({
    available: false,
    assigned: false,
  });

  const expandedGroups = externalExpandedGroups ?? localExpandedGroups;

  const toggleGroup = (group: string) => {
    const newValue = !expandedGroups[group];
    if (onToggleGroup) {
      onToggleGroup(group, newValue);
    } else {
      setLocalExpandedGroups((prev) => ({ ...prev, [group]: newValue }));
    }
  };

  // Filter and group drivers
  const groups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.licenseType?.toLowerCase().includes(q) ||
        d.currentVehicleId?.toString().includes(q),
    );

    return {
      available: filtered.filter((d) => getDriverIsAvailable(d)),
      assigned: filtered.filter((d) => !getDriverIsAvailable(d)),
    };
  }, [drivers, searchQuery]);

  const renderDriverCard = (driver: Driver) => (
    <div
      key={driver.id}
      onClick={() => onDriverSelect?.(driver)}
      className="group relative bg-muted/20 border border-border/15 rounded-2xl p-4 shadow-sm hover:border-primary/30 hover:shadow-md cursor-pointer"
    >
      <div className="flex gap-3 items-center relative z-10">
        <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          {driver.imageUrl ? (
            <img
              src={driver.imageUrl}
              alt={driver.name}
              className="h-full w-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center">
              <Users className="h-6 w-6 text-primary/30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-black tracking-tight text-foreground truncate transition-colors">
                {driver.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {driver.speedingEvents && driver.speedingEvents.length > 0 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                )}
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-300",
                    driver.isAvailable ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">{driver.licenseType || "Cat. B"}</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-border" />
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">{getDriverOnTimeRate(driver)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {driver.currentVehicleId && (
        <div className="mt-3.5 pt-3.5 border-t border-border/30 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-muted/20 rounded-xl border border-transparent group-hover:bg-muted/30 transition-colors">
              <Car className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase text-foreground tracking-widest">
                {fleetVehicles.some(
                  (v) => String(v.id) === String(driver.currentVehicleId),
                )
                  ? `Último: ${getDriverCurrentVehicle(driver)?.registration}`
                  : `ID: ${driver.currentVehicleId}`}
              </span>
            </div>
          </div>
          {fleetVehicles.some(
            (v) => String(v.id) === String(driver.currentVehicleId),
          ) &&
            onVehicleSelect && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 mt-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/[0.03] hover:border-primary/40 hover:text-primary border-dashed shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onVehicleSelect(String(driver.currentVehicleId));
                }}
              >
                <Car className="h-4 w-4 mr-2" />
                Rastrear Dashboard
              </Button>
            )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      <div className="p-5 pb-4 flex flex-col gap-4 border-b border-border/5 bg-gradient-to-b from-primary/[0.02] to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Equipo
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] mt-1.5 flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Gestión de personal
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.05] transition-transform"
              onClick={() => setIsAddOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within/search:text-primary transition-colors duration-300" />
          <Input
            placeholder="Filtro rápido..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-9 h-9 bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded-xl text-[12px] font-medium placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-3 pb-4">
          <div className="space-y-1">
            {/* Available Drivers Group */}
            <div>
              <SectionHeader
                label="En Servicio"
                count={groups.available.length}
                dotColorClass="bg-emerald-500"
                dotShadowClass="shadow-emerald-500/20"
                isExpanded={!!expandedGroups.available}
                onToggle={() => toggleGroup("available")}
                sticky
              />
              {expandedGroups.available && (
                <div className="space-y-2.5 pt-1.5 px-0.5">
                  {groups.available.length > 0 ? (
                    groups.available.map(renderDriverCard)
                  ) : (
                    <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed border-border/30">
                      <p className="text-[9px] text-muted-foreground/20 font-bold uppercase tracking-widest">
                        Sin personal disponible
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assigned Drivers Group */}
            <div className="mt-4">
              <SectionHeader
                label="En Operación"
                count={groups.assigned.length}
                dotColorClass="bg-blue-500"
                dotShadowClass="shadow-blue-500/20"
                isExpanded={!!expandedGroups.assigned}
                onToggle={() => toggleGroup("assigned")}
                sticky
              />
              {expandedGroups.assigned && (
                <div className="space-y-2.5 pt-1.5 px-0.5">
                  {groups.assigned.length > 0 ? (
                    groups.assigned.map(renderDriverCard)
                  ) : (
                    <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed border-border/30">
                      <p className="text-[9px] text-muted-foreground/20 font-bold uppercase tracking-widest">
                        Sin personal asignado
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <AddDriverDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={async (val) => {
          await addDriver(val);
          setIsAddOpen(false);
          await fetchDrivers();
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
