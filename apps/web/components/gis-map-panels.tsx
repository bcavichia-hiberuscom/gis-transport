"use client";
import React from "react";
import type { Driver, FleetVehicle, FleetJob } from "@gis/shared";

interface GISMapPanelsProps {
  // Common
  selectedVehicleId: string | number | null;
  selectedVehicleObject: FleetVehicle | null;
  drivers: Driver[];
  onAssignDriver: (vehicleId: string | number, newDriver: Driver | null) => Promise<void>;
  onChangeEnvironmentalTag: (vehicleId: string | number, tagId: string) => void;
  onUpdateLabel: (vehicleId: string | number, label: string) => void;
  onUpdateLicensePlate: (vehicleId: string | number, plate: string) => void;
  onViewDriverProfile: (driverId: string) => void;

  // Route Management
  fleetJobs: FleetJob[];
  addStopToVehicle: (
    vehicleId: string | number,
    coords: [number, number],
    label?: string,
  ) => void;
  startRouting: () => void;
  isAddStopOpen: boolean;
  setIsAddStopOpen: (open: boolean) => void;
  onStartPickingStop: () => void;
  pickedStopCoords: [number, number] | null;
  onAddStopSubmit: (coords: [number, number], label: string) => void;
}

export function GISMapPanels({
  selectedVehicleObject,
  drivers,
  onAssignDriver,
  onChangeEnvironmentalTag,
  onUpdateLabel,
  onUpdateLicensePlate,
  onViewDriverProfile,
  fleetJobs,
  addStopToVehicle,
  startRouting,
  isAddStopOpen,
  setIsAddStopOpen,
  onStartPickingStop,
  pickedStopCoords,
  onAddStopSubmit,
}: GISMapPanelsProps) {
  // Note: VehicleDetailsPanel and VehicleDetailSheet are currently disabled
  // as per user request to only show the route status bar on click.
  // We keep the logic for future restoration or other triggers (like sidebar).
  // For now, we return null to ensure they don't show up.
  return null;
}
