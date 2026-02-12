"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Route,
  Layers,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
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
  () => {
    const Icon = React.useMemo(
      () => <MapPin className="h-5 w-5 text-primary" />,
      [],
    );
    return (
      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center mb-1">
        {Icon}
      </div>
    );
  },
  () => true,
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
    const isActive = activeTab === tabId;
    const IconEl = React.useMemo(() => <Icon className={cn("h-5 w-5", isActive && isExpanded ? "scale-110" : "scale-100")} />, [Icon, isActive, isExpanded]);

    const button = (
      <button
        onClick={() => onClick(tabId)}
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center relative group",
          isActive && isExpanded
            ? "bg-primary text-white shadow-[0_8px_16px_-4px_rgba(var(--primary-rgb),0.3)]"
            : "text-muted-foreground/60 bg-muted/30 border border-border/5 hover:bg-muted/50 hover:text-foreground hover:shadow-sm",
        )}
      >
        {/* Subtle glass background effect */}
        {!isActive && (
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm pointer-events-none rounded-xl" />
        )}

        {isActive && isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        )}

        <span className="relative z-10">
          {IconEl}
        </span>

        {alertCount > 0 && tabId === "dashboard" && (
          <span className="absolute top-1 right-1 flex items-center justify-center p-0 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] font-bold shadow-sm ring-1 ring-background translate-x-1/4 -translate-y-1/4 z-20">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}

        {/* Visual cue for active state when collapsed */}
        {isActive && !isExpanded && (
          <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-sm shadow-primary/40 animate-in slide-in-from-left-1" />
        )}
      </button>
    );

    if (isExpanded) {
      return button;
    }

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-semibold text-[10px] ml-2 px-2.5 py-1.5 bg-foreground text-background border-none shadow-xl">
          <div className="flex items-center gap-2">
            {label}
            {alertCount > 0 && tabId === "dashboard" && (
              <span className="bg-red-500 text-white px-1 rounded text-[8px]">{alertCount}</span>
            )}
          </div>
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
        className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
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
      () => <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />,
      [isLoading],
    );
    const TrashEl = React.useMemo(
      () => <Trash2 className="h-4 w-4 text-destructive" />,
      [],
    );

    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {LoaderEl}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
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
      () => <Plus className="h-4 w-4 mr-1.5" />,
      [],
    );

    return (
      <div className="px-4 py-2.5 grid grid-cols-2 gap-2">
        <Button
          variant={addMode === "vehicle" ? "default" : "secondary"}
          className="h-10 rounded-xl text-[11px] font-bold uppercase tracking-tight shadow-sm"
          onClick={onAddVehicle}
          disabled={!!addMode || isRouting}
        >
          {PlusEl} Vehículo
        </Button>
        <Button
          variant={addMode === "job" ? "default" : "secondary"}
          className="h-10 rounded-xl text-[11px] font-bold uppercase tracking-tight shadow-sm"
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
      () => <Loader2 className="h-4 w-4 mr-2 animate-spin" />,
      [isRouting],
    );
    const RouteEl = React.useMemo(() => <Route className="h-4 w-4 mr-2" />, []);
    const NavigationEl = React.useMemo(
      () => (
        <Navigation
          className={cn("h-4 w-4 mr-2")}
        />
      ),
      [isTracking],
    );

    return (
      <div className="p-4 border-t border-border/10 bg-background/50 space-y-2">
        <Button
          className="w-full h-12 rounded-xl text-[13px] font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 uppercase tracking-widest"
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
            className="w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-widest border-none"
            onClick={onToggleTracking}
          >
            {NavigationEl}
            {isTracking ? "Detener Tracking" : "Live Tracking"}
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

// --- SectionHeader ---
// Unified collapsible section header used across all sidebar tabs.
// Provides consistent sizing, spacing, toggle behaviour, active-trail
// indicator and optional sticky positioning inside a ScrollArea.
interface SectionHeaderProps {
  label: string;
  count: number;
  dotColorClass: string;           // e.g. "bg-primary", "bg-orange-500"
  dotShadowClass?: string;         // e.g. "shadow-primary/40"
  isExpanded: boolean;
  onToggle: () => void;
  hasActiveChild?: boolean;        // shows active-trail dot
  sticky?: boolean;                // pin at top of scroll container
}

export const SectionHeader = memo(
  ({
    label,
    count,
    dotColorClass,
    dotShadowClass = "shadow-transparent",
    isExpanded,
    onToggle,
    hasActiveChild = false,
    sticky = false,
  }: SectionHeaderProps) => (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-3 py-3 rounded-xl group/header relative overflow-hidden",
        "hover:bg-muted/40 active:scale-[0.99]",
        sticky && "sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/5 mb-1.5",
        !isExpanded && "mb-1",
      )}
    >
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="relative">
          <span
            className={cn(
              "h-2 w-2 rounded-full block",
              dotColorClass,
              dotShadowClass,
            )}
          />
          {hasActiveChild && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background animate-pulse" />
          )}
        </div>
        <span className={cn(
          "text-[11px] font-black uppercase tracking-[0.1em] transition-colors",
          isExpanded ? "text-foreground" : "text-foreground group-hover/header:text-foreground"
        )}>
          {label} <span className="ml-1 opacity-70 font-bold tracking-normal text-muted-foreground">({count})</span>
        </span>
      </div>

      <div className={cn(
        "h-6 w-6 rounded-lg flex items-center justify-center",
        isExpanded ? "bg-muted/50 text-foreground" : "text-muted-foreground group-hover/header:translate-x-0.5"
      )}>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </button>
  ),
  (prev: SectionHeaderProps, next: SectionHeaderProps) =>
    prev.label === next.label &&
    prev.count === next.count &&
    prev.isExpanded === next.isExpanded &&
    prev.hasActiveChild === next.hasActiveChild &&
    prev.dotColorClass === next.dotColorClass,
);
SectionHeader.displayName = "SectionHeader";

// --- EmptyState ---
// Unified empty-state placeholder for sidebar lists.
interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
}

export const EmptyState = memo(
  ({ icon: Icon, message }: EmptyStateProps) => (
    <div className="py-12 text-center bg-muted/15 rounded-2xl border border-dashed border-border/30">
      <Icon className="h-8 w-8 text-muted-foreground/15 mx-auto mb-2" />
      <p className="text-[11px] text-muted-foreground/45 font-black uppercase tracking-widest">
        {message}
      </p>
    </div>
  ),
  () => true,
);
EmptyState.displayName = "EmptyState";
