"use client";

import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Car,
  Plus,
  Trash2,
  X,
  Package,
  Warehouse,
  Route,
  LayoutDashboard,
  Users,
  Search,
  Pencil,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CustomPOI,
  Driver,
  FleetJob,
  FleetVehicle,
  LayerVisibility,
  POI,
  VehicleType,
} from "@gis/shared";
import type { Alert } from "@/lib/utils";
import { JobsList, VehiclesList } from "@/components/sidebar-items";
import { DriversTab } from "./drivers-tab";
import {
  SidebarLogo,
  NavigationButton,
  ExpandButton,
  FleetHeaderButtons,
  FleetActionButtons,
  FleetFooterButtons,
  SectionHeader,
  EmptyState,
} from "@/components/sidebar-components";
import { DriverDetailsSheet } from "./driver-details-sheet";

const STABLE_NOOP = () => { };
const STABLE_PROMISE_NOOP = () => Promise.resolve();

import { FleetDashboard } from "@/components/fleet-dashboard";

interface SidebarProps {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  selectedVehicle: VehicleType;
  setSelectedVehicle: (vehicle: VehicleType) => void;
  fleetMode: boolean;
  setFleetMode: (value: boolean) => void;
  clearFleet: () => void;
  fleetVehicles: FleetVehicle[];
  fleetJobs: FleetJob[];
  selectedVehicleId: string | number | null;
  setSelectedVehicleId: (id: string | number | null) => void;
  highlightVehicleOnly?: (id: string | number | null) => void;
  vehicleAlerts?: Record<string | number, Alert[]>;
  addVehicle: () => void;
  addJob: () => void;
  addStopToVehicle?: (
    vehicleId: string | number,
    position: [number, number],
    label?: string,
  ) => void;
  addJobDirectly?: (coords: [number, number], label: string) => void;
  removeVehicle: (vehicleId: string | number) => void;
  removeJob: (jobId: string | number) => void;
  cancelAddMode: () => void;
  startRouting: () => void;
  isCalculatingRoute?: boolean;
  setMapCenter: (coords: [number, number]) => void;
  customPOIs?: CustomPOI[];
  removeCustomPOI?: (id: string) => void;
  clearAllCustomPOIs?: () => void;
  showCustomPOIs?: boolean;
  setShowCustomPOIs?: (value: boolean) => void;
  onEditZone?: (zoneId: string) => void;
  isLoadingVehicles?: boolean;
  fetchVehicles?: () => Promise<void>;
  isAddJobOpen?: boolean;
  setIsAddJobOpen?: (value: boolean) => void;
  isAddCustomPOIOpen?: boolean;
  setIsAddCustomPOIOpen?: (value: boolean) => void;
  isLoadingLayers?: boolean;
  isTracking?: boolean;
  toggleTracking?: () => void;
  hasRoute?: boolean;
  isAddStopOpen?: boolean;
  setIsAddStopOpen?: (value: boolean) => void;
  addDriver?: (data: Partial<Driver>) => Promise<Driver | undefined>;
  gasStations?: POI[];
  onStartPickingStop: () => void;
  addMode: "vehicle" | "job" | null;
  isLoadingDrivers?: boolean;
  fetchDrivers?: () => Promise<void>;
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
  drivers?: Driver[];
  onAddStopSubmit?: (coords: [number, number], label: string) => void;
  pickedStopCoords?: [number, number] | null;
  isGasStationLayerVisible?: boolean;
  onToggleGasStationLayer?: () => void;
  onVehicleSelectFromDrivers?: (vehicleId: string) => void;
  onViewDriverProfile?: (driverId: string) => void;
  navigateToTab?: SidebarTab | null;
  navigateToDriverId?: string | null;
  onNavigateConsumed?: () => void;
}

export type SidebarTab =
  | "fleet"
  | "layers"
  | "dashboard"
  | "drivers"
  | "settings";

interface NavigationRailProps {
  activeTab: SidebarTab;
  isExpanded: boolean;
  onSetTab: (tab: SidebarTab) => void;
  onToggleExpand: () => void;
  totalAlerts: number;
}

