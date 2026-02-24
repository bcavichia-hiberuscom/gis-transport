"use client";
// React & Next.js
import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

import { GISMapDialogs } from "@/components/gis-map-dialogs";
import { GISMapPanels } from "@/components/gis-map-panels";

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
import { useMapLayers } from "@/hooks/use-map-layers";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";

import { useAlertMonitoring } from "@/hooks/use-alert-monitoring";
import { useVehicleCoordination } from "@/hooks/use-vehicle-coordination";
import { useJobCoordination } from "@/hooks/use-job-coordination";
import { useMapCoordination } from "@/hooks/use-map-coordination";
import { useDialogCoordination } from "@/hooks/use-dialog-coordination";
import { useZoneDrawing } from "@/hooks/use-zone-drawing";

// Dashboard Components
import {
  Dashboard,
  type DashboardModule,
} from "@/components/dashboard/dashboard";
import { DriversTab } from "./drivers-tab";
import { VehiclesTab } from "./vehicles-tab";
import { OrdersTab } from "./orders-tab";
import { DriverDetailsSheet } from "./driver-details-sheet";
import { FuelDetailsSheet } from "./fuel-details-sheet";
import { FuelManagementTab } from "./fuel-management-tab";
import { WeatherTab } from "./weather-tab";
import { AnalyticsTab } from "./analytics-tab";

