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
  Workflow,
  Gauge,
  Route,
  Sparkles,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetJob, FleetVehicle, Zone, VehicleGroup } from "@gis/shared";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ManageGroupsDialog } from "@/components/manage-groups-dialog";
import { Switch } from "@/components/ui/switch";
import { MapPreviewModal } from "@/components/map-preview-modal";

interface AsignacionViewProps {
  fleetJobs: FleetJob[];
  fleetVehicles: FleetVehicle[];
  activeZones: Zone[];
  setJobAssignments: (
    assignments: {
      jobId: string | number;
      vehicleId?: string | number;
      groupId?: string | number;
    }[],
  ) => void;
  startRouting: (overrides?: {
    vehicles?: FleetVehicle[];
    jobs?: FleetJob[];
    preference?: "fastest" | "shortest" | "health";
    traffic?: boolean;
    avoidPoorSmoothness?: boolean;
  }) => Promise<any>;
  isCalculatingRoute?: boolean;
  vehicleGroups?: VehicleGroup[];
  addVehicleGroup?: (
    name: string,
    vehicleIds?: (string | number)[],
  ) => Promise<string | null>;
  removeVehicleGroup?: (groupId: string | number) => Promise<void>;
  toggleVehicleInGroup?: (
    groupId: string | number,
    vehicleId: string | number,
  ) => Promise<void>;
  updateVehicleGroupName?: (
    groupId: string | number,
    name: string,
  ) => Promise<void>;
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
  updateVehicleGroupName,
}: AsignacionViewProps) {
  const [selectedJobIds, setSelectedJobIds] = useState<(string | number)[]>([]);
  const [lastClickedJobId, setLastClickedJobId] = useState<
    string | number | null
  >(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    jobIds: (string | number)[];
    vehicleId?: string | number;
    groupId?: string | number;
  } | null>(null);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

  // Map Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{
    jobs: FleetJob[];
    vehicles?: FleetVehicle[];
    groupId?: string | number;
  } | null>(null);

  const [focusGroupId, setFocusGroupId] = useState<string | number | null>(
    null,
  );
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isCreateOnly, setIsCreateOnly] = useState(false);

  const [trafficEnabled, setTrafficEnabled] = useState(false);

  const unassignedJobs = useMemo(
    () => fleetJobs.filter((j) => !j.assignedVehicleId && !j.assignedGroupId),
    [fleetJobs],
  );

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return unassignedJobs;
    return unassignedJobs.filter((j) =>
      j.label.toLowerCase().includes(jobSearch.toLowerCase()),
    );
  }, [unassignedJobs, jobSearch]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch) return vehicleGroups;
    return vehicleGroups.filter((g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()),
    );
  }, [vehicleGroups, groupSearch]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return fleetVehicles;
    return fleetVehicles.filter((v) =>
      v.label.toLowerCase().includes(vehicleSearch.toLowerCase()),
    );
  }, [fleetVehicles, vehicleSearch]);

  const handleJobClick = (e: React.MouseEvent, jobId: string | number) => {
    if (
      e.shiftKey &&
      lastClickedJobId &&
      unassignedJobs.some((j) => j.id === lastClickedJobId)
    ) {
      const currentIdx = unassignedJobs.findIndex((j) => j.id === jobId);
      const lastIdx = unassignedJobs.findIndex(
        (j) => j.id === lastClickedJobId,
      );
      const start = Math.min(currentIdx, lastIdx);
      const end = Math.max(currentIdx, lastIdx);
      const newRange = unassignedJobs.slice(start, end + 1).map((j) => j.id);
      setSelectedJobIds((prev) => Array.from(new Set([...prev, ...newRange])));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedJobIds((prev) =>
        prev.includes(jobId)
          ? prev.filter((id) => id !== jobId)
          : [...prev, jobId],
      );
    } else {
      setSelectedJobIds((prev) =>
        prev.length === 1 && prev[0] === jobId ? [] : [jobId],
      );
    }
    setLastClickedJobId(jobId);
  };

  const handleManualAssign = async (target: {
    vehicleId?: string | number;
    groupId?: string | number;
  }) => {
    if (selectedJobIds.length === 0) return;
    setAssignmentError(null);

    const targetJobs = fleetJobs.filter((j) => selectedJobIds.includes(j.id));
    setPreviewTarget({
      jobs: targetJobs,
      vehicles: target.vehicleId
        ? fleetVehicles.filter((v) => String(v.id) === String(target.vehicleId))
        : undefined,
      groupId: target.groupId,
    });
    setIsPreviewModalOpen(true);
  };

  const handleAutoOptimize = async () => {
    if (unassignedJobs.length === 0) return;
    setAssignmentError(null);

    setPreviewTarget({
      jobs: unassignedJobs,
    });
    setIsPreviewModalOpen(true);
  };

  const confirmRouting = async (
    preference: "shortest" | "fastest" | "health",
  ) => {
    if (!previewTarget) return;
    setAssignmentError(null);

    const jobIdsToAssign = previewTarget.jobs.map((j) => j.id);

    const nextJobs = fleetJobs.map((j) =>
      jobIdsToAssign.includes(j.id)
        ? {
            ...j,
            assignedVehicleId: previewTarget.vehicles?.[0]?.id,
            assignedGroupId: previewTarget.groupId,
          }
        : j,
    );

    let vehiclesOverride: FleetVehicle[] | undefined = previewTarget.vehicles;
    if (
      previewTarget.groupId &&
      (!vehiclesOverride || vehiclesOverride.length === 0)
    ) {
      const group = vehicleGroups.find(
        (g) => String(g.id) === String(previewTarget.groupId),
      );
      if (group) {
        const groupVehicleIds = new Set(group.vehicleIds.map(String));
        vehiclesOverride = fleetVehicles
          .filter((v) => groupVehicleIds.has(String(v.id)))
          .map((v) => ({
            ...v,
            groupIds: Array.from(
              new Set([...((v as any).groupIds || []), previewTarget.groupId!]),
            ),
          })) as FleetVehicle[];

        if (vehiclesOverride.length === 0) {
          setAssignmentError(
            "El grupo seleccionado no tiene vehículos vinculados",
          );
          return;
        }
      }
    }

    try {
      const result = await startRouting({
        jobs: nextJobs,
        vehicles: vehiclesOverride,
        preference: preference,
        traffic: trafficEnabled,
        // avoidPoorSmoothness is automatically controlled by the API based on preference
      });

      if (result && (result as any).aborted) {
        // The dialog in gis-map will handle the routing once the driver is assigned.
        // We must not map jobs yet to prevent bypassing the driver rule.
        setPreviewTarget(null);
        setIsPreviewModalOpen(false);
        setSelectedJobIds([]); // Clear selection so the user isn't stuck visually
        return;
      }

      if (result && (result as any).error) {
        throw new Error((result as any).error);
      }

      if (result && result.unassignedJobs && result.unassignedJobs.length > 0) {
        const failedIds = result.unassignedJobs.map((u: any) => String(u.id));
        const actuallyFailedSelection = jobIdsToAssign.filter((id) =>
          failedIds.includes(String(id)),
        );

        if (actuallyFailedSelection.length > 0) {
          const failInfo = result.unassignedJobs.find(
            (u: any) => String(u.id) === String(actuallyFailedSelection[0]),
          );
          throw new Error(
            failInfo?.reason ||
              "Restricción: No se encontró ruta válida para esta asignación",
          );
        }
      }

      // Only set assignments if this was a manual specific assignment
      if (previewTarget.vehicles?.length! > 0 || previewTarget.groupId) {
        const assignments = jobIdsToAssign.map((jobId) => ({
          jobId,
          vehicleId: previewTarget.vehicles?.[0]?.id,
          groupId: previewTarget.groupId,
        }));
        setJobAssignments(assignments);
      }

      setSelectedJobIds([]);
    } catch (err) {
      console.error("[AsignacionView] Fallo en la asignación:", err);
      setAssignmentError(`Error: ${(err as Error).message}`);
    } finally {
      setPreviewTarget(null);
      setIsPreviewModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col grow h-full bg-white animate-in fade-in duration-500">
      {/* Operational Metrics Sub-header */}
      <div className="shrink-0 px-10 py-6 border-b border-[#EAEAEA] bg-[#F7F8FA]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[#1C1C1C] text-[#D4F04A] flex items-center justify-center rounded-lg shadow-sm">
              <Workflow strokeWidth={1.5} className="h-5 w-5" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Routing Preferences and Traffic removed as per user request (handled in Modal now) */}

            <button
              onClick={handleAutoOptimize}
              disabled={isCalculatingRoute || unassignedJobs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1C1C1C] text-[#D4F04A] hover:bg-[#D4F04A] hover:text-[#1C1C1C] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isCalculatingRoute ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Optimización Eficiente
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {assignmentError && (
        <div className="shrink-0 bg-red-50 border-b border-red-100 px-10 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs font-medium text-red-600">
              {assignmentError}
            </p>
          </div>
          <button
            onClick={() => setAssignmentError(null)}
            className="text-[10px] font-medium text-red-400 uppercase tracking-wider hover:text-red-700 transition-all bg-white px-2 py-1 rounded border border-red-100"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Three-column layout */}
      <div className="flex-1 min-h-0 px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-20">
        {/* Column 1: Pedidos Pendientes */}
        <div className="flex flex-col h-full min-h-[500px] bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6B7280]/20" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#6B7280]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                Pedidos
              </span>
            </div>
            <Badge className="bg-[#F7F8FA] text-[#6B7280] h-6 px-3 border border-[#EAEAEA] font-bold tabular-nums rounded text-[10px]">
              {unassignedJobs.length}
            </Badge>
          </div>

          <div className="shrink-0 px-6 py-4 border-b border-[#EAEAEA] bg-[#F7F8FA]/50">
            <div className="relative group">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40 group-focus-within:text-[#1C1C1C] transition-colors"
              />
              <input
                type="text"
                placeholder="Filtrar por ID..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2 text-[11px] font-medium placeholder:text-[#6B7280]/50 outline-none rounded border border-[#EAEAEA] focus:border-[#1C1C1C] transition-all tabular-nums"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#F7F8FA]/50 border-t-0 p-4">
            {filteredJobs.length > 0 ? (
              <div className="p-4 flex flex-col gap-3">
                {filteredJobs.map((job) => {
                  const isSelected = selectedJobIds.includes(job.id);
                  return (
                    <div
                      key={job.id}
                      onClick={(e) => handleJobClick(e, job.id)}
                      className={cn(
                        "p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer rounded-lg border",
                        isSelected
                          ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#D4F04A]"
                          : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-md border shrink-0 transition-all",
                          isSelected
                            ? "bg-[#1C1C1C] border-[#D4F04A]/20 text-[#D4F04A]"
                            : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]",
                        )}
                      >
                        <Package strokeWidth={1.5} className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            "text-[12px] font-medium truncate tracking-tight",
                            isSelected ? "text-white" : "text-[#1C1C1C]",
                          )}
                        >
                          {job.label}
                        </h4>
                        <span
                          className={cn(
                            "text-[9px] font-medium tabular-nums uppercase tracking-wider",
                            isSelected
                              ? "text-[#D4F04A]/60"
                              : "text-[#6B7280]/60",
                          )}
                        >
                          ID-{String(job.id).substring(0, 8)}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          strokeWidth={2}
                          className="h-4 w-4 text-[#D4F04A]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center px-10 bg-white border border-dashed border-[#EAEAEA] rounded-md h-full flex flex-col items-center justify-center">
                <Package
                  strokeWidth={1.25}
                  className="h-8 w-8 text-[#6B7280]/30 mb-3"
                />
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/40">
                  Sin registros pendientes
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Column 2: Grupos Operativos */}
        <div className="flex flex-col h-full min-h-[500px] bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1C1C1C]" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1C1C1C] outline outline-2 outline-offset-1 outline-[#EAEAEA]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                Grupos Logísticos
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-[#1C1C1C] text-[#D4F04A] h-6 px-3 border border-[#1C1C1C] font-bold tabular-nums rounded text-[10px]">
                {vehicleGroups.length}
              </Badge>
              <button
                onClick={() => {
                  setFocusGroupId(null);
                  setIsCreateOnly(true);
                  setIsGroupManagerOpen(true);
                }}
                className="h-6 w-6 flex items-center justify-center rounded bg-[#F7F8FA] border border-[#EAEAEA] text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-[#D4F04A] transition-all"
              >
                <Plus strokeWidth={1.5} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-b border-[#EAEAEA] bg-[#F7F8FA]/50">
            <div className="relative group">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40 group-focus-within:text-[#1C1C1C] transition-colors"
              />
              <input
                type="text"
                placeholder="Filtrar grupos..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2 text-[11px] font-medium placeholder:text-[#6B7280]/50 outline-none rounded border border-[#EAEAEA] focus:border-[#1C1C1C] transition-all"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#F7F8FA]/50 border-t-0">
            <div className="p-4 flex flex-col gap-3">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const isPending = pendingAssignment?.groupId === group.id;
                  const canAssign = !!selectedJobIds.length && !isPending;
                  const vehicleCount = (group.vehicleIds || []).length;
                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        if (selectedJobIds.length > 0) {
                          if (canAssign)
                            handleManualAssign({ groupId: group.id });
                        } else {
                          setFocusGroupId(group.id);
                          setIsCreateOnly(false);
                          setIsGroupManagerOpen(true);
                        }
                      }}
                      className={cn(
                        "p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer rounded-lg border",
                        canAssign
                          ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#D4F04A]"
                          : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 flex items-center justify-center rounded-md border shrink-0 transition-all",
                          canAssign
                            ? "bg-[#1C1C1C] border-[#D4F04A]/20 text-[#D4F04A]"
                            : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]",
                        )}
                      >
                        {isPending ? (
                          <Activity
                            strokeWidth={1.5}
                            className="h-5 w-5 animate-spin"
                          />
                        ) : (
                          <Users strokeWidth={1.5} className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-medium text-[#1C1C1C] truncate uppercase tracking-tight">
                          {group.name}
                        </h4>
                        <p className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wider mt-1 opacity-60">
                          {vehicleCount} Unidades
                        </p>
                      </div>
                      <ChevronRight
                        strokeWidth={1.5}
                        className="h-4 w-4 text-[#6B7280]/40"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center px-10 bg-white border border-dashed border-[#EAEAEA] rounded-md h-full flex flex-col items-center justify-center">
                  <Users
                    strokeWidth={1.25}
                    className="h-8 w-8 text-[#6B7280]/30 mb-3"
                  />
                  <span className="text-[10px] font-medium text-[#6B7280]/50 uppercase tracking-wider">
                    Sin grupos configurados
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 3: Vehículos Individuales */}
        <div className="flex flex-col h-full min-h-[500px] bg-white border border-[#EAEAEA] rounded-md shadow-sm overflow-hidden group hover:border-[#D0D0D0] transition-colors">
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4F04A]" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                Activos Flota
              </span>
            </div>
            <Badge className="bg-[#D4F04A]/10 text-[#5D6B1A] border-[#D4F04A]/20 h-6 px-3 font-bold tabular-nums rounded text-[10px]">
              {fleetVehicles.length}
            </Badge>
          </div>

          <div className="shrink-0 px-6 py-4 border-b border-[#EAEAEA] bg-[#F7F8FA]/50">
            <div className="relative group">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40 group-focus-within:text-[#1C1C1C] transition-colors"
              />
              <input
                type="text"
                placeholder="Filtrar vehículos..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2 text-[11px] font-medium placeholder:text-[#6B7280]/50 outline-none rounded border border-[#EAEAEA] focus:border-[#1C1C1C] transition-all"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#F7F8FA]/50 border-t-0 p-4">
            <div className="p-4 flex flex-col gap-3">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                  const isPending = pendingAssignment?.vehicleId === vehicle.id;
                  const canAssign = !!selectedJobIds.length && !isPending;
                  return (
                    <div
                      key={vehicle.id}
                      onClick={() =>
                        canAssign &&
                        handleManualAssign({ vehicleId: vehicle.id })
                      }
                      className={cn(
                        "p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer rounded-lg border",
                        canAssign
                          ? "border-[#1C1C1C] bg-[#1C1C1C] text-[#D4F04A]"
                          : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40",
                      )}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-md border shrink-0 transition-all",
                            canAssign
                              ? "bg-[#1C1C1C] border-[#D4F04A]/20 text-[#D4F04A]"
                              : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280]",
                          )}
                        >
                          {isPending ? (
                            <Activity
                              strokeWidth={1.5}
                              className="h-5 w-5 animate-spin"
                            />
                          ) : (
                            <Truck strokeWidth={1.5} className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            "text-[12px] font-medium truncate uppercase tracking-tight",
                            canAssign ? "text-white" : "text-[#1C1C1C]",
                          )}
                        >
                          {vehicle.label}
                        </h4>
                        <p
                          className={cn(
                            "text-[9px] font-medium uppercase tracking-wider mt-1 opacity-60",
                            canAssign ? "text-[#D4F04A]" : "text-[#6B7280]",
                          )}
                        >
                          {vehicle.type.label}
                        </p>
                      </div>
                      {canAssign && (
                        <CheckCircle2
                          strokeWidth={2}
                          className="h-4 w-4 text-[#D4F04A]"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center px-10 bg-white border border-dashed border-[#EAEAEA] rounded-md h-full flex flex-col items-center justify-center">
                  <Truck
                    strokeWidth={1.25}
                    className="h-8 w-8 text-[#6B7280]/30 mb-3"
                  />
                  <span className="text-[10px] font-medium text-[#6B7280]/50 uppercase tracking-wider">
                    Sin vehículos encontrados
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* SELECCIÓN FLOTANTE */}
      {selectedJobIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#1C1C1C] rounded-lg px-8 py-4 flex items-center gap-10 border border-[#D4F04A]/20 shadow-2xl z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[#D4F04A] text-[#1C1C1C] flex items-center justify-center font-semibold text-lg rounded shadow-lg">
              {selectedJobIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white uppercase tracking-wider">
                Lote Seleccionado
              </span>
              <span className="text-[10px] font-medium text-[#D4F04A] uppercase tracking-widest opacity-80">
                Asignar a destino
              </span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <button
            className="text-[11px] font-medium text-white/60 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2 group"
            onClick={() => {
              setSelectedJobIds([]);
              setAssignmentError(null);
            }}
          >
            <X strokeWidth={1.5} className="h-4 w-4" />
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

      {/* MAP PREVIEW MODAL */}
      {previewTarget && (
        <MapPreviewModal
          open={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
          targetVariables={previewTarget}
          fleetVehicles={fleetVehicles}
          vehicleGroups={vehicleGroups}
          activeZones={activeZones}
          onConfirm={confirmRouting}
        />
      )}
    </div>
  );
}