const NavigationRail = memo(
  ({
    activeTab,
    isExpanded,
    onSetTab,
    onToggleExpand,
    totalAlerts,
  }: NavigationRailProps) => (
    <div className="w-16 h-full bg-background/80 backdrop-blur-xl border-r border-border/10 flex flex-col items-center py-6 gap-4 shadow-[1px_0_10px_rgba(0,0,0,0.02)] pointer-events-auto z-[1002] transition-all duration-300">
      <div className="mb-2">
        <SidebarLogo />
      </div>

      <div className="flex flex-col gap-3 w-full items-center">
        <NavigationButton
          tabId="fleet"
          activeTab={activeTab}
          isExpanded={isExpanded}
          onClick={onSetTab}
          label="Operaciones"
          icon={Route}
        />

        <NavigationButton
          tabId="layers"
          activeTab={activeTab}
          isExpanded={isExpanded}
          onClick={onSetTab}
          label="Capas"
          icon={Layers}
        />

        <NavigationButton
          tabId="drivers"
          activeTab={activeTab}
          isExpanded={isExpanded}
          onClick={onSetTab}
          label="Equipo"
          icon={Users}
        />

        <NavigationButton
          tabId="dashboard"
          activeTab={activeTab}
          isExpanded={isExpanded}
          onClick={onSetTab}
          label="Reportes"
          icon={LayoutDashboard}
          alertCount={totalAlerts}
        />
      </div>

      <div className="flex-1" />

      <ExpandButton isExpanded={isExpanded} onToggle={onToggleExpand} />
    </div>
  ),
);
NavigationRail.displayName = "NavigationRail";

interface FleetTabProps {
  isLoadingVehicles: boolean;
  fetchVehicles: () => Promise<void>;
  clearFleet: () => void;
  fleetVehicles: FleetVehicle[];
  fleetJobs: FleetJob[];
  vehicleAlerts?: Record<string | number, Alert[]>;
  addVehicle: () => void;
  onAddJobClick: () => void;
  cancelAddMode: () => void;
  selectedVehicleId: string | number | null;
  setSelectedVehicleId: (id: string | number | null) => void;
  removeVehicle: (id: string | number) => void;
  removeJob: (id: string | number) => void;
  startRouting: () => void;
  isCalculatingRoute: boolean;
  isTracking: boolean;
  toggleTracking: () => void;
  hasRoute: boolean;
  isAddStopOpen?: boolean;
  setIsAddStopOpen?: (open: boolean) => void;
  onStartPickingStop?: () => void;
  pickedStopCoords?: [number, number] | null;
  onAddStopSubmit?: (coords: [number, number], label: string) => void;
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
  drivers?: Driver[];
  addMode: "vehicle" | "job" | null;
}

