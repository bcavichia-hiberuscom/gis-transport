"use client";

import React, { useState, useMemo } from "react";
import {
    Users,
    ChevronRight,
    MapPin,
    Truck,
    CheckCircle2,
    Activity,
    AlertCircle,
    Clock,
    Package,
    X,
    Search,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetJob, FleetVehicle, Zone, VehicleGroup } from "@gis/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ManageGroupsDialog } from "@/components/manage-groups-dialog";

interface AsignacionViewProps {
    fleetJobs: FleetJob[];
    fleetVehicles: FleetVehicle[];
    activeZones: Zone[];
    setJobAssignments: (assignments: { jobId: string | number; vehicleId?: string | number, groupId?: string | number }[]) => void;
    startRouting: (overrides?: { vehicles?: FleetVehicle[], jobs?: FleetJob[] }) => Promise<any>;
    isCalculatingRoute?: boolean;
    vehicleGroups?: VehicleGroup[];
    addVehicleGroup?: (name: string, vehicleIds?: (string | number)[]) => Promise<string | null>;
    removeVehicleGroup?: (groupId: string | number) => Promise<void>;
    toggleVehicleInGroup?: (groupId: string | number, vehicleId: string | number) => Promise<void>;
    updateVehicleGroupName?: (groupId: string | number, name: string) => Promise<void>;
}

