"use client";
import React from "react";
import { AddJobDialog } from "@/components/add-job-dialog";
import { AddCustomZoneDialog } from "@/components/add-custom-drawing-zone";
import {
  RouteErrorAlert,
  type RouteError,
} from "@/components/route-error-alert";
import type { RouteNotice } from "@gis/shared";

interface EditingZoneData {
  id: string;
  name: string;
  description?: string;
  zoneType?: string;
  requiredTags?: string[];
}

interface GISMapDialogsProps {
  // Job Dialog
  isAddJobOpen: boolean;
  onOpenAddJobChange: (open: boolean) => void;
  onAddJobSubmit: (coords: [number, number], label: string, eta?: string) => void;
  mapCenter: [number, number];
  onStartPickingJob: () => void;
  pickedJobCoords: [number, number] | null;

  // Zone Dialog
  isAddCustomPOIOpen: boolean;
  onOpenAddCustomPOIChange: (open: boolean) => void;
  onSubmitZone: (
    name: string,
    coordinates: any,
    desc?: string,
    zoneType?: string,
    requiredTags?: string[],
  ) => void;
  onStartZonePicking: () => void;
  onContinueZonePicking: () => void;
  onCloseShape: () => void;
  zonePoints: [number, number][];
  zoneIsClosed: boolean;
  isDrawingZone: boolean;
  isEditingZone: boolean;
  editingZoneData: EditingZoneData | null;

  // Route Errors
  routeErrors: RouteError[];
  routeNotices: RouteNotice[];
  onClearRouteErrors: () => void;
  customEntityMode?: "point" | "zone";
}

export function GISMapDialogs({
  isAddJobOpen,
  onOpenAddJobChange,
  onAddJobSubmit,
  mapCenter,
  onStartPickingJob,
  pickedJobCoords,
  isAddCustomPOIOpen,
  onOpenAddCustomPOIChange,
  onSubmitZone,
  onStartZonePicking,
  onContinueZonePicking,
  onCloseShape,
  zonePoints,
  zoneIsClosed,
  isDrawingZone,
  isEditingZone,
  editingZoneData,
  routeErrors,
  routeNotices,
  onClearRouteErrors,
}: GISMapDialogsProps) {
  return (
    <>
      <AddJobDialog
        isOpen={isAddJobOpen}
        onOpenChange={onOpenAddJobChange}
        onSubmit={onAddJobSubmit}
        mapCenter={mapCenter}
        onStartPicking={onStartPickingJob}
        pickedCoords={pickedJobCoords}
      />

      <AddCustomZoneDialog
        isOpen={isAddCustomPOIOpen}
        onOpenChange={onOpenAddCustomPOIChange}
        onSubmitZone={onSubmitZone}
        zonePoints={zonePoints}
        isDrawingZone={isDrawingZone}
        isEditingZone={isEditingZone}
        editingZoneData={editingZoneData}
      />

      <RouteErrorAlert
        errors={routeErrors}
        notices={routeNotices}
        onClear={onClearRouteErrors}
      />
    </>
  );
}
