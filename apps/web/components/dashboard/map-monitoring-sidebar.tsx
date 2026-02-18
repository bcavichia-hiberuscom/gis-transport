"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Menu,
    X,
    Search,
    Truck,
    MapPin,
    ChevronRight,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FleetVehicle, FleetJob } from "@gis/shared";

interface MapMonitoringSidebarProps {
    vehicles: FleetVehicle[];
    jobs: FleetJob[];
    selectedId: string | number | null;
    onSelect: (id: string | number | null) => void;
    vehicleAlerts?: Record<string | number, any[]>;
}

type FilterStatus = "all" | "driving" | "parked";

export function MapMonitoringSidebar({
    vehicles,
    jobs,
    selectedId,
    onSelect,
    vehicleAlerts = {}
}: MapMonitoringSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesSearch = v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase());

            if (statusFilter === "all") return matchesSearch;

            const isDriving = v.metrics?.movementState === "on_route" || (v.metrics?.speed ?? 0) > 0;
            if (statusFilter === "driving") return matchesSearch && isDriving;
            if (statusFilter === "parked") return matchesSearch && !isDriving;

            return matchesSearch;
        });
    }, [vehicles, searchQuery, statusFilter]);

    if (isCollapsed) {
        return (
            <div className="absolute top-4 left-4 z-[400] pointer-events-auto">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="h-9 w-9 bg-card border border-border rounded-md shadow-sm flex items-center justify-center hover:bg-secondary transition-all group relative"
                >
                    <Menu className="h-4 w-4 text-foreground" />
                    {vehicles.length > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-foreground text-[8px] font-medium text-card rounded-full flex items-center justify-center">
                            {vehicles.length}
                        </div>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-2 left-2 z-[400] w-64 bg-card border border-border shadow-md flex flex-col h-auto max-h-[calc(100vh-3rem)] rounded-lg pointer-events-auto overflow-hidden animate-slide-in-left">
            {/* Header */}
            <div className="p-4 border-b border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold text-foreground">Monitorización</h2>
                        <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
                            {vehicles.length}
                        </Badge>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-0.5 bg-secondary p-0.5 rounded-md">
                    {(["all", "driving", "parked"] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
                                statusFilter === status
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {status === "all" ? "Todos" : status === "driving" ? "En Ruta" : "Parados"}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                        placeholder="Buscar vehículo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-8 bg-secondary border-border rounded-md text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {filteredVehicles.map((v) => {
                        const isSelected = String(selectedId) === String(v.id);
                        const hasAlerts = vehicleAlerts[v.id]?.length > 0;
                        const isDriving = v.metrics?.movementState === "on_route" || (v.metrics?.speed ?? 0) > 0;

                        return (
                            <div
                                key={v.id}
                                onClick={() => onSelect(v.id)}
                                className={cn(
                                    "group relative p-3 rounded-md border transition-all cursor-pointer flex items-center gap-3",
                                    isSelected
                                        ? "bg-secondary border-border"
                                        : "bg-card border-transparent hover:bg-secondary"
                                )}
                            >
                                {/* Left Indicator */}
                                <div className={cn(
                                    "h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-all",
                                    isSelected
                                        ? "bg-foreground text-card"
                                        : "bg-secondary text-muted-foreground"
                                )}>
                                    <Truck className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-xs font-medium truncate text-foreground">
                                            {v.label}
                                        </h3>
                                        {hasAlerts && (
                                            <AlertCircle className="h-3 w-3 text-destructive" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            {v.licensePlate || "WO-123456"}
                                        </span>
                                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                                        <span className={cn(
                                            "text-[10px] font-medium",
                                            isDriving ? "text-emerald-600" : "text-muted-foreground"
                                        )}>
                                            {isDriving ? "En Ruta" : "Parado"}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className={cn(
                                    "h-3.5 w-3.5 transition-all",
                                    isSelected ? "text-foreground" : "text-muted-foreground/20"
                                )} />
                            </div>
                        );
                    })}

                    {filteredVehicles.length === 0 && (
                        <div className="py-10 flex flex-col items-center justify-center text-center gap-2 p-6">
                            <Filter className="h-8 w-8 text-muted-foreground/30 stroke-[1.5px]" />
                            <p className="text-[11px] text-muted-foreground leading-normal">
                                No se encontraron vehículos con estos filtros
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="px-4 py-3 bg-secondary/50 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Actualizado ahora</span>
                <Clock className="h-3 w-3" />
            </div>
        </div>
    );
}
