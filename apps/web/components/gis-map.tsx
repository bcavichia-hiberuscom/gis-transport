"use client";
// React & Next.js
import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// Third-party components
import { Truck } from "lucide-react";

// UI Components
import { Sidebar } from "@/components/sidebar";

import { GISMapDialogs } from "@/components/gis-map-dialogs";
import { GISMapPanels } from "@/components/gis-map-panels";
import { GISMapPopup } from "@/components/gis-map-popup";

// Dashboard Monitoring Components
import { MapMonitoringSidebar } from "@/components/dashboard/map-monitoring-sidebar";
import { MapTrackingStatusBar } from "@/components/dashboard/map-tracking-status-bar";
import { MapLayersOverlay } from "@/components/dashboard/map-layers-overlay";

// Custom Hooks
import { useGISState } from "@/hooks/use-gis-state";
import { useFleet } from "@/hooks/use-fleet";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivers } from "@/hooks/use-drivers";
import { useDriverManagement } from "@/hooks/use-driver-management";
import { useCustomPOI } from "@/hooks/use-custom-poi";
import { useRouting } from "@/hooks/use-routing";
import { useLiveTracking } from "@/hooks/use-live-tracking";
import { useAlertLogs } from "@/hooks/use-alert-logs";
import { useVehiclePopup } from "@/hooks/use-vehicle-popup";
import { useMapLayers } from "@/hooks/use-map-layers";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { useVehicleSelection } from "@/hooks/use-vehicle-selection";
import { useAlertMonitoring } from "@/hooks/use-alert-monitoring";
import { useVehicleCoordination } from "@/hooks/use-vehicle-coordination";
import { useJobCoordination } from "@/hooks/use-job-coordination";
import { useMapCoordination } from "@/hooks/use-map-coordination";
import { useDialogCoordination } from "@/hooks/use-dialog-coordination";
import { useZoneDrawing } from "@/hooks/use-zone-drawing";

// Dashboard Components
import { Dashboard, type DashboardModule } from "@/components/dashboard/dashboard";
import { DriversTab } from "./drivers-tab";
import { VehiclesTab } from "./vehicles-tab";
import { OrdersTab } from "./orders-tab";
import { DriverDetailsSheet } from "./driver-details-sheet";
import { FuelDetailsSheet } from "./fuel-details-sheet";

// Types
import type {
  LayerVisibility,
  POI,
  VehicleType,
  WeatherData,
  Zone,
  Driver,
  VehicleMetrics,
} from "@gis/shared";
import { InteractionMode as LocalInteractionMode } from "@/lib/types";
import { VEHICLE_TYPES } from "@/lib/types";
import type { Alert } from "@/lib/utils";

// Utils & Config
import { generateVehicleAlerts, cn } from "@/lib/utils";
import { MAP_CENTER } from "@/lib/config";

const MapContainer = dynamic(() => import("@/components/map-container"), {
  ssr: false,
});

// Constants
const DEFAULT_CENTER: [number, number] = MAP_CENTER;

/**
 * GISMap - Main component for the GIS Transport & Logistics application
 *
 * Responsibilities:
 * - Orchestrates state management across multiple domain concerns
 * - Coordinates vehicle fleet management and driver assignments
 * - Handles route planning and optimization
 * - Manages custom POIs and zone drawing
 * - Provides live tracking and alert monitoring
 *
 * Architecture:
 * - Uses custom hooks for separation of concerns
 * - Delegates UI to specialized sub-components
 * - Maintains global state via useGISState reducer
 */