// Types
import type {
  LayerVisibility,
  POI,
  VehicleType,
  WeatherData,
  Zone,
  Driver,
  VehicleMetrics,
  FleetVehicle,
  FleetJob,
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
    updateDriverSpeedingEvents,
    setJobAssignments,
    updateJobStatus,
    setFleetVehicles,
    vehicleGroups,
    addVehicleGroup,
    removeVehicleGroup,
    toggleVehicleInGroup,
    updateVehicleGroupName,
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

  // Seed fleet state from API data on first load
  useEffect(() => {
    if (dataVehicles?.length > 0 && fleetVehicles.length === 0) {
      console.log("[FleetSync] Seeding operational fleet from API data...");
      setFleetVehicles(dataVehicles);
    }
  }, [dataVehicles, fleetVehicles.length, setFleetVehicles]);

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
    vehicleGroups,
  });

  // Stores the routing overrides that were interrupted by the driver-assignment guard.
  // After the driver is assigned, we replay the routing with these overrides.
  const pendingRoutingOverridesRef = useRef<{
    vehicles?: FleetVehicle[];
    jobs?: FleetJob[];
    preference?: "fastest" | "shortest" | "health";
    traffic?: boolean;
  } | null>(null);

  const handleStartRouting = useCallback(
    async (overrides?: {
      vehicles?: FleetVehicle[];
      jobs?: FleetJob[];
      preference?: "fastest" | "shortest" | "health";
      traffic?: boolean;
    }) => {
      const vehiclesToCheck = overrides?.vehicles || fleetVehicles;
      const jobsToCheck = overrides?.jobs || fleetJobs;

      // Check all vehicles that have a job assigned — no vehicle may route without a driver,
      // whether the routing was triggered automatically or via manual assignment.
      const assignedVehicleIds = new Set(
        jobsToCheck
          .filter((j) => j.assignedVehicleId)
          .map((j) => String(j.assignedVehicleId)),
      );

      const vehiclesWithNoDriver = vehiclesToCheck.filter(
        (v) => assignedVehicleIds.has(String(v.id)) && !v.driver,
      );

      console.log("[GISMap] Driver Pre-check:", {
        hasOverrides: !!overrides,
        assignedVehicleIds: Array.from(assignedVehicleIds),
        missingDrivers: vehiclesWithNoDriver.map((v) => v.label),
      });

      if (vehiclesWithNoDriver.length > 0) {
        const firstVehicle = vehiclesWithNoDriver[0];
        console.warn(
          "[GISMap] Routing blocked — driver missing for:",
          firstVehicle.label,
        );

        // Store the current overrides so we can resume routing after driver is assigned
        pendingRoutingOverridesRef.current = overrides ?? null;

        dispatch({
          type: "SET_ASSIGNING_VEHICLE_ID",
          payload: firstVehicle.id,
        });
        dispatch({ type: "SET_IS_ASSIGN_DRIVER_OPEN", payload: true });
        return { success: false, aborted: true, unassignedJobs: [] };
      }

      console.log(
        "[GISMap] Driver check passed — excluding un-driven non-targeted vehicles",
      );

      // Filter out vehicles that don't have drivers AND aren't targeted for manual assignment
      const operationalVehicles = vehiclesToCheck.filter(
        (v) => assignedVehicleIds.has(String(v.id)) || v.driver,
      );

      return startRouting({
        ...(overrides || {}),
        vehicles: operationalVehicles,
      });
    },
    [fleetVehicles, fleetJobs, startRouting, dispatch],
  );

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
    fleetJobs,
    updateJobStatus,
    updateDriverSpeedingEvents,
  });

  // Alert monitoring (includes speeding persistence)
  const { vehicleAlerts } = useAlertMonitoring(
    fleetVehicles,
    routeData,
    isTracking,
  );

  // Background global weather monitoring for the layers overlay
  const [globalWeatherAlerts, setGlobalWeatherAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchGlobalWeather = async () => {
      try {
        const res = await fetch("/api/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleRoutes: [],
            startTime: new Date().toISOString(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const globalRoute = data.routes?.find(
            (r: any) => r.vehicle === "GLOBAL",
          );
          if (globalRoute?.alerts) {
            setGlobalWeatherAlerts(globalRoute.alerts);
          }
        }
      } catch (e) {
        console.error("GISMap: Failed to fetch background weather", e);
      }
    };

    fetchGlobalWeather();
    const interval = setInterval(fetchGlobalWeather, 5 * 60 * 1000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  const hasWindAlert = useMemo(() => {
    // Check if any vehicle has a wind alert from operational metrics or route analysis
    const vehicleAlertsHasWind = Object.values(vehicleAlerts).some((alerts) =>
      alerts.some((a) => a.type === "weather" && a.data?.wa?.event === "WIND"),
    );

    // Also check global weather alerts from background fetch or route data
    const hasGlobalRouteWind = routeData?.weatherRoutes?.some(
      (wr) =>
        wr.vehicle === "GLOBAL" && wr.alerts?.some((wa) => wa.event === "WIND"),
    );

    const allWindAlerts = [
      ...Object.values(vehicleAlerts).flatMap((alerts) =>
        alerts
          .filter((a) => a.type === "weather" && a.data?.wa?.event === "WIND")
          .map((a) => a.data?.wa?.message),
      ),
      ...(routeData?.weatherRoutes?.flatMap((wr) =>
        wr.vehicle === "GLOBAL"
          ? wr.alerts
              ?.filter((wa) => wa.event === "WIND")
              .map((wa) => wa.message)
          : [],
      ) || []),
      ...globalWeatherAlerts
        .filter((wa) => wa.event === "WIND")
        .map((wa) => wa.message),
    ].filter(Boolean);

    const message = allWindAlerts.length > 0 ? allWindAlerts[0] : undefined;

    return {
      hasAlert: allWindAlerts.length > 0,
      message,
    };
  }, [vehicleAlerts, routeData?.weatherRoutes, globalWeatherAlerts]);

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

  const handleModuleChange = useCallback((module: DashboardModule) => {
    setActiveModule(module);
  }, []);

  // Sync with sidebar navigation (legacy support for deep links)
  useEffect(() => {
    if (sidebarNavigateTab) {
      if (sidebarNavigateTab === "drivers") setActiveModule("drivers");
      else setActiveModule("map");
    }
  }, [sidebarNavigateTab]);

  // Return to module logic
  const [returnToModule, setReturnToModule] = useState<DashboardModule | null>(
    null,
  );

  const handleStartPickingWithModuleSwitch = useCallback(
    (pickingHandler: () => void) => {
      if (activeModule !== "map") {
        setReturnToModule(activeModule);
        setActiveModule("map");
      }
      pickingHandler();
    },
    [activeModule],
  );

  // Effect to return to previous module after picking
  useEffect(() => {
    if (
      returnToModule &&
      state.interactionMode === null &&
      (state.pickedJobCoords ||
        state.pickedStopCoords ||
        state.zonePoints.length > 0)
    ) {
      // Small timeout to ensure state is processed
      const timeout = setTimeout(() => {
        setActiveModule(returnToModule);
        setReturnToModule(null);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [
    state.interactionMode,
    state.pickedJobCoords,
    state.pickedStopCoords,
    state.zonePoints.length,
    returnToModule,
  ]);

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

  // Wrapped handlers
  const handleStartPickingJobWrapped = useCallback(() => {
    handleStartPickingWithModuleSwitch(handleStartPickingJob);
  }, [handleStartPickingWithModuleSwitch, handleStartPickingJob]);

  const handleStartPickingWrapped = useCallback(() => {
    handleStartPickingWithModuleSwitch(handleStartPicking);
  }, [handleStartPickingWithModuleSwitch, handleStartPicking]);

  const handleStartPickingStopWrapped = useCallback(() => {
    handleStartPickingWithModuleSwitch(handleStartPickingStop);
  }, [handleStartPickingWithModuleSwitch, handleStartPickingStop]);

  // Wrapper for vehicle select from drivers (needs dispatch)
  const handleVehicleSelectFromDriversWithDispatch = useCallback(
    (vehicleId: string) => {
      handleVehicleSelectFromDrivers(vehicleId);
    },
    [handleVehicleSelectFromDrivers],
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
        setTimeout(() => handleStartRouting(), 500);
      }
      dispatch({ type: "SET_IS_ADD_STOP_OPEN", payload: false });
      dispatch({ type: "SET_PICKED_STOP_COORDS", payload: null });
    },
    [addStopToVehicle, selectedVehicleId, handleStartRouting, dispatch],
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
      <div
        className={cn(
          "h-full w-full relative",
          activeModule !== "map" && "hidden",
        )}
      >
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
          fleetVehicles={fleetVehicles}
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
          // onVehicleSelect={handleVehicleClick}
          hiddenZones={[
            ...state.hiddenZones,
            ...(editingZoneData?.id ? [editingZoneData.id] : []),
          ]}
          onToggleZoneVisibility={(id) =>
            dispatch({ type: "TOGGLE_ZONE_VISIBILITY", payload: id })
          }
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
          fleetJobs={fleetJobs}
          onClose={() => setSelectedVehicleId(null)}
        />

        <MapLayersOverlay
          layers={layers}
          toggleLayer={toggleLayer}
          onAddZone={() => {
            // Start zone picking flow directly
            handleStartZonePicking();
          }}
          customZones={customPOIs.filter((poi) => poi.entityType === "zone")}
          hiddenZones={state.hiddenZones}
          onToggleZoneVisibility={(id) =>
            dispatch({ type: "TOGGLE_ZONE_VISIBILITY", payload: id })
          }
          onDeleteZone={removeCustomPOI}
          hasWindAlert={hasWindAlert}
        />
      </div>

      {/* 4. Drivers Module */}
      {activeModule === "drivers" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <DriversTab
            drivers={drivers || []}
            fleetVehicles={fleetVehicles || []}
            isLoading={isLoadingDrivers || false}
            fetchDrivers={fetchDrivers || (async () => {})}
            addDriver={addDriver || (async () => undefined)}
            onDriverSelect={(d) => {
              const fullDriver = drivers.find((drv) => drv.id === d.id);
              if (fullDriver) {
                dispatch({ type: "SET_SELECTED_DRIVER", payload: fullDriver });
                dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: true });
              }
            }}
            onVehicleSelect={handleVehicleSelectFromDriversWithDispatch}
            expandedGroups={state.driversExpandedGroups}
            onToggleGroup={(group, isExpanded) =>
              dispatch({
                type: "SET_DRIVERS_EXPANDED_GROUPS",
                payload: {
                  ...state.driversExpandedGroups,
                  [group]: isExpanded,
                },
              })
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
            fetchVehicles={fetchApiVehicles || (async () => {})}
            addVehicle={addApiVehicle || (async () => undefined)}
            onVehicleSelect={(v) => {
              setSelectedVehicleId(String(v.id));
            }}
          />
        </div>
      )}

      {/* 5.1 Fuel Module */}
      {activeModule === "fuel" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <FuelManagementTab
            onDriverClick={(driverId) => {
              const fullDriver = drivers.find((drv) => drv.id === driverId);
              if (fullDriver) {
                dispatch({ type: "SET_SELECTED_DRIVER", payload: fullDriver });
                dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: true });
              }
            }}
          />
        </div>
      )}

      {/* 5.2 Weather Module */}
      {activeModule === "weather" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <WeatherTab
            fleetVehicles={fleetVehicles || []}
            fleetJobs={fleetJobs || []}
          />
        </div>
      )}

      {/* 6. Orders Module */}
      {activeModule === "orders" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <OrdersTab
            fleetJobs={fleetJobs || []}
            fleetVehicles={fleetVehicles}
            activeZones={combinedActiveZones}
            isLoading={isLoadingVehicles || false}
            isCalculatingRoute={isCalculatingRoute}
            addJob={() => {
              dispatch({ type: "SET_IS_ADD_JOB_OPEN", payload: true });
            }}
            fetchJobs={async () => {
              await fetchVehicles();
            }}
            removeJob={removeJob || (async () => {})}
            setJobAssignments={setJobAssignments}
            startRouting={handleStartRouting}
            routeData={routeData}
            vehicleGroups={vehicleGroups}
            addVehicleGroup={addVehicleGroup}
            removeVehicleGroup={removeVehicleGroup}
            toggleVehicleInGroup={toggleVehicleInGroup}
            updateVehicleGroupName={updateVehicleGroupName}
            onJobSelect={(job) => {
              // Placeholder for future job selection functionality
            }}
          />
        </div>
      )}

      {/* 6.1 Analytics Module */}
      {activeModule === "analytics" && (
        <div className="h-full flex flex-col bg-background overflow-hidden relative">
          <AnalyticsTab
            routeData={routeData ?? undefined}
            fleetVehicles={fleetVehicles || []}
          />
        </div>
      )}

      {/* Global HUD elements (Dialogs, Popups, etc) */}
      <GISMapDialogs
        isAddJobOpen={state.isAddJobOpen}
        onOpenAddJobChange={handleOpenAddJobChange}
        onAddJobSubmit={(...args) => {
          handleAddJobSubmit(...args);
          handleModuleChange("orders");
        }}
        mapCenter={state.mapCenter}
        onStartPickingJob={handleStartPickingJobWrapped}
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
        isAssignDriverOpen={state.isAssignDriverOpen}
        onOpenAssignDriverChange={(open) => {
          dispatch({ type: "SET_IS_ASSIGN_DRIVER_OPEN", payload: open });
          if (!open) {
            // User closed dialog with X without picking a driver — discard pending routing
            pendingRoutingOverridesRef.current = null;
            dispatch({ type: "SET_ASSIGNING_VEHICLE_ID", payload: null });
          }
        }}
        drivers={drivers}
        onAssignDriver={(driver) => {
          if (state.assigningVehicleId) {
            console.log(
              "[GISMap] Starting driver assignment for vehicle:",
              state.assigningVehicleId,
              "Driver:",
              driver?.name,
            );

            // Start async driver assignment but don't await
            handleAssignDriver(state.assigningVehicleId, driver);

            dispatch({ type: "SET_IS_ASSIGN_DRIVER_OPEN", payload: false });
            dispatch({ type: "SET_ASSIGNING_VEHICLE_ID", payload: null });

            // Resume the routing that was blocked by the driver guard.
            const pendingOverrides = pendingRoutingOverridesRef.current;
            pendingRoutingOverridesRef.current = null;

            // Pass current fleetVehicles but manually ensure the assigned vehicle has the driver
            // This prevents timing issues with state updates
            setTimeout(() => {
              // Find and update the specific vehicle with the driver to ensure it's included
              const updatedVehicles = fleetVehicles.map((v) =>
                String(v.id) === String(state.assigningVehicleId)
                  ? { ...v, driver } // Explicitly include the assigned driver
                  : v,
              );

              console.log("[GISMap] Resuming routing after driver assignment", {
                hasPendingOverrides: !!pendingOverrides,
                vehicleId: state.assigningVehicleId,
                vehicleHasDriver: updatedVehicles.find(
                  (v) => String(v.id) === String(state.assigningVehicleId),
                )?.driver?.name,
              });
              startRouting({
                ...pendingOverrides,
                vehicles: updatedVehicles, // Pass vehicles with driver explicitly set
              });
            }, 250);
          }
        }}
        assigningVehicleLabel={
          state.assigningVehicleId
            ? fleetVehicles.find(
                (v) => String(v.id) === String(state.assigningVehicleId),
              )?.label
            : undefined
        }
      />

      <GISMapPanels
        selectedVehicleId={selectedVehicleId}
        selectedVehicleObject={selectedVehicleObject}
        drivers={drivers}
        onAssignDriver={handleAssignDriver}
        onChangeEnvironmentalTag={handleChangeEnvironmentalTag}
        onUpdateLabel={updateVehicleLabel}
        onUpdateLicensePlate={updateVehicleLicensePlate}
        onViewDriverProfile={handleViewDriverProfile}
        fleetJobs={fleetJobs}
        addStopToVehicle={addStopToVehicle}
        startRouting={handleStartRouting}
        isAddStopOpen={state.isAddStopOpen}
        setIsAddStopOpen={handleOpenAddStopChange}
        onStartPickingStop={handleStartPickingStopWrapped}
        pickedStopCoords={state.pickedStopCoords}
        onAddStopSubmit={handleAddStopSubmit}
      />
      <FuelDetailsSheet
        isOpen={state.isFuelDetailsOpen}
        onOpenChange={(open) =>
          dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: open })
        }
        onClose={() =>
          dispatch({ type: "SET_IS_FUEL_DETAILS_OPEN", payload: false })
        }
        driverId={state.selectedDriver?.id || null}
      />

      {state.selectedDriver && (
        <DriverDetailsSheet
          driver={state.selectedDriver}
          isOpen={state.isDriverDetailsOpen}
          onOpenChange={(open) =>
            dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: open })
          }
          onClose={() =>
            dispatch({ type: "SET_IS_DRIVER_DETAILS_OPEN", payload: false })
          }
        />
      )}
    </Dashboard>
  );
}