export function AsignacionView({
    fleetJobs,
    fleetVehicles,
    activeZones,
    setJobAssignments,
    startRouting,
    isCalculatingRoute,
    vehicleGroups = [],
    addVehicleGroup,
    removeVehicleGroup,
    toggleVehicleInGroup,
    updateVehicleGroupName
}: AsignacionViewProps) {
    const [selectedJobIds, setSelectedJobIds] = useState<(string | number)[]>([]);
    const [lastClickedJobId, setLastClickedJobId] = useState<string | number | null>(null);
    const [pendingAssignment, setPendingAssignment] = useState<{ jobIds: (string | number)[]; vehicleId?: string | number, groupId?: string | number } | null>(null);
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [focusGroupId, setFocusGroupId] = useState<string | number | null>(null);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);
    const [jobSearch, setJobSearch] = useState("");
    const [isCreateOnly, setIsCreateOnly] = useState(false);

    const unassignedJobs = useMemo(() =>
        fleetJobs.filter(j => !j.assignedVehicleId && !j.assignedGroupId),
        [fleetJobs]
    );

    const filteredJobs = useMemo(() => {
        if (!jobSearch) return unassignedJobs;
        return unassignedJobs.filter(j =>
            j.label.toLowerCase().includes(jobSearch.toLowerCase())
        );
    }, [unassignedJobs, jobSearch]);

    const handleJobClick = (e: React.MouseEvent, jobId: string | number) => {
        if (e.shiftKey && lastClickedJobId && unassignedJobs.some(j => j.id === lastClickedJobId)) {
            const currentIdx = unassignedJobs.findIndex(j => j.id === jobId);
            const lastIdx = unassignedJobs.findIndex(j => j.id === lastClickedJobId);
            const start = Math.min(currentIdx, lastIdx);
            const end = Math.max(currentIdx, lastIdx);
            const newRange = unassignedJobs.slice(start, end + 1).map(j => j.id);
            setSelectedJobIds(prev => Array.from(new Set([...prev, ...newRange])));
        } else if (e.ctrlKey || e.metaKey) {
            setSelectedJobIds(prev =>
                prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
            );
        } else {
            setSelectedJobIds(prev => prev.length === 1 && prev[0] === jobId ? [] : [jobId]);
        }
        setLastClickedJobId(jobId);
    };

    const handleManualAssign = async (target: { vehicleId?: string | number, groupId?: string | number }) => {
        if (selectedJobIds.length === 0) return;
        setAssignmentError(null);

        setPendingAssignment({ jobIds: selectedJobIds, ...target });

        const nextJobs = fleetJobs.map(j =>
            selectedJobIds.includes(j.id)
                ? { ...j, assignedVehicleId: target.vehicleId, assignedGroupId: target.groupId }
                : j
        );

        let vehiclesOverride: FleetVehicle[] | undefined = undefined;
        if (target.groupId) {
            const group = vehicleGroups.find(g => String(g.id) === String(target.groupId));
            if (group) {
                const groupVehicleIds = new Set(group.vehicleIds.map(String));
                vehiclesOverride = fleetVehicles
                    .filter(v => groupVehicleIds.has(String(v.id)))
                    .map(v => ({
                        ...v,
                        groupIds: Array.from(new Set([...((v as any).groupIds || []), target.groupId!]))
                    })) as FleetVehicle[];

                if (vehiclesOverride.length === 0) {
                    setAssignmentError("EL GRUPO SELECCIONADO NO TIENE VEHÍCULOS VINCULADOS");
                    setPendingAssignment(null);
                    return;
                }
            }
        }

        try {
            const result = await startRouting({
                jobs: nextJobs,
                vehicles: vehiclesOverride
            });

            if (result && (result as any).error) {
                throw new Error((result as any).error);
            }

            if (result && result.unassignedJobs && result.unassignedJobs.length > 0) {
                const failedIds = result.unassignedJobs.map((u: any) => String(u.id));
                const actuallyFailedSelection = selectedJobIds.filter(id => failedIds.includes(String(id)));

                if (actuallyFailedSelection.length > 0) {
                    const failInfo = result.unassignedJobs.find((u: any) => String(u.id) === String(actuallyFailedSelection[0]));
                    throw new Error(failInfo?.reason || "RESTRICTED: NO SE ENCONTRÓ RUTA VÁLIDA PARA ESTA ASIGNACIÓN");
                }
            }

            const assignments = selectedJobIds.map(jobId => ({
                jobId,
                vehicleId: target.vehicleId,
                groupId: target.groupId
            }));
            setJobAssignments(assignments);
            setSelectedJobIds([]);

        } catch (err) {
            console.error("[AsignacionView] Fallo en la asignación:", err);
            setAssignmentError(`ERROR: ${(err as Error).message}`.toUpperCase());
        } finally {
            setPendingAssignment(null);
        }
    };

    const hasGroups = vehicleGroups.length > 0;

    return (
        <div className="flex flex-col grow h-full bg-white overflow-hidden">
            {/* Operational Header */}
            <div className="shrink-0 bg-white border-b border-slate-100">
                <div className="px-6 py-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Fleet Operations Audit
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Asignación de Pedidos
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {unassignedJobs.length} Pendientes
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {vehicleGroups.length} Grupos
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {fleetVehicles.length} Vehículos
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {assignmentError && (
                <div className="shrink-0 bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-bold text-rose-600 flex-1">{assignmentError}</p>
                    <button
                        onClick={() => setAssignmentError(null)}
                        className="text-[10px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors shrink-0"
                    >
                        Descartar
                    </button>
                </div>
            )}


            {/* Three-column layout */}
            <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">

                {/* Column 1: Pedidos Pendientes */}
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-300px)]">
                    <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-amber-50/40 border-b border-amber-100/50">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Pedidos</span>
                            <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{unassignedJobs.length}</span>
                        </div>
                        {selectedJobIds.length > 0 && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {selectedJobIds.length} sel.
                            </span>
                        )}
                    </div>

                    {/* Search */}
                    <div className="shrink-0 px-3 sm:px-4 py-2.5 border-b border-slate-50 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Buscar pedidos..."
                                value={jobSearch}
                                onChange={(e) => setJobSearch(e.target.value)}
                                className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium placeholder:text-slate-300 outline-none rounded-lg border border-slate-100 focus:border-blue-200 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                        {filteredJobs.length > 0 ? (
                            <div className="p-3 sm:p-4 grid grid-cols-1 gap-2">
                                {filteredJobs.map(job => {
                                    const isSelected = selectedJobIds.includes(job.id);
                                    return (
                                        <div
                                            key={job.id}
                                            onClick={(e) => handleJobClick(e, job.id)}
                                            className={cn(
                                                "group bg-white border rounded-2xl p-3.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all cursor-pointer",
                                                isSelected
                                                    ? "border-blue-200 bg-blue-50/30 shadow-sm"
                                                    : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-9 w-9 flex items-center justify-center rounded-xl border shrink-0 transition-colors",
                                                    isSelected
                                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                                        : "bg-slate-50/50 border-slate-100/50 text-slate-400"
                                                )}>
                                                    <Package className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn(
                                                        "text-[13px] font-semibold truncate tracking-tight transition-colors",
                                                        isSelected ? "text-blue-600" : "text-slate-900"
                                                    )}>
                                                        {job.label}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 text-slate-300" />
                                                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">{String(job.id).substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic">
                                    {jobSearch ? "Sin resultados para esta búsqueda" : "Ningún pedido pendiente"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Grupos Operativos */}
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-300px)]">
                    <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-blue-50/40 border-b border-blue-100/50">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Grupos</span>
                            <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{vehicleGroups.length}</span>
                        </div>
                        <button
                            onClick={() => {
                                setFocusGroupId(null);
                                setIsCreateOnly(true);
                                setIsGroupManagerOpen(true);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-blue-100/50 text-blue-600 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                        <div className="p-3 sm:p-4 grid grid-cols-1 gap-2">
                            {vehicleGroups.length > 0 ? (
                                vehicleGroups.map(group => {
                                    const isPending = pendingAssignment?.groupId === group.id;
                                    const canAssign = !!selectedJobIds.length && !isPending;
                                    const vehicleCount = (group.vehicleIds || []).length;
                                    return (
                                        <div
                                            key={group.id}
                                            onClick={() => {
                                                if (selectedJobIds.length > 0) {
                                                    if (canAssign) handleManualAssign({ groupId: group.id });
                                                } else {
                                                    setFocusGroupId(group.id);
                                                    setIsCreateOnly(false);
                                                    setIsGroupManagerOpen(true);
                                                }
                                            }}
                                            className={cn(
                                                "group bg-white border rounded-2xl p-4 transition-all cursor-pointer",
                                                canAssign
                                                    ? "border-blue-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-300"
                                                    : "border-slate-100 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 flex items-center justify-center rounded-xl border shrink-0 transition-colors",
                                                    canAssign
                                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                                        : "bg-slate-50/50 border-slate-100/50 text-slate-400"
                                                )}>
                                                    {isPending ? <Activity className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                                                        {group.name}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {vehicleCount} {vehicleCount === 1 ? 'Unidad' : 'Unidades'}
                                                    </p>
                                                </div>
                                                <div className="p-1.5 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl opacity-40">
                                    <Users className="h-10 w-10 text-slate-300 mb-3" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center px-4">
                                        Sin grupos operativos definidos
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 3 (or 2 if no groups): Vehículos Individuales */}
                <div className="border border-slate-100 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-300px)]">
                    <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 bg-emerald-50/40 border-b border-emerald-100/50">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Vehículos</span>
                            <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 uppercase tracking-tighter">{fleetVehicles.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                        <div className="p-3 sm:p-4 grid grid-cols-1 gap-2">
                            {fleetVehicles.map(vehicle => {
                                const isPending = pendingAssignment?.vehicleId === vehicle.id;
                                const canAssign = !!selectedJobIds.length && !isPending;
                                return (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => canAssign && handleManualAssign({ vehicleId: vehicle.id })}
                                        className={cn(
                                            "group bg-white border rounded-2xl p-4 transition-all",
                                            canAssign
                                                ? "cursor-pointer border-emerald-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-300"
                                                : "cursor-pointer border-slate-100 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <div className={cn(
                                                    "h-10 w-10 flex items-center justify-center rounded-xl border transition-colors",
                                                    canAssign
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                                        : "bg-slate-50/50 border-slate-100/50 text-slate-400"
                                                )}>
                                                    {isPending ? <Activity className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                                </div>
                                                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                                                    {vehicle.label}
                                                </h4>
                                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                    {vehicle.type.label}
                                                </p>
                                            </div>
                                            {canAssign && (
                                                <div className="p-1.5 bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* SELECCIÓN FLOTANTE */}
            {selectedJobIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-slate-900 rounded-xl px-8 py-4 flex items-center gap-8 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 bg-blue-600 text-white flex items-center justify-center font-bold text-xs rounded-xl">
                            {selectedJobIds.length}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">Carga Preparada</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seleccione destino</span>
                        </div>
                    </div>
                    <button
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
                        onClick={() => {
                            setSelectedJobIds([]);
                            setAssignmentError(null);
                        }}
                    >
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                    </button>
                </div>
            )}

            {/* DIÁLOGO GESTOR DE GRUPOS */}
            <ManageGroupsDialog
                open={isGroupManagerOpen}
                onOpenChange={(open) => {
                    setIsGroupManagerOpen(open);
                    if (!open) setFocusGroupId(null);
                }}
                vehicleGroups={vehicleGroups}
                fleetVehicles={fleetVehicles}
                addVehicleGroup={addVehicleGroup}
                removeVehicleGroup={removeVehicleGroup}
                toggleVehicleInGroup={toggleVehicleInGroup}
                updateVehicleGroupName={updateVehicleGroupName}
                focusGroupId={focusGroupId}
                createOnly={isCreateOnly}
            />
        </div>
    );
}