export function GISMap() {
  const { state, dispatch } = useGISState();

  const { addAlertLog } = useAlertLogs();

  const {
    fleetVehicles,
    fleetJobs,
    selectedVehicleId,
    setSelectedVehicleId,
    clearFleet,
    addVehicleAt,
    addJobAt,
    addStopToVehicle,
    removeVehicle,
    removeJob,
    isLoadingVehicles,
    fetchVehicles,
    updateVehiclePosition,
    updateVehicleMetrics,
    updateVehicleType,
    updateVehicleLabel,
    updateVehicleLicensePlate,
    assignDriverToVehicle,
    setJobAssignments,
    updateJobStatus,
  } = useFleet();

  const {
    vehicles: dataVehicles,
    isLoading: isLoadingApiVehicles,
    addVehicle: addApiVehicle,
    fetchVehicles: fetchApiVehicles,
  } = useVehicles();

  const {
    drivers,
    isLoading: isLoadingDrivers,
    updateDriver,
    fetchDrivers,
    addDriver,
    optimisticUpdateDriver,
  } = useDrivers();

  const { handleAssignDriver } = useDriverManagement({
    fleetVehicles,
    drivers,
    isLoadingVehicles,
    isLoadingDrivers,
    assignDriverToVehicle,
    updateDriver,
    optimisticUpdateDriver,
    fetchDrivers,
  });

  // Map layers management
  const { layers, setLayers, toggleLayer } = useMapLayers();


  // Vehicle popup management
  const {
    vehiclePopupData,
    hoverTimeoutRef,
    handleVehicleHover,
    handleVehicleHoverOut,
    clearPopup,
    clearHoverTimeout,
  } = useVehiclePopup(fleetVehicles, state.isVehicleDetailsOpen);

  // Vehicle selection management
  const {
    handleVehicleClick,
    handleSelectVehicleIdOnly,
    handleHighlightVehicleOnly,
    handleOpenVehiclePanel: handleOpenVehiclePanelFromSelection,
  } = useVehicleSelection(selectedVehicleId, setSelectedVehicleId, clearPopup);

  // Sidebar navigation state
  const {
    sidebarNavigateTab,
    sidebarNavigateDriverId,
    handleViewDriverProfile,
    handleVehicleSelectFromDrivers,
    handleNavigateConsumed,
  } = useSidebarNavigation(setSelectedVehicleId);

  const {
    customPOIs,
    addCustomPOI,
    addCustomZone,
    removeCustomPOI,
    clearAllCustomPOIs,
    updateCustomPOI,
  } = useCustomPOI();

  // Zone drawing coordination (state + handlers)
  const {
    isDrawingZone,
    isEditingZone,
    zoneIsClosed,
    editingZoneData,
    handleStartZonePicking,
    handleContinueZonePicking,
    handleCloseZoneShape,
    handleConfirmZoneDrawing,
    handleUndoZonePoint,
    handleRemoveZonePoint,
    handleUpdateZonePoint,
    handleCancelZoneDrawing,
    handleEditZone,
    handleAddCustomZoneSubmit,
    toggleEditingMode,
  } = useZoneDrawing({
    dispatch,
    zonePoints: state.zonePoints,
    customPOIs,
    addCustomZone,
    updateCustomPOI,
  });

  // Expose confirmZoneDrawing to window for map popup access
  // This is needed for the Leaflet popup "Confirmar" button
  useEffect(() => {
    (window as any).confirmZoneDrawing = handleConfirmZoneDrawing;
    return () => {
      delete (window as any).confirmZoneDrawing;
    };
  }, [handleConfirmZoneDrawing]);

  // Combine API zones with custom zones for routing
  const combinedActiveZones = useMemo(() => {
    const customZones = customPOIs
      .filter((poi) => poi.entityType === "zone" && poi.coordinates)
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        coordinates: zone.coordinates,
        type: zone.zoneType || "LEZ",
        description: zone.description,
        requiredTags: zone.requiredTags,
      }));
    return [...state.activeZones, ...customZones];
  }, [state.activeZones, customPOIs]);

  const {
    routeData,
    setRouteData,
    routeErrors,
    setRouteErrors,
    routeNotices,
    setRouteNotices,
    isCalculatingRoute,
    routePoints,
    setRoutePoints,
    startRouting,
    clearRoute,
  } = useRouting({
    fleetVehicles,
    fleetJobs,
    customPOIs,
    activeZones: combinedActiveZones,
    removeJob,
    setJobAssignments,
    setLayers,
  });

  const handleUpdateVehiclePosition = useCallback(
    (vehicleId: string | number, newCoords: [number, number]) =>
      updateVehiclePosition(String(vehicleId), newCoords),
    [updateVehiclePosition],
  );

  const handleUpdateVehicleMetrics = useCallback(
    (vehicleId: string | number, metrics: VehicleMetrics) =>
      updateVehicleMetrics(String(vehicleId), metrics),
    [updateVehicleMetrics],
  );

  const { isTracking, toggleTracking } = useLiveTracking({
    routeData,
    selectedVehicleId,
    updateVehiclePosition: handleUpdateVehiclePosition,
    updateVehicleMetrics: handleUpdateVehicleMetrics,
    fleetVehicles,
  });

  // Alert monitoring (includes speeding persistence)
  const { vehicleAlerts } = useAlertMonitoring(
    fleetVehicles,
    routeData,
    isTracking,
  );

  // Vehicle coordination (add, remove, update, clear)
  const {
    handleClearAll,
    handleAddVehicle,
    handleChangeEnvironmentalTag,
    handleRemoveVehicle,
    handleSetSelectedVehicle,
  } = useVehicleCoordination({
    dispatch,
    clearFleet,
    clearRoute,
    setSelectedVehicleId,
    updateVehiclePosition,
    updateVehicleMetrics,
    updateVehicleType,
    removeVehicle,
    fleetVehicles,
    drivers,
    updateDriver,
    VEHICLE_TYPES,
  });

  // Job coordination (add, remove, pick)
  const {
    handleAddJob,
    handleAddJobDirectly,
    handleAddJobSubmit,
    handleRemoveJob,
    handleStartPickingJob,
    handleOpenAddJobChange,
  } = useJobCoordination({
    dispatch,
    addJobAt,
    removeJob,
    interactionMode: state.interactionMode,
  });

  // Map coordination (clicks, weather, stations)
  const {
    handleMapClick,
    handleSetMapCenter,
    handleSetWeather,
    handleSetDynamicEVStations,
    handleSetDynamicGasStations,
    handleCancelAddMode,
  } = useMapCoordination({
    dispatch,
    interactionMode: state.interactionMode,
    selectedVehicle: state.selectedVehicle,
    addVehicleAt,
    addJobAt,
    isDrawingZone,
  });

  const {
    handleSetShowCustomPOIs,
    handleSetIsAddCustomPOIOpen,
    handleOpenAddCustomPOIChange,
    handleSetIsAddJobOpen,
  } = useDialogCoordination({
    dispatch,
    interactionMode: state.interactionMode,
    isDrawingZone,
  });

  // Dashboard State
  const [activeModule, setActiveModule] = useState<DashboardModule>("map");

  const handleModuleChange = useCallback(
    (module: DashboardModule) => {
      setActiveModule(module);
    },
    [],
  );

  // Sync with sidebar navigation (legacy support for deep links)
  useEffect(() => {
    if (sidebarNavigateTab) {
      if (sidebarNavigateTab === "drivers") setActiveModule("drivers");
      else setActiveModule("map");
    }
  }, [sidebarNavigateTab]);

  // Get selected vehicle object
  const selectedVehicleObject = useMemo(() => {
    if (!selectedVehicleId || !fleetVehicles) return null;
    return (
      fleetVehicles.find((v) => String(v.id) === String(selectedVehicleId)) ||
      null
    );
  }, [selectedVehicleId, fleetVehicles]);

  const handleStartPicking = useCallback(() => {
    dispatch({ type: "SET_INTERACTION_MODE", payload: "pick-poi" });
    dispatch({ type: "SET_IS_ADD_CUSTOM_POI_OPEN", payload: false });
  }, []);

  const handleStartPickingStop = useCallback(() => {
    dispatch({ type: "SET_INTERACTION_MODE", payload: "pick-stop" });
    dispatch({ type: "SET_IS_ADD_STOP_OPEN", payload: false });
  }, []);

  // Wrapper for vehicle panel opening from popup - opens VehicleDetailsPanel (properties)
  const handleOpenVehiclePanel = useCallback(() => {
    if (vehiclePopupData) {
      setSelectedVehicleId(vehiclePopupData.vehicleId);
      dispatch({ type: "SET_SHOW_VEHICLE_PROPERTIES_PANEL", payload: true });
      dispatch({ type: "SET_IS_VEHICLE_DETAILS_OPEN", payload: false });
      clearPopup();
    }
  }, [vehiclePopupData, setSelectedVehicleId, dispatch, clearPopup]);

  // Wrapper for vehicle select from drivers (needs dispatch)
  const handleVehicleSelectFromDriversWithDispatch = useCallback(
    (vehicleId: string) => {
      handleVehicleSelectFromDrivers(vehicleId);
      dispatch({ type: "SET_IS_VEHICLE_DETAILS_OPEN", payload: false });
    },
    [handleVehicleSelectFromDrivers, dispatch],
  );

  const handleZonesUpdate = useCallback(
    (zones: Zone[]) => dispatch({ type: "SET_ACTIVE_ZONES", payload: zones }),
    [dispatch],
  );


  const handleOpenAddStopChange = useCallback(
    (open: boolean) => {
      dispatch({ type: "SET_IS_ADD_STOP_OPEN", payload: open });
      if (!open) {
        dispatch({ type: "SET_PICKED_STOP_COORDS", payload: null });
        if (state.interactionMode === "pick-stop") {
          dispatch({ type: "SET_INTERACTION_MODE", payload: null });
        }
      }
    },
    [state.interactionMode, dispatch],
  );

  const handleAddStopSubmit = useCallback(
    (coords: [number, number], label: string, eta?: string) => {
      if (selectedVehicleId) {
        addStopToVehicle(selectedVehicleId, coords, label, eta);
        // Recalculate route after adding stop
        // If tracking is active, the useEffect in use-live-tracking will auto-update with new routes
        // The setTimeout allows state updates to complete before routing
        setTimeout(() => startRouting(), 500);
      }
      dispatch({ type: "SET_IS_ADD_STOP_OPEN", payload: false });
      dispatch({ type: "SET_PICKED_STOP_COORDS", payload: null });
    },
    [addStopToVehicle, selectedVehicleId, startRouting, dispatch],
  );

  // Memoize computed addMode to prevent object recreation
  const computedAddMode =
    state.interactionMode === "add-vehicle"
      ? "vehicle"
      : state.interactionMode === "add-job"
        ? "job"
        : null;

  // Memoize customPOIs list to send to MapContainer (only non-empty if showCustomPOIs)
  const displayedCustomPOIs = useMemo(
    () => (state.showCustomPOIs ? customPOIs : []),
    [state.showCustomPOIs, customPOIs],
  );

  // Memoize hasRoute to avoid object recreation
  const hasRoute = useMemo(() => !!routeData, [routeData]);

  // Memoized callbacks to prevent inline function recreation
  const handleToggleGasStationLayer = useCallback(
    () => toggleLayer("gasStations"),
    [toggleLayer],
  );

  const handleClearRouteErrors = useCallback(() => {
    setRouteErrors([]);
    setRouteNotices([]);
  }, []);

  const handleDriverDetailsOpenChange = useCallback(
    (open: boolean) => {
      dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: open });
    },
    [dispatch],
  );

  const handleDriverDetailsClose = useCallback(() => {
    dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: false });
    dispatch({ type: "SET_SELECTED_DRIVER", payload: null });
  }, [dispatch]);

  const handleCloseVehiclePropertiesPanel = useCallback(() => {
    dispatch({
      type: "SET_SHOW_VEHICLE_PROPERTIES_PANEL",
      payload: false,
    });
    setSelectedVehicleId(null);
  }, [dispatch, setSelectedVehicleId]);

  const handleCloseVehicleDetails = useCallback(() => {
    dispatch({
      type: "SET_IS_VEHICLE_DETAILS_OPEN",
      payload: false,
    });
    setSelectedVehicleId(null);
  }, [dispatch, setSelectedVehicleId]);

  // Keyboard shortcuts for zone drawing
  useEffect(() => {
    if (!isDrawingZone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc: Cancel drawing
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancelZoneDrawing();
      }
      // Ctrl+Z: Undo last point
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndoZonePoint();
      }
      // Enter: Confirm drawing (if >= 3 points)
      if (e.key === "Enter" && state.zonePoints.length >= 3) {
        e.preventDefault();
        handleConfirmZoneDrawing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isDrawingZone,
    state.zonePoints.length,
    handleConfirmZoneDrawing,
    handleUndoZonePoint,
    handleCancelZoneDrawing,
  ]);

  return (
    <Dashboard activeModule={activeModule} onModuleChange={handleModuleChange}>
      <div className={cn("h-full w-full relative", activeModule !== "map" && "hidden")}>
        <MapContainer
          layers={layers}
          toggleLayer={toggleLayer}
          routeData={routeData}
          setRouteData={setRouteData}
          setWeather={handleSetWeather}
          isRouting={isCalculatingRoute}
          routePoints={routePoints}
          setRoutePoints={setRoutePoints}
          dynamicEVStations={state.dynamicEVStations}
          setDynamicEVStations={handleSetDynamicEVStations}
          dynamicGasStations={state.dynamicGasStations}
          setDynamicGasStations={handleSetDynamicGasStations}
          mapCenter={state.mapCenter}
          setMapCenter={handleSetMapCenter}
          selectedVehicle={state.selectedVehicle}
          customPOIs={displayedCustomPOIs}
          fleetVehicles={dataVehicles && dataVehicles.length > 0 ? dataVehicles : fleetVehicles}
          fleetJobs={fleetJobs}
          selectedVehicleId={selectedVehicleId}
          vehicleAlerts={vehicleAlerts}
          onMapClick={handleMapClick}
          pickedJobCoords={state.pickedJobCoords}
          zonePoints={state.zonePoints}
          zoneIsClosed={zoneIsClosed}
          interactionMode={state.interactionMode}
          isEditingZone={isEditingZone}
          onRemoveZonePoint={handleRemoveZonePoint}
          onUpdateZonePoint={handleUpdateZonePoint}
          onZonesUpdate={handleZonesUpdate}
          onEditZone={handleEditZone}
          isInteracting={!!state.interactionMode || isCalculatingRoute}
          onVehicleTypeChange={updateVehicleType}
          onVehicleLabelUpdate={updateVehicleLabel}
          onVehicleSelect={handleVehicleClick}
          onVehicleHover={handleVehicleHover}
          onVehicleHoverOut={handleVehicleHoverOut}
          hiddenZones={state.hiddenZones}
          onToggleZoneVisibility={(id) => dispatch({ type: "TOGGLE_ZONE_VISIBILITY", payload: id })}
          onDeleteZone={removeCustomPOI}
        />

        {/* Professional Monitoring Overlays */}
        <MapMonitoringSidebar
          vehicles={fleetVehicles}
          jobs={fleetJobs}
          selectedId={selectedVehicleId}
          onSelect={(id) => setSelectedVehicleId(id ? String(id) : null)}
          vehicleAlerts={vehicleAlerts}
        />

        <MapTrackingStatusBar
          vehicle={selectedVehicleObject}
          isTracking={isTracking}
        />

        <MapLayersOverlay
          layers={layers}
          toggleLayer={toggleLayer}
          onAddZone={() => {
            // Start zone picking flow directly
            handleStartZonePicking();
          }}
          customZones={customPOIs.filter(poi => poi.entityType === 'zone')}
          hiddenZones={state.hiddenZones}
          onToggleZoneVisibility={(id) => dispatch({ type: "TOGGLE_ZONE_VISIBILITY", payload: id })}
          onDeleteZone={removeCustomPOI}
        />
      </div>



      {/* 4. Drivers Module */}
      {activeModule === "drivers" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <DriversTab
            drivers={drivers || []}
            fleetVehicles={fleetVehicles || []}
            isLoading={isLoadingDrivers || false}
            fetchDrivers={fetchDrivers || (async () => { })}
            addDriver={addDriver || (async () => undefined)}
            onDriverSelect={(d) => {
              const fullDriver = drivers.find(drv => drv.id === d.id);
              if (fullDriver) {
                dispatch({ type: "SET_SELECTED_DRIVER", payload: fullDriver });
                dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: true });
              }
            }}
            onFuelDetailSelect={(driverId) => {
              const fullDriver = drivers.find(drv => drv.id === driverId);
              if (fullDriver) {
                dispatch({ type: "SET_SELECTED_DRIVER", payload: fullDriver });
                dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: true });
              }
            }}
            onVehicleSelect={handleVehicleSelectFromDriversWithDispatch}
            expandedGroups={state.driversExpandedGroups}
            onToggleGroup={(group, isExpanded) =>
              dispatch({ type: "SET_DRIVERS_EXPANDED_GROUPS", payload: { ...state.driversExpandedGroups, [group]: isExpanded } })
            }
          />
        </div>
      )}

      {/* 5. Vehicles Module */}
      {activeModule === "vehicles" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <VehiclesTab
            fleetVehicles={dataVehicles || []}
            isLoading={isLoadingApiVehicles || false}
            fetchVehicles={fetchApiVehicles || (async () => { })}
            addVehicle={addApiVehicle || (async () => undefined)}
            onVehicleSelect={(v) => {
              setSelectedVehicleId(String(v.id));
            }}
          />
        </div>
      )}

      {/* 6. Orders Module */}
      {activeModule === "orders" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <OrdersTab
            fleetJobs={fleetJobs || []}
            isLoading={isLoadingVehicles || false}
            addJob={() => {
              dispatch({ type: "SET_IS_ADD_JOB_OPEN", payload: true });
            }}
            fetchJobs={async () => {
              await fetchVehicles();
            }}
            removeJob={removeJob || (async () => { })}
            onJobSelect={(job) => {
              // Placeholder for future job selection functionality
            }}
          />
        </div>
      )}

      {/* Global HUD elements (Dialogs, Popups, etc) */}
      <GISMapDialogs
        isAddJobOpen={state.isAddJobOpen}
        onOpenAddJobChange={handleOpenAddJobChange}
        onAddJobSubmit={handleAddJobSubmit}
        mapCenter={state.mapCenter}
        onStartPickingJob={handleStartPickingJob}
        pickedJobCoords={state.pickedJobCoords}
        isAddCustomPOIOpen={state.isAddCustomPOIOpen}
        onOpenAddCustomPOIChange={handleOpenAddCustomPOIChange}
        onSubmitZone={handleAddCustomZoneSubmit}
        onStartZonePicking={handleStartZonePicking}
        onContinueZonePicking={handleContinueZonePicking}
        onCloseShape={handleCloseZoneShape}
        zonePoints={state.zonePoints}
        zoneIsClosed={zoneIsClosed}
        isDrawingZone={isDrawingZone}
        isEditingZone={isEditingZone}
        editingZoneData={editingZoneData}
        routeErrors={routeErrors}
        routeNotices={routeNotices}
        onClearRouteErrors={handleClearRouteErrors}
      />

      <GISMapPanels
        selectedDriver={state.selectedDriver}
        isDriverDetailsOpen={state.isDriverDetailsOpen}
        onDriverDetailsOpenChange={(open) => dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: open })}
        onDriverDetailsClose={() => dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: false })}
        isFuelDetailsOpen={state.isFuelDetailsOpen}
        onFuelDetailsOpenChange={(open) => dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: open })}
        onFuelDetailsClose={() => dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: false })}
        showVehiclePropertiesPanel={state.showVehiclePropertiesPanel}
        selectedVehicleId={selectedVehicleId}
        isVehicleDetailsOpen={state.isVehicleDetailsOpen}
        selectedVehicleObject={selectedVehicleObject}
        onCloseVehiclePropertiesPanel={handleCloseVehiclePropertiesPanel}
        drivers={drivers}
        onAssignDriver={handleAssignDriver}
        onChangeEnvironmentalTag={handleChangeEnvironmentalTag}
        onUpdateLabel={updateVehicleLabel}
        onUpdateLicensePlate={updateVehicleLicensePlate}
        onViewDriverProfile={handleViewDriverProfile}
        onCloseVehicleDetails={handleCloseVehicleDetails}
        fleetJobs={fleetJobs}
        addStopToVehicle={addStopToVehicle}
        startRouting={startRouting}
        isAddStopOpen={state.isAddStopOpen}
        setIsAddStopOpen={handleOpenAddStopChange}
        onStartPickingStop={handleStartPickingStop}
        pickedStopCoords={state.pickedStopCoords}
        onAddStopSubmit={handleAddStopSubmit}
      />

      <GISMapPopup
        vehiclePopupData={vehiclePopupData}
        onMouseEnter={clearHoverTimeout}
        onMouseLeave={clearPopup}
        onOpenVehiclePanel={handleOpenVehiclePanel}
      />
    </Dashboard>
  );
}
