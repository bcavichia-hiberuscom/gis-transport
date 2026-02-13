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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  cn,
  getDriverIsAvailable,
  getDriverOnTimeRate,
  getDriverCurrentVehicle,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      className="group relative bg-card border border-border/40 rounded-2xl p-4 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 cursor-pointer overflow-hidden"
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
              <h3 className="text-sm font-bold tracking-tight text-foreground truncate">
                {driver.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {driver.speedingEvents && driver.speedingEvents.length > 0 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                )}
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    driver.isAvailable ? "bg-green-500" : "bg-orange-500",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-tight">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{driver.licenseType || "Cat. B"}</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{getDriverOnTimeRate(driver)}% Puntual</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {driver.currentVehicleId && (
        <div className="mt-3 pt-3 border-t border-border/30 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-lg border border-border/40">
              <Car className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[11px] font-bold uppercase text-foreground/80">
                {fleetVehicles.some(
                  (v) => String(v.id) === String(driver.currentVehicleId),
                )
                  ? `ID: ${getDriverCurrentVehicle(driver)?.registration}`
                  : `Ultimo vehiculo asignado: ${driver.currentVehicleId}`}
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
                className="w-full h-8 mt-2 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onVehicleSelect(String(driver.currentVehicleId));
                }}
              >
                <Car className="h-3.5 w-3.5 mr-1.5" />
                Monitorear vehículo en dashboard
              </Button>
            )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      <div className="p-5 pb-4 flex flex-col gap-4 border-b border-border/10 bg-gradient-to-b from-primary/5 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">
              Conductores
            </h2>
            <p className="text-xs uppercase font-semibold text-muted-foreground/60 tracking-wider mt-1">
              Gestión de Personal
            </p>
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
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre o licencia..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-10 h-10 bg-muted/30 border-border/40 hover:border-primary/20 focus:bg-background transition-all rounded-xl text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-3">
          <div className="space-y-4 pb-4">
            {/* Available Drivers Group */}
            <div className="space-y-2">
              <button
                onClick={() => toggleGroup("available")}
                className="w-full flex items-center justify-between px-1 py-1.5 hover:bg-muted/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">
                    Disponibles ({groups.available.length})
                  </span>
                </div>
                {expandedGroups.available ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {expandedGroups.available && (
                <div className="max-h-[300px] overflow-y-auto space-y-3 pt-1 pr-1">
                  {groups.available.length > 0 ? (
                    groups.available.map(renderDriverCard)
                  ) : (
                    <div className="py-3 text-center text-xs font-semibold text-muted-foreground/50 bg-muted/20 rounded-xl border-2 border-dashed border-border/40">
                      No hay conductores disponibles
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Drivers Group */}
          <div className="space-y-2">
            <button
              onClick={() => toggleGroup("assigned")}
              className="w-full flex items-center justify-between px-1 py-1.5 hover:bg-muted/30 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">
                  Asignados ({groups.assigned.length})
                </span>
              </div>
              {expandedGroups.assigned ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedGroups.assigned && (
              <div className="max-h-[400px] overflow-y-auto space-y-3 pt-1 pr-1">
                {groups.assigned.length > 0 ? (
                  groups.assigned.map(renderDriverCard)
                ) : (
                  <div className="py-3 text-center text-xs font-semibold text-muted-foreground/50 bg-muted/20 rounded-xl border-2 border-dashed border-border/40">
                    No hay conductores asignados
                  </div>
                )}
              </div>
            )}
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
