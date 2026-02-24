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
            <div className="absolute top-6 left-6 z-[400] pointer-events-auto group">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="h-12 w-12 bg-white border border-[#EAEAEA] rounded-lg shadow-xl flex items-center justify-center hover:bg-[#1C1C1C] hover:text-[#D4F04A] hover:border-[#1C1C1C] transition-all duration-300"
                    title="Monitorización"
                >
                    <Menu className="h-5 w-5" strokeWidth={1.5} />
                    {vehicles.length > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#1C1C1C] text-[8px] font-medium text-[#D4F04A] rounded-full flex items-center justify-center shadow-lg border border-white">
                            {vehicles.length}
                        </div>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-4 left-4 z-[400] w-72 bg-white border border-[#EAEAEA] shadow-2xl flex flex-col h-auto max-h-[calc(100vh-4rem)] rounded-lg pointer-events-auto overflow-hidden animate-in slide-in-from-left-2 fade-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[#EAEAEA] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#1C1C1C]" />
                        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Monitorización</h2>
                        <Badge className="text-[10px] font-medium bg-[#1C1C1C] text-[#D4F04A] h-5 px-2 rounded-full tabular-nums border-none shadow-none">
                            {vehicles.length}
                        </Badge>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="h-7 w-7 rounded-md hover:bg-[#F7F8FA] flex items-center justify-center text-[#6B7280] hover:text-[#1C1C1C] transition-all"
                    >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-1 bg-[#F7F8FA] p-1 rounded-md border border-[#EAEAEA]">
                    {(["all", "driving", "parked"] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "flex-1 py-1.5 text-[9px] font-medium uppercase tracking-wider rounded transition-all",
                                statusFilter === status
                                    ? "bg-white text-[#1C1C1C] shadow-sm border border-[#EAEAEA]"
                                    : "text-[#6B7280] hover:text-[#1C1C1C]"
                            )}
                        >
                            {status === "all" ? "Todos" : status === "driving" ? "Ruta" : "Base"}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]/40 group-focus-within:text-[#1C1C1C] transition-colors" />
                    <Input
                        placeholder="BUSCAR UNIDAD..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-white border-[#EAEAEA] rounded text-[10px] font-medium uppercase tracking-wider placeholder:text-[#6B7280]/30 focus-visible:ring-0 focus-visible:border-[#1C1C1C] transition-all shadow-none"
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 bg-white">
                <div className="p-4 space-y-2">
                    {filteredVehicles.map((v) => {
                        const isSelected = String(selectedId) === String(v.id);
                        const hasAlerts = vehicleAlerts[v.id]?.length > 0;
                        const isDriving = v.metrics?.movementState === "on_route" || (v.metrics?.speed ?? 0) > 0;

                        return (
                            <div key={v.id} className="flex flex-col w-full relative group">
                                <div
                                    onClick={() => onSelect(v.id)}
                                    className={cn(
                                        "p-3 rounded border transition-all duration-300 cursor-pointer flex items-center gap-3",
                                        isSelected
                                            ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#D4F04A] shadow-md"
                                            : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center shrink-0 border transition-all",
                                        isSelected
                                            ? "bg-[#1C1C1C] border-[#D4F04A]/20 text-[#D4F04A]"
                                            : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]"
                                    )}>
                                        <Truck strokeWidth={1.5} className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className={cn("text-[11px] font-medium truncate uppercase tracking-tight", isSelected ? "text-white" : "text-[#1C1C1C]")}>
                                                {v.label}
                                            </h3>
                                            {hasAlerts && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)] animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn("text-[9px] font-medium tabular-nums uppercase", isSelected ? "text-[#D4F04A]/60" : "text-[#6B7280]/60")}>
                                                {v.licensePlate || "PT-1234"}
                                            </span>
                                            <div className={cn("h-0.5 w-0.5 rounded-full", isSelected ? "bg-[#D4F04A]/20" : "bg-[#EAEAEA]")} />
                                            <span className={cn(
                                                "text-[8px] font-medium uppercase tracking-wider px-1 rounded",
                                                isDriving 
                                                    ? isSelected ? "bg-[#D4F04A]/20 text-[#D4F04A]" : "text-emerald-700 bg-emerald-50" 
                                                    : isSelected ? "bg-white/10 text-white/60" : "text-[#6B7280] bg-[#F7F8FA]"
                                            )}>
                                                {isDriving ? "MÓVIL" : "BASE"}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight strokeWidth={1.5} className={cn(
                                        "h-4 w-4 transition-all shrink-0",
                                        isSelected ? "text-[#D4F04A] translate-x-0.5" : "text-[#6B7280]/20"
                                    )} />
                                </div>
                                {/* Assigned jobs for this vehicle */}
                                {isSelected && (() => {
                                    const vehicleJobs = jobs.filter(j => String(j.assignedVehicleId) === String(v.id));
                                    if(vehicleJobs.length === 0) return null;
                                    
                                    return (
                                        <div className="mt-1 mb-2 px-1 flex flex-col gap-1 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                                            {vehicleJobs.map((j, idx) => (
                                                <div key={j.id} className="flex items-center justify-between py-1.5 px-3 rounded text-[9px] uppercase tracking-wider border bg-[#F7F8FA]/80 border-[#EAEAEA] text-[#6B7280]">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="font-bold shrink-0 text-[#1C1C1C] opacity-40">{idx + 1}.</span>
                                                        <span className="truncate text-[10px] font-semibold text-[#1C1C1C]">{j.label}</span>
                                                    </div>
                                                    <Badge className={cn(
                                                        "shrink-0 h-4 px-1 rounded border-none shadow-none text-[8px] uppercase tracking-widest",
                                                        j.status === "completed" ? "bg-[#1C1C1C] text-[#D4F04A]" : 
                                                        j.status === "in_progress" ? "bg-emerald-100 text-emerald-800" : 
                                                        "bg-white text-[#6B7280]"
                                                    )}>
                                                        {j.status === "completed" ? "OK" : j.status === "in_progress" ? "EN CURSO" : "PENDIENTE"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })}

                    {filteredVehicles.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center gap-3 p-8">
                            <Filter strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/20" />
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/40">
                                Sin resultados
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer Summary */}
            <div className="p-4 bg-[#F7F8FA] border-t border-[#EAEAEA] text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-widest flex items-center justify-between">
                <span>Estado: Conectado</span>
                <Clock strokeWidth={1.5} className="h-3.5 w-3.5" />
            </div>
        </div>
    );
}
