"use client";
import { useCallback } from "react";
import { useGISState } from "@/hooks/use-gis-state";

export function useVehicleSelection(
  selectedVehicleId: string | null,
  setSelectedVehicleId: (id: string | null) => void,
) {
  const { dispatch } = useGISState();

  const handleVehicleClick = useCallback(
    (vehicleId: string) => {
      setSelectedVehicleId(vehicleId);
    },
    [setSelectedVehicleId],
  );

  const handleSelectVehicleIdOnly = useCallback(
    (id: string | number | null) => {
      setSelectedVehicleId(id ? String(id) : null);
      // Close any open panels when selecting a vehicle
      dispatch({ type: "SET_IS_VEHICLE_DETAILS_OPEN", payload: false });
      dispatch({
        type: "SET_SHOW_VEHICLE_PROPERTIES_PANEL",
        payload: false,
      });
    },
    [setSelectedVehicleId, dispatch],
  );

  // Highlight vehicle without opening properties panel (for dashboard)
  const handleHighlightVehicleOnly = useCallback(
    (id: string | number | null) => {
      setSelectedVehicleId(id ? String(id) : null);
      // Close panels but don't open properties panel
      dispatch({ type: "SET_IS_VEHICLE_DETAILS_OPEN", payload: false });
      dispatch({ type: "SET_SHOW_VEHICLE_PROPERTIES_PANEL", payload: false });
    },
    [setSelectedVehicleId, dispatch],
  );

  return {
    selectedVehicleId,
    handleVehicleClick,
    handleSelectVehicleIdOnly,
    handleHighlightVehicleOnly,
  };
}