const FleetTab = memo(
  ({
    isLoadingVehicles,
    fetchVehicles,
    clearFleet,
    fleetVehicles,
    fleetJobs,
    vehicleAlerts = {},
    addMode,
    addVehicle,
    onAddJobClick,
    cancelAddMode,
    selectedVehicleId,
    setSelectedVehicleId,
    removeVehicle,
    removeJob,
    startRouting,
    isCalculatingRoute,
    isTracking,
    toggleTracking,
    hasRoute,
  }: FleetTabProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Smart auto-expand: groups with ≤ 8 items start expanded
    const AUTO_EXPAND_THRESHOLD = 8;
    // Progressive disclosure: groups with > 15 items show truncated
    const DISCLOSURE_THRESHOLD = 15;

    const [expandedGroups, setExpandedGroups] = useState(() => ({
      vehicles: fleetVehicles.length <= AUTO_EXPAND_THRESHOLD,
      jobs: fleetJobs.length <= AUTO_EXPAND_THRESHOLD,
    }));

    // Disclosure state: track whether the user has requested "show all"
    const [showAllVehicles, setShowAllVehicles] = useState(false);
    const [showAllJobs, setShowAllJobs] = useState(false);

    const toggleGroup = (group: "vehicles" | "jobs") => {
      setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const filteredVehicles = fleetVehicles.filter(
      (v) =>
        v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const filteredJobs = fleetJobs.filter((j) =>
      j.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Auto-expand groups when search is active and has results
    const isSearching = searchQuery.length > 0;

    // Progressive disclosure: visible items
    const visibleVehicles =
      !showAllVehicles && !isSearching && filteredVehicles.length > DISCLOSURE_THRESHOLD
        ? filteredVehicles.slice(0, 10)
        : filteredVehicles;

    const visibleJobs =
      !showAllJobs && !isSearching && filteredJobs.length > DISCLOSURE_THRESHOLD
        ? filteredJobs.slice(0, 10)
        : filteredJobs;

    // Active trail: does the selected vehicle exist in the filtered list?
    const vehicleHasActiveChild = selectedVehicleId != null &&
      filteredVehicles.some((v) => v.id === selectedVehicleId);

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
        <div className="p-5 pb-4 flex flex-col gap-4 border-b border-border/5 bg-gradient-to-b from-primary/[0.02] to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
                Flota
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.1em] mt-1.5 flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-primary/40" />
                Control de activos
              </span>
            </div>
            <FleetHeaderButtons
              isLoading={isLoadingVehicles}
              hasData={fleetVehicles.length > 0 || fleetJobs.length > 0}
              onRefresh={fetchVehicles}
              onClear={clearFleet}
            />
          </div>

          {/* Compact Search Bar - Refined */}
          <div className="relative group/search">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within/search:text-primary transition-colors duration-300" />
            </div>
            <Input
              placeholder="Filtro rápido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all duration-300 rounded-xl text-[12px] font-medium placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <FleetActionButtons
          addMode={addMode}
          isRouting={isCalculatingRoute}
          onAddVehicle={addVehicle}
          onAddJob={onAddJobClick}
        />

        {/* Single scroll container — no nested scrollable regions */}
        <ScrollArea className="flex-1 min-h-0 px-4 py-3">
          <div className="space-y-1 pb-6">
            {addMode && (
              <div className="bg-primary text-primary-foreground p-3 rounded-xl flex items-center justify-between shadow-md shadow-primary/15 animate-in fade-in slide-in-from-top-1 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-tight">
                  Selecciona el punto en el mapa
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20 rounded-full"
                  onClick={cancelAddMode}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Vehicles Group — sticky header, no inner scroll */}
            <div>
              <SectionHeader
                label="Vehículos"
                count={filteredVehicles.length}
                dotColorClass="bg-primary"
                dotShadowClass="shadow-primary/40"
                isExpanded={expandedGroups.vehicles || isSearching}
                onToggle={() => toggleGroup("vehicles")}
                hasActiveChild={vehicleHasActiveChild}
                sticky
              />

              {(expandedGroups.vehicles || isSearching) && (
                <div className="space-y-2 pt-1 pl-1">
                  {visibleVehicles.length === 0 ? (
                    <EmptyState icon={Car} message="Sin vehículos" />
                  ) : (
                    <>
                      <VehiclesList
                        vehicles={visibleVehicles}
                        selectedVehicleId={selectedVehicleId}
                        vehicleAlerts={vehicleAlerts}
                        onSelect={setSelectedVehicleId}
                        onRemove={removeVehicle}
                      />
                      {/* Progressive disclosure link */}
                      {!showAllVehicles && !isSearching && filteredVehicles.length > DISCLOSURE_THRESHOLD && (
                        <button
                          onClick={() => setShowAllVehicles(true)}
                          className="w-full py-2 text-[10px] font-semibold text-primary hover:text-primary/80 uppercase tracking-wide transition-colors"
                        >
                          Mostrar todos ({filteredVehicles.length})
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Jobs Group — sticky header, no inner scroll */}
            <div>
              <SectionHeader
                label="Pedidos"
                count={filteredJobs.length}
                dotColorClass="bg-orange-500"
                dotShadowClass="shadow-orange-500/40"
                isExpanded={expandedGroups.jobs || isSearching}
                onToggle={() => toggleGroup("jobs")}
                sticky
              />

              {(expandedGroups.jobs || isSearching) && (
                <div className="space-y-2 pt-1 pl-1">
                  {visibleJobs.length === 0 ? (
                    <EmptyState icon={Package} message="Sin pedidos" />
                  ) : (
                    <>
                      <JobsList jobs={visibleJobs} onRemove={removeJob} />
                      {/* Progressive disclosure link */}
                      {!showAllJobs && !isSearching && filteredJobs.length > DISCLOSURE_THRESHOLD && (
                        <button
                          onClick={() => setShowAllJobs(true)}
                          className="w-full py-2 text-[10px] font-semibold text-primary hover:text-primary/80 uppercase tracking-wide transition-colors"
                        >
                          Mostrar todos ({filteredJobs.length})
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <FleetFooterButtons
          isRouting={isCalculatingRoute}
          hasData={fleetVehicles.length > 0 && fleetJobs.length > 0}
          hasRoute={hasRoute}
          isTracking={isTracking}
          onStartRouting={startRouting}
          onToggleTracking={toggleTracking}
        />
      </div>
    );
  },
  (prev: FleetTabProps, next: FleetTabProps) => {
    return (
      prev.isLoadingVehicles === next.isLoadingVehicles &&
      prev.fleetVehicles === next.fleetVehicles &&
      prev.fleetJobs === next.fleetJobs &&
      prev.addMode === next.addMode &&
      prev.selectedVehicleId === next.selectedVehicleId &&
      prev.isCalculatingRoute === next.isCalculatingRoute &&
      prev.isTracking === next.isTracking &&
      prev.hasRoute === next.hasRoute &&
      prev.drivers === next.drivers &&
      prev.onAssignDriver === next.onAssignDriver
    );
  },
);
FleetTab.displayName = "FleetTab";

interface LayersTabProps {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  customPOIs: CustomPOI[];
  onAddPOIClick: () => void;
  removeCustomPOI?: (id: string) => void;
  clearAllCustomPOIs?: () => void;
  onEditZone?: (zoneId: string) => void;
}

const LayersTab = memo(
  ({
    layers,
    toggleLayer,
    customPOIs,
    onAddPOIClick,
    removeCustomPOI,
    clearAllCustomPOIs,
    onEditZone,
  }: LayersTabProps) => {
    // Separate points and zones
    const pointPOIs = useMemo(
      () =>
        customPOIs.filter(
          (poi) => !poi.entityType || poi.entityType === "point",
        ),
      [customPOIs],
    );

    const zonePOIs = useMemo(
      () => customPOIs.filter((poi) => poi.entityType === "zone"),
      [customPOIs],
    );

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
        <div className="p-5 pb-4 flex flex-col gap-1 border-b border-border/5 bg-gradient-to-b from-primary/[0.02] to-transparent shrink-0">
          <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
            Visibilidad
          </h2>
          <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.1em] mt-1.5 flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-cyan-500/40" />
            Configuración de mapa
          </span>
        </div>
        {/* Single scroll container — no nested scrollable regions */}
        <ScrollArea className="flex-1 min-h-0 px-4 py-2">
          <div className="space-y-6 pb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase text-foreground/40 tracking-wider">
                  Capas Base
                </span>
                <Badge variant="outline" className="text-[9px] font-bold h-4 px-1.5 border-border/40 text-muted-foreground/60 uppercase">
                  SISTEMA
                </Badge>
              </div>
              <div className="space-y-1.5 px-0.5">
                {Object.entries(layers).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-transparent hover:border-border/40 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all duration-300",
                          value
                            ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] scale-125"
                            : "bg-muted-foreground/20",
                        )}
                      />
                      <span className={cn(
                        "text-[12px] font-bold capitalize transition-colors",
                        value ? "text-foreground" : "text-foreground/50 group-hover:text-foreground/70"
                      )}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={() =>
                        toggleLayer(key as keyof LayerVisibility)
                      }
                      className="scale-75 origin-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase text-foreground/40 tracking-wider">
                  Puntos de Interés
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold border-primary/20 text-primary h-4 bg-primary/5 px-1.5"
                >
                  {pointPOIs.length}
                </Badge>
              </div>

              <Button
                variant="outline"
                className="w-full justify-center text-[10px] font-bold uppercase tracking-wider h-9 rounded-xl border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/[0.02] hover:text-primary transition-all duration-300"
                onClick={onAddPOIClick}
              >
                <Plus className="h-3 w-3 mr-2" /> Nuevo Registro
              </Button>

              {pointPOIs.length > 0 && (
                <div className="space-y-1.5 px-0.5">
                  {pointPOIs.map((poi: CustomPOI) => (
                    <div
                      key={poi.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 hover:border-cyan-500/20 hover:bg-cyan-500/[0.01] transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 overflow-hidden relative z-10">
                        <div className="h-8 w-8 rounded-lg bg-cyan-50/50 border border-cyan-100/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <Warehouse className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-bold text-foreground/80 truncate group-hover:text-foreground">
                            {poi.name}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mt-0.5">
                            {poi.position?.[0].toFixed(3)}°N, {poi.position?.[1].toFixed(3)}°E
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all"
                        onClick={() => removeCustomPOI?.(poi.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase text-foreground/40 tracking-wider">
                  Zonas Definidas
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold border-blue-200/50 text-blue-600 h-4 bg-blue-50/20 px-1.5"
                >
                  {zonePOIs.length}
                </Badge>
              </div>

              {zonePOIs.length > 0 ? (
                <div className="space-y-1.5 px-0.5">
                  {zonePOIs.map((zone: CustomPOI) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 hover:border-blue-500/20 hover:bg-blue-500/[0.01] transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 overflow-hidden relative z-10">
                        <div className="h-8 w-8 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <Package className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-bold text-foreground/80 truncate group-hover:text-foreground">
                            {zone.name}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter mt-0.5">
                            {zone.zoneType || "CUSTOM"} • {zone.requiredTags?.length || 0} TAGS
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/30 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg"
                          onClick={() => onEditZone?.(zone.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/30 hover:text-red-500 hover:bg-red-50/50 rounded-lg"
                          onClick={() => removeCustomPOI?.(zone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-muted/10 rounded-2xl border border-dashed border-border/30">
                  <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                    Sin zonas activas
                  </span>
                </div>
              )}
            </div>

            {/* Consolidated clear action — single button for all custom data */}
            {(pointPOIs.length > 0 || zonePOIs.length > 0) && (
              <div className="pt-3 border-t border-border/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-[9px] font-semibold uppercase tracking-wide rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-transparent hover:border-red-100"
                  onClick={clearAllCustomPOIs}
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  },
  (prev: LayersTabProps, next: LayersTabProps) => {
    return prev.layers === next.layers && prev.customPOIs === next.customPOIs;
  },
);
LayersTab.displayName = "LayersTab";

export const Sidebar = memo(
  function Sidebar({
    layers,
    toggleLayer,
    fleetMode,
    setFleetMode,
    clearFleet,
    fleetVehicles,
    fleetJobs,
    selectedVehicleId,
    setSelectedVehicleId,
    highlightVehicleOnly,
    vehicleAlerts = {},
    addVehicle,
    addStopToVehicle,
    removeVehicle,
    removeJob,
    addMode,
    cancelAddMode,
    startRouting,
    isCalculatingRoute = false,
    customPOIs = [],
    removeCustomPOI,
    clearAllCustomPOIs,
    setIsAddCustomPOIOpen,
    onEditZone,
    isLoadingVehicles = false,
    fetchVehicles,
    setIsAddJobOpen,
    isTracking = false,
    toggleTracking,
    hasRoute = false,
    isAddStopOpen,
    setIsAddStopOpen,
    onStartPickingStop,
    pickedStopCoords,
    gasStations = [],
    onAddStopSubmit,
    drivers = [],
    onAssignDriver,
    isLoadingDrivers = false,
    fetchDrivers,
    addDriver,
    onVehicleSelectFromDrivers,
    onViewDriverProfile,
    navigateToTab,
    navigateToDriverId,
    onNavigateConsumed,
  }: SidebarProps) {
    // Local state for sidebar visibility
    const [activeTab, setActiveTabState] = useState<SidebarTab>("fleet");
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(
      null,
    );

    // Persisted toggle state for drivers tab dropdowns
    const [driversExpandedGroups, setDriversExpandedGroups] = useState<
      Record<string, boolean>
    >({
      available: false,
      assigned: false,
    });

    const handleToggleDriverGroup = useCallback(
      (group: string, isExpanded: boolean) => {
        setDriversExpandedGroups((prev) => ({ ...prev, [group]: isExpanded }));
      },
      [],
    );

    // Derived state for selected driver (ensures data is always fresh)
    const selectedDriver = useMemo(
      () => (drivers || []).find((d) => d.id === selectedDriverId) || null,
      [drivers, selectedDriverId],
    );

    // Drivers are already fetched in gis-map on mount (independent of fleet)
    // No need to fetch them here based on tab changes

    // Helper to sync tab change with fleet mode
    const setActiveTab = useCallback(
      (tab: SidebarTab) => {
        setActiveTabState(tab);
        if (!isExpanded) {
          setIsExpanded(true);
        }

        // Implicitly handle fleet mode
        if (tab === "fleet") {
          setFleetMode(true);
        }
      },
      [isExpanded, setFleetMode],
    );

    // Sync initial fleet mode
    useEffect(() => {
      if (activeTab === "fleet" && !fleetMode) {
        setFleetMode(true);
      }
    }, [activeTab, fleetMode, setFleetMode]);

    // External navigation: switch tab and optionally select a driver
    useEffect(() => {
      if (navigateToTab) {
        setActiveTab(navigateToTab);
        if (navigateToDriverId) {
          setSelectedDriverId(navigateToDriverId);
        }
        onNavigateConsumed?.();
      }
    }, [navigateToTab, navigateToDriverId, onNavigateConsumed, setActiveTab]);

    const handleToggleExpand = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const handleShowAddJob = useCallback(() => {
      setIsAddJobOpen?.(true);
    }, [setIsAddJobOpen]);

    const handleShowAddPOI = useCallback(() => {
      setIsAddCustomPOIOpen?.(true);
    }, [setIsAddCustomPOIOpen]);

    // Memoize computed values to prevent unnecessary updates
    const fleetTabHasData = useMemo(
      () => fleetVehicles.length > 0 || fleetJobs.length > 0,
      [fleetVehicles.length, fleetJobs.length],
    );

    // Calculate total number of alerts across all vehicles
    const totalAlerts = useMemo(() => {
      if (!vehicleAlerts) return 0;
      let count = 0;
      Object.values(vehicleAlerts).forEach((alerts) => {
        count += alerts.length;
      });
      return count;
    }, [vehicleAlerts]);

    return (
      <div className="fixed left-3 top-3 z-[1000] flex max-h-[calc(100vh-1.5rem)]">
        <NavigationRail
          activeTab={activeTab}
          isExpanded={isExpanded}
          onSetTab={setActiveTab}
          onToggleExpand={handleToggleExpand}
          totalAlerts={totalAlerts}
        />

        <div
          className={cn(
            "ml-2.5 rounded-2xl border border-border/30 bg-background/95 backdrop-blur-lg shadow-lg ease-out overflow-hidden flex flex-col pointer-events-auto max-h-[calc(100vh-6rem)]",
            isExpanded
              ? cn(
                "opacity-100 translate-x-0",
                activeTab === "dashboard"
                  ? "w-[28rem]"
                  : activeTab === "drivers"
                    ? selectedDriver
                      ? "w-96"
                      : "w-96"
                    : "w-96",
              )
              : "w-0 opacity-0 -translate-x-8",
          )}
        >
          {activeTab === "fleet" && (
            <FleetTab
              isLoadingVehicles={isLoadingVehicles}
              fetchVehicles={fetchVehicles ?? STABLE_PROMISE_NOOP}
              clearFleet={clearFleet}
              fleetVehicles={fleetVehicles}
              fleetJobs={fleetJobs}
              addMode={addMode}
              addVehicle={addVehicle}
              onAddJobClick={handleShowAddJob}
              cancelAddMode={cancelAddMode}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              removeVehicle={removeVehicle}
              removeJob={removeJob}
              startRouting={startRouting}
              isCalculatingRoute={isCalculatingRoute}
              isTracking={isTracking ?? false}
              toggleTracking={toggleTracking ?? STABLE_NOOP}
              hasRoute={hasRoute ?? false}
              isAddStopOpen={isAddStopOpen}
              setIsAddStopOpen={setIsAddStopOpen}
              onStartPickingStop={onStartPickingStop}
              pickedStopCoords={pickedStopCoords}
              onAddStopSubmit={onAddStopSubmit}
              drivers={drivers}
              onAssignDriver={onAssignDriver}
              vehicleAlerts={vehicleAlerts}
            />
          )}
          {activeTab === "layers" && (
            <LayersTab
              layers={layers}
              toggleLayer={toggleLayer}
              customPOIs={customPOIs}
              onAddPOIClick={handleShowAddPOI}
              removeCustomPOI={removeCustomPOI}
              clearAllCustomPOIs={clearAllCustomPOIs}
              onEditZone={onEditZone}
            />
          )}
          {activeTab === "drivers" && (
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
              {selectedDriver ? (
                <DriverDetailsSheet
                  driver={selectedDriver}
                  onClose={() => setSelectedDriverId(null)}
                />
              ) : (
                <DriversTab
                  drivers={drivers || []}
                  fleetVehicles={fleetVehicles || []}
                  isLoading={isLoadingDrivers || false}
                  fetchDrivers={fetchDrivers || (async () => { })}
                  addDriver={addDriver || (async () => undefined)}
                  onDriverSelect={(d) => setSelectedDriverId(d.id)}
                  onVehicleSelect={onVehicleSelectFromDrivers}
                  expandedGroups={driversExpandedGroups}
                  onToggleGroup={handleToggleDriverGroup}
                />
              )}
            </div>
          )}
          {activeTab === "dashboard" && (
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
              <FleetDashboard
                vehicles={fleetVehicles}
                jobs={fleetJobs}
                gasStations={gasStations}
                vehicleAlerts={vehicleAlerts}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={highlightVehicleOnly || setSelectedVehicleId}
                isGasStationLayerVisible={layers.gasStations}
                onToggleGasStationLayer={() => toggleLayer("gasStations")}
                isTracking={isTracking}
                addStopToVehicle={addStopToVehicle}
                startRouting={startRouting}
                isAddStopOpen={isAddStopOpen}
                setIsAddStopOpen={setIsAddStopOpen}
                onStartPickingStop={onStartPickingStop}
                pickedStopCoords={pickedStopCoords}
                onAddStopSubmit={onAddStopSubmit}
                drivers={drivers}
                onAssignDriver={onAssignDriver}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev: SidebarProps, next: SidebarProps) => {
    // Custom comparator: only re-render if key props change
    return (
      prev.layers === next.layers &&
      prev.fleetMode === next.fleetMode &&
      prev.fleetVehicles === next.fleetVehicles &&
      prev.fleetJobs === next.fleetJobs &&
      prev.selectedVehicleId === next.selectedVehicleId &&
      prev.vehicleAlerts === next.vehicleAlerts &&
      prev.addMode === next.addMode &&
      prev.isCalculatingRoute === next.isCalculatingRoute &&
      prev.isTracking === next.isTracking &&
      prev.hasRoute === next.hasRoute &&
      prev.customPOIs === next.customPOIs &&
      prev.isLoadingVehicles === next.isLoadingVehicles &&
      prev.isAddStopOpen === next.isAddStopOpen &&
      prev.pickedStopCoords === next.pickedStopCoords &&
      prev.drivers === next.drivers &&
      prev.isLoadingDrivers === next.isLoadingDrivers &&
      prev.onAssignDriver === next.onAssignDriver &&
      prev.gasStations === next.gasStations &&
      prev.navigateToTab === next.navigateToTab &&
      prev.navigateToDriverId === next.navigateToDriverId
    );
  },
);
