"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import type {
  LayerVisibility,
  POI,
  SearchLocation,
  VehicleType,
  RouteData,
  WeatherData,
} from "@/lib/types";
import { VEHICLE_TYPES } from "@/lib/types";

const MapContainer = dynamic(() => import("@/components/map-container"), {
  ssr: false,
});

interface FleetJob {
  id: string;
  coords: [number, number];
  label: string;
}

interface FleetVehicle {
  id: string;
  coords: [number, number];
  type: VehicleType;
}

export function GISMap() {
  const [layers, setLayers] = useState<LayerVisibility>({
    gasStations: true,
    evStations: true,
    lowEmissionZones: true,
    restrictedZones: true,
    route: true,
  });

  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [routePoints, setRoutePoints] = useState<{
    start: [number, number] | null;
    end: [number, number] | null;
  }>({ start: null, end: null });
  const [dynamicEVStations, setDynamicEVStations] = useState<POI[]>([]);
  const [dynamicGasStations, setDynamicGasStations] = useState<POI[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    40.4168, -3.7038,
  ]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(
    VEHICLE_TYPES[0]
  );

  const [fleetMode, setFleetMode] = useState(false);

  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);

  const [fleetJobs, setFleetJobs] = useState<FleetJob[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    "vehicle-1"
  );
  const [addMode, setAddMode] = useState<"vehicle" | "job" | null>(null);

  const toggleLayer = (layer: keyof LayerVisibility) =>
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

  const clearFleet = () => {
    setFleetVehicles([]);
    setFleetJobs([]);
    setSelectedVehicleId(null);
    setAddMode(null);
  };

  const addVehicle = () => {
    setAddMode("vehicle");
  };

  const addJob = () => {
    setAddMode("job");
  };

  const removeVehicle = (vehicleId: string) => {
    setFleetVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    if (selectedVehicleId === vehicleId) {
      const remaining = fleetVehicles.filter((v) => v.id !== vehicleId);
      setSelectedVehicleId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const removeJob = (jobId: string) => {
    setFleetJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleMapClick = useCallback(
    (coords: [number, number]) => {
      if (!fleetMode || !addMode) return;

      if (addMode === "vehicle") {
        const newVehicle: FleetVehicle = {
          id: `vehicle-${Date.now()}`,
          coords,
          type: selectedVehicle,
        };
        setFleetVehicles((prev) => [...prev, newVehicle]);
        setSelectedVehicleId(newVehicle.id);
        setAddMode(null);
      } else if (addMode === "job") {
        const newJob: FleetJob = {
          id: `job-${Date.now()}`,
          coords,
          label: `Job ${fleetJobs.length + 1}`,
        };
        setFleetJobs((prev) => [...prev, newJob]);
        setAddMode(null);
      }
    },
    [fleetMode, addMode, selectedVehicle, fleetJobs.length]
  );

  return (
    <div className="relative flex h-full w-full">
      <Sidebar
        layers={layers}
        toggleLayer={toggleLayer}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        fleetMode={fleetMode}
        setFleetMode={setFleetMode}
        clearFleet={clearFleet}
        fleetVehicles={fleetVehicles}
        fleetJobs={fleetJobs}
        selectedVehicleId={selectedVehicleId}
        setSelectedVehicleId={setSelectedVehicleId}
        addVehicle={addVehicle}
        addJob={addJob}
        removeVehicle={removeVehicle}
        removeJob={removeJob}
        addMode={addMode}
        cancelAddMode={() => setAddMode(null)}
      />
      <div className="relative flex-1">
        <MapContainer
          layers={layers}
          routeData={routeData}
          setRouteData={setRouteData}
          setWeather={setWeather}
          isRouting={false}
          routePoints={routePoints}
          setRoutePoints={setRoutePoints}
          dynamicEVStations={dynamicEVStations}
          setDynamicEVStations={setDynamicEVStations}
          dynamicGasStations={dynamicGasStations}
          setDynamicGasStations={setDynamicGasStations}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          selectedVehicle={selectedVehicle}
          fleetVehicles={fleetVehicles}
          fleetJobs={fleetJobs}
          selectedVehicleId={selectedVehicleId}
          onMapClick={fleetMode ? handleMapClick : undefined}
        />
      </div>
    </div>
  );
}
