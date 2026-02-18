"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Route,
  Layers,
  ChevronLeft,
  Loader2,
  Trash2,
  Plus,
  Navigation,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- SidebarLogo ---
export const SidebarLogo = memo(
  ({ onClick }: { onClick?: () => void }) => {
    return (
      <button
        onClick={onClick}
        className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center mb-2 overflow-hidden border border-primary shadow-sm hover:opacity-90 active:scale-95 transition-all group relative shrink-0"
        title="Reset Vista"
      >
        <img
          src="/brand-logo.png"
          alt="Logo"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-primary-foreground text-xs font-semibold">GIS</span>
      </button>
    );
  },
);
SidebarLogo.displayName = "SidebarLogo";

// --- NavigationButton ---
interface NavigationButtonProps {
  tabId: "fleet" | "layers" | "dashboard" | "drivers" | "settings";
  activeTab: "fleet" | "layers" | "dashboard" | "drivers" | "settings";
  isExpanded: boolean;
  onClick: (
    tab: "fleet" | "layers" | "dashboard" | "drivers" | "settings",
  ) => void;
  label: string;
  icon: React.ElementType;
  alertCount?: number;
}

export const NavigationButton = memo(
  ({
    tabId,
    activeTab,
    isExpanded,
    onClick,
    label,
    icon: Icon,
    alertCount = 0,
  }: NavigationButtonProps) => {
    const IconEl = React.useMemo(() => <Icon className="h-4 w-4" />, [Icon]);
    const button = (
      <button
        onClick={() => onClick(tabId)}
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 relative group",
          activeTab === tabId && isExpanded
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        {IconEl}

        {alertCount > 0 && tabId === "dashboard" && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 bg-destructive rounded-full text-destructive-foreground text-[8px] font-medium ring-2 ring-card">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>
    );

    // Solo mostrar tooltip cuando sidebar está colapsado
    if (isExpanded) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium text-xs ml-1.5">
          {label}
          {alertCount > 0 && tabId === "dashboard" && (
            <span className="ml-1 text-red-400">({alertCount})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  },
  (prev: NavigationButtonProps, next: NavigationButtonProps) => {
    return (
      prev.activeTab === next.activeTab &&
      prev.isExpanded === next.isExpanded &&
      prev.tabId === next.tabId &&
      prev.alertCount === next.alertCount
    );
  },
);
NavigationButton.displayName = "NavigationButton";

// --- ExpandButton ---
interface ExpandButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const ExpandButton = memo(
  ({ isExpanded, onToggle }: ExpandButtonProps) => {
    const chevronClass = React.useMemo(
      () =>
        cn(
          "h-4 w-4 transition-transform duration-200",
          !isExpanded && "rotate-180",
        ),
      [isExpanded],
    );
    const ChevronEl = React.useMemo(
      () => <ChevronLeft className={chevronClass} />,
      [chevronClass],
    );
    return (
      <button
        onClick={onToggle}
        className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {ChevronEl}
      </button>
    );
  },
  (prev: ExpandButtonProps, next: ExpandButtonProps) =>
    prev.isExpanded === next.isExpanded,
);
ExpandButton.displayName = "ExpandButton";

// --- FleetHeaderButtons ---
interface FleetHeaderButtonsProps {
  isLoading: boolean;
  hasData: boolean;
  onRefresh: () => void;
  onClear: () => void;
}

export const FleetHeaderButtons = memo(
  ({ isLoading, hasData, onRefresh, onClear }: FleetHeaderButtonsProps) => {
    const LoaderEl = React.useMemo(
      () => <Loader2 className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />,
      [isLoading],
    );
    const TrashEl = React.useMemo(
      () => <Trash2 className="h-3.5 w-3.5 text-destructive" />,
      [],
    );

    return (
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {LoaderEl}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={onClear}
          disabled={!hasData}
        >
          {TrashEl}
        </Button>
      </div>
    );
  },
  (prev: FleetHeaderButtonsProps, next: FleetHeaderButtonsProps) =>
    prev.isLoading === next.isLoading && prev.hasData === next.hasData,
);
FleetHeaderButtons.displayName = "FleetHeaderButtons";

// --- FleetActionButtons ---
interface FleetActionButtonsProps {
  addMode: "vehicle" | "job" | null;
  isRouting: boolean;
  onAddVehicle: () => void;
  onAddJob: () => void;
}

export const FleetActionButtons = memo(
  ({
    addMode,
    isRouting,
    onAddVehicle,
    onAddJob,
  }: FleetActionButtonsProps) => {
    const PlusEl = React.useMemo(
      () => <Plus className="h-3 w-3 mr-1" />,
      [],
    );

    return (
      <div className="px-4 py-2 grid grid-cols-2 gap-1.5">
        <Button
          variant={addMode === "vehicle" ? "default" : "secondary"}
          className="h-8 rounded-lg text-[9px] font-semibold uppercase tracking-tight transition-all"
          onClick={onAddVehicle}
          disabled={!!addMode || isRouting}
        >
          {PlusEl} Vehículo
        </Button>
        <Button
          variant={addMode === "job" ? "default" : "secondary"}
          className="h-8 rounded-lg text-[9px] font-semibold uppercase tracking-tight transition-all"
          onClick={onAddJob}
          disabled={!!addMode || isRouting}
        >
          {PlusEl} Pedido
        </Button>
      </div>
    );
  },
  (prev: FleetActionButtonsProps, next: FleetActionButtonsProps) =>
    prev.addMode === next.addMode && prev.isRouting === next.isRouting,
);
FleetActionButtons.displayName = "FleetActionButtons";

// --- FleetFooterButtons ---
interface FleetFooterButtonsProps {
  isRouting: boolean;
  hasData: boolean;
  hasRoute: boolean;
  isTracking: boolean;
  onStartRouting: () => void;
  onToggleTracking: () => void;
}

export const FleetFooterButtons = memo(
  ({
    isRouting,
    hasData,
    hasRoute,
    isTracking,
    onStartRouting,
    onToggleTracking,
  }: FleetFooterButtonsProps) => {
    const LoaderEl = React.useMemo(
      () => <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />,
      [isRouting],
    );
    const RouteEl = React.useMemo(() => <Route className="h-3.5 w-3.5 mr-1.5" />, []);
    const NavigationEl = React.useMemo(
      () => (
        <Navigation
          className={cn("h-3.5 w-3.5 mr-1.5")}
        />
      ),
      [isTracking],
    );

    return (
      <div className="p-3 border-t border-border/10 bg-background/50 space-y-1.5">
        <Button
          className="w-full h-9 rounded-lg text-xs font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={onStartRouting}
          disabled={!hasData || isRouting}
        >
          {isRouting ? (
            <>{LoaderEl} Calculando...</>
          ) : (
            <>{RouteEl} Optimizar Rutas</>
          )}
        </Button>
        {hasRoute && (
          <Button
            variant={isTracking ? "destructive" : "secondary"}
            className="w-full h-8 rounded-lg text-xs font-semibold transition-all"
            onClick={onToggleTracking}
          >
            {NavigationEl}
            {isTracking ? "Detener" : "Live Tracking"}
          </Button>
        )}
      </div>
    );
  },
  (prev: FleetFooterButtonsProps, next: FleetFooterButtonsProps) => {
    return (
      prev.isRouting === next.isRouting &&
      prev.hasData === next.hasData &&
      prev.hasRoute === next.hasRoute &&
      prev.isTracking === next.isTracking
    );
  },
);
FleetFooterButtons.displayName = "FleetFooterButtons";
