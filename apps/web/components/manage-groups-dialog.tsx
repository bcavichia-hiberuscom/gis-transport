"use client";

import { useState, useMemo } from "react";
import { FleetVehicle, VehicleGroup } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Users,
    Plus,
    Trash2,
    CheckCircle2,
    Edit3,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageGroupsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleGroups: VehicleGroup[];
    fleetVehicles: FleetVehicle[];
    addVehicleGroup?: (name: string, vehicleIds?: (string | number)[]) => Promise<string | null>;
    removeVehicleGroup?: (groupId: string | number) => Promise<void>;
    toggleVehicleInGroup?: (groupId: string | number, vehicleId: string | number) => Promise<void>;
    updateVehicleGroupName?: (groupId: string | number, name: string) => Promise<void>;
    /** When set, only show this specific group (single-group edit mode) */
    focusGroupId?: string | number | null;
    /** When true, only show the "create new group" interface */
    createOnly?: boolean;
}

export function ManageGroupsDialog({
    open,
    onOpenChange,
    vehicleGroups,
    fleetVehicles,
    addVehicleGroup,
    removeVehicleGroup,
    toggleVehicleInGroup,
    updateVehicleGroupName,
    focusGroupId,
    createOnly,
}: ManageGroupsDialogProps) {
    const isSingleGroupMode = focusGroupId != null;
    const showList = !createOnly;
    const showCreate = !isSingleGroupMode;

    const displayedGroups = isSingleGroupMode
        ? vehicleGroups.filter(g => String(g.id) === String(focusGroupId))
        : vehicleGroups;
    const [newGroupName, setNewGroupName] = useState("");
    const [editingGroupId, setEditingGroupId] = useState<string | number | null>(null);
    const [editingName, setEditingName] = useState("");
    // Per-group search state so filtering is scoped to the group being edited
    const [groupSearchTerms, setGroupSearchTerms] = useState<Record<string, string>>({});

    const getFilteredVehicles = (groupId: string | number) => {
        const term = groupSearchTerms[String(groupId)] || "";
        if (!term) return fleetVehicles;
        return fleetVehicles.filter(v =>
            v.label.toLowerCase().includes(term.toLowerCase())
        );
    };

    const setGroupSearchTerm = (groupId: string | number, term: string) => {
        setGroupSearchTerms(prev => ({ ...prev, [String(groupId)]: term }));
    };

    const handleAddGroup = async () => {
        if (newGroupName.trim()) {
            const id = await addVehicleGroup?.(newGroupName.trim());
            if (id) {
                setNewGroupName("");
                if (createOnly) onOpenChange(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-1">
                                    {isSingleGroupMode
                                        ? (displayedGroups[0]?.name || "Grupo")
                                        : createOnly
                                            ? "Registro de Grupo"
                                            : "Gestión de Grupos"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {isSingleGroupMode
                                        ? "Edición de Entidad Operativa"
                                        : createOnly
                                            ? "Nueva Unidad Logística"
                                            : "Control de Estructuras Logísticas"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* CREAR GRUPO */}
                        {showCreate && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Nueva Entidad Operativa
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nombre del grupo operativo..."
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm font-medium"
                                    />
                                    <Button
                                        onClick={handleAddGroup}
                                        disabled={!newGroupName.trim()}
                                        className="h-11 px-6 bg-slate-950 text-white font-black uppercase italic tracking-widest text-[10px] border border-slate-800 shadow-xl shadow-slate-200 rounded-lg shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Registrar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* LISTA DE GRUPOS */}
                        {showList && (
                            <div className="space-y-2">
                                {!isSingleGroupMode && (
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Registros Activos
                                    </Label>
                                )}

                                {displayedGroups.length === 0 ? (
                                    <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Sin registros en base de datos</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="max-h-[50vh]">
                                        <div className="space-y-4 pr-2">
                                            {displayedGroups.map(group => {
                                                const filtered = getFilteredVehicles(group.id);
                                                const searchVal = groupSearchTerms[String(group.id)] || "";
                                                return (
                                                    <div key={group.id} className="border border-slate-100 rounded-xl bg-white p-5 transition-all hover:border-slate-200">
                                                        <div className="flex items-start justify-between mb-4">
                                                            {editingGroupId === group.id ? (
                                                                <div className="flex-1 flex gap-2">
                                                                    <Input
                                                                        autoFocus
                                                                        value={editingName}
                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                        className="h-9 text-sm font-bold border-slate-900"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                updateVehicleGroupName?.(group.id, editingName);
                                                                                setEditingGroupId(null);
                                                                            }
                                                                            if (e.key === 'Escape') setEditingGroupId(null);
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <h5 className="text-sm font-semibold text-slate-900 tracking-tight">{group.name}</h5>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingGroupId(group.id);
                                                                                setEditingName(group.name);
                                                                            }}
                                                                            className="text-slate-300 hover:text-slate-900 transition-colors"
                                                                        >
                                                                            <Edit3 className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        {(group.vehicleIds || []).length} Unidades
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeVehicleGroup?.(group.id)}
                                                                className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>

                                                        {/* SEARCH SCOPED TO THIS GROUP */}
                                                        <div className="space-y-3 pt-3 border-t border-slate-100">
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                                                                <Input
                                                                    placeholder="Buscar vehículos..."
                                                                    value={searchVal}
                                                                    onChange={(e) => setGroupSearchTerm(group.id, e.target.value)}
                                                                    className="h-9 pl-9 pr-4 text-xs font-medium bg-slate-50 border-slate-100 rounded-lg focus:bg-white transition-all"
                                                                />
                                                            </div>

                                                            <ScrollArea className="max-h-[180px]">
                                                                <div className="grid grid-cols-2 gap-1.5 pr-2">
                                                                    {filtered.map(vehicle => {
                                                                        const isInGroup = (group.vehicleIds || []).map(String).includes(String(vehicle.id));
                                                                        return (
                                                                            <button
                                                                                key={vehicle.id}
                                                                                type="button"
                                                                                onClick={() => toggleVehicleInGroup?.(group.id, vehicle.id)}
                                                                                className={cn(
                                                                                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left active:scale-95",
                                                                                    isInGroup
                                                                                        ? "bg-slate-900 border-slate-900 text-white"
                                                                                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                                                                                )}
                                                                            >
                                                                                <span className="truncate pr-1">{vehicle.label}</span>
                                                                                {isInGroup && (
                                                                                    <CheckCircle2 className="h-3 w-3 text-white shrink-0" />
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
