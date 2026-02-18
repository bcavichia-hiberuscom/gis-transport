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
                    className="h-10 w-10 bg-card/95 backdrop-blur-md border border-border/40 rounded-xl shadow-2xl flex items-center justify-center hover:bg-primary/10 transition-all group relative ring-1 ring-black/5"
                >
                    <Menu className="h-5 w-5 text-primary" />
                    {vehicles.length > 0 && (
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary text-[7px] font-black text-white rounded-full flex items-center justify-center border border-background">
                            {vehicles.length}
                        </div>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-2 left-2 z-[400] w-64 bg-card/98 backdrop-blur-xl border border-border/50 shadow-2xl flex flex-col h-auto max-h-[calc(100vh-3rem)] rounded-xl pointer-events-auto overflow-hidden animate-slide-in-left">
            {/* Header */}
            <div className="p-4 border-b border-border/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-black uppercase tracking-tight text-foreground/80">Monitorización</h2>
                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary h-5 px-1.5">
                            {vehicles.length}
                        </Badge>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-all"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/5 ring-1 ring-black/5">
                    {(["all", "driving", "parked"] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "flex-1 py-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all",
                                statusFilter === status
                                    ? "bg-background text-primary shadow-sm border border-border/20"
                                    : "text-muted-foreground/60 hover:text-foreground"
                            )}
                        >
                            {status === "all" ? "Todos" : status === "driving" ? "En Ruta" : "Parados"}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar vehículo por ID o Placa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-muted/20 border-border/30 rounded-xl text-xs font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20"
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
                                    "group relative p-3 rounded-xl border transition-all cursor-pointer overflow-hidden flex items-center gap-3",
                                    isSelected
                                        ? "bg-primary/5 border-primary/40 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.1)]"
                                        : "bg-background/50 border-border/40 hover:bg-muted/30 hover:border-primary/20"
                                )}
                            >
                                {/* Left Indicator */}
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                    isSelected
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-muted/50 border-border/10 text-muted-foreground/40 shadow-inner"
                                )}>
                                    <Truck className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-xs font-black truncate uppercase tracking-tight text-foreground/90">
                                            {v.label}
                                        </h3>
                                        {hasAlerts && (
                                            <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-mono font-bold text-muted-foreground/40">
                                            {v.licensePlate || "WO-123456"}
                                        </span>
                                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-wider",
                                            isDriving ? "text-emerald-500" : "text-orange-500"
                                        )}>
                                            {isDriving ? "En Ruta" : "Parqueado"}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className={cn(
                                    "h-4 w-4 transition-all",
                                    isSelected ? "text-primary translate-x-1" : "text-muted-foreground/10"
                                )} />

                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6" />
                                )}
                            </div>
                        );
                    })}

                    {filteredVehicles.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center gap-2 p-6">
                            <Filter className="h-10 w-10 stroke-[1.5px]" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-normal">
                                No se encontraron vehículos <br /> con estos filtros
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="p-4 bg-muted/10 border-t border-border/5 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center justify-between">
                <span>Última actualización: Justo ahora</span>
                <Clock className="h-3 w-3" />
            </div>
        </div>
    );
}
