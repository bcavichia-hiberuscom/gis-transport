"use client";
import {
  MAP_CENTER,
  DEFAULT_ZOOM,
  MAP_TILE_URL,
  MAP_ATTRIBUTION,
} from "@/lib/config";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  ZoomControl,
  Popup,
  useMap,
  Rectangle,
} from "react-leaflet";
import type {
  RouteData,
  WeatherData,
  LayerVisibility,
  POI,
  CustomPOI,
  VehicleType,
  Zone,
  FleetVehicle,
  FleetJob,
} from "@gis/shared";
import type { Alert } from "@/lib/utils";
import { createPortal } from "react-dom";
import L from "leaflet";
import { createMapIcons } from "@/lib/map-icons";
import { useLoadingLayers } from "@/hooks/use-loading-layers";
import { usePOICache } from "@/hooks/use-poi-cache";
import { ZoneLayer, WeatherMarkersLayer } from "./map-layers";
import {
  renderPOIs,
  renderJobMarkers,
  renderCustomPOIs,
} from "@/app/helpers/map-render-helpers";
import { canVehicleTypeAccessZone } from "@/lib/helpers/zone-access-helper";
// Modular Imports
import { FitBounds } from "./map/FitBounds";
import { MapCenterHandler } from "./map/MapCenterHandler";
import { MapEventHandler } from "./map/MapEventHandler";
import { RouteLayer } from "./map/RouteLayer";
import { VehiclesLayer } from "./map/VehiclesLayer";
import { ZoneDrawingPreview } from "./map/ZoneDrawingPreview";
import { MapStyleSelector, MAP_STYLES, type MapStyle } from "./map/MapStyleSelector";
import { WindFlowLayer } from "./map/wind-flow-layer";

interface MapContainerProps {
  layers: LayerVisibility;
  routeData: RouteData | null;
  setRouteData: (data: RouteData | null) => void;
  setWeather: (data: WeatherData | null) => void;
  isRouting: boolean;
  routePoints: { start: [number, number] | null; end: [number, number] | null };
  setRoutePoints: (points: {
    start: [number, number] | null;
    end: [number, number] | null;
  }) => void;
  dynamicEVStations: POI[];
  setDynamicEVStations: (stations: POI[]) => void;
  dynamicGasStations: POI[];
  setDynamicGasStations: (stations: POI[]) => void;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  selectedVehicle: VehicleType;
  customPOIs?: CustomPOI[];
  vehicleAlerts?: Record<string | number, Alert[]>;
  onMapClick?: (coords: [number, number]) => void;
  fleetVehicles?: FleetVehicle[];
  fleetJobs?: FleetJob[];
  selectedVehicleId?: string | null;
  pickedJobCoords?: [number, number] | null;
  zonePoints?: [number, number][]; // For zone drawing preview
  zoneIsClosed?: boolean; // Whether zone polygon has been explicitly closed
  interactionMode?: string | null; // To know when in zone picking mode
  isEditingZone?: boolean; // For zone editing mode
  onRemoveZonePoint?: (index: number) => void; // Callback to remove a specific zone point
  onUpdateZonePoint?: (index: number, newCoords: [number, number]) => void; // Callback to update a zone point position
  onZonesUpdate?: (zones: Zone[]) => void;
  onEditZone?: (zoneId: string) => void; 
  onDeleteZone?: (zoneId: string) => void;
  isInteracting?: boolean;
  onVehicleTypeChange?: (vehicleId: string, type: VehicleType) => void;
  onVehicleLabelUpdate?: (vehicleId: string, label: string) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  toggleLayer?: (layer: keyof LayerVisibility) => void;
  hiddenZones?: string[];
  onToggleZoneVisibility?: (zoneId: string) => void;
}

export default function MapContainer({
  layers,
  routeData,
  isRouting,
  routePoints,
  setRoutePoints,
  dynamicEVStations,
  setDynamicEVStations,
  dynamicGasStations,
  setDynamicGasStations,
  mapCenter,
  setMapCenter,
  selectedVehicle,
  customPOIs,
  vehicleAlerts = {},
  fleetVehicles,
  fleetJobs,
  selectedVehicleId,
  onMapClick,
  pickedJobCoords,
  zonePoints = [],
  zoneIsClosed = false,
  interactionMode,
  isEditingZone = false,
  onRemoveZonePoint,
  onUpdateZonePoint,
  onZonesUpdate,
  onEditZone,
  isInteracting = false,
  onVehicleTypeChange,
  onVehicleLabelUpdate,
  onVehicleSelect,
  toggleLayer,
  hiddenZones = [],
  onToggleZoneVisibility,
  onDeleteZone,
}: MapContainerProps) {
  const [mounted, setMounted] = useState(false);
  const [globalWeather, setGlobalWeather] = useState<any[]>([]);
  const [dynamicZones, setDynamicZones] = useState<Zone[]>([]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [activeStyle, setActiveStyle] = useState<MapStyle>(MAP_STYLES[0]);
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null);


  const { loading, wrapAsync } = useLoadingLayers();
  const poiCache = usePOICache();
  const mapIcons = useMemo(() => createMapIcons(), []);
  const { job, customPOI, picking, vehicle, weather, gasStation, evStation } =
    mapIcons;
  const { snow, rain, ice, wind, fog, heat, cold } = weather;

  // Narrowing for linting
  const vehicleRoutes = routeData?.vehicleRoutes;
  const weatherRoutes = routeData?.weatherRoutes;
  const pCoords = pickedJobCoords;

  const canAccessZone = useCallback(
    (zone: Zone): boolean => {
      const vehicleToUse = selectedVehicleId
        ? fleetVehicles?.find((v) => v.id === selectedVehicleId)?.type
        : selectedVehicle;

      if (!vehicleToUse) return false;
      return canVehicleTypeAccessZone(vehicleToUse, zone);
    },
    [selectedVehicle, fleetVehicles, selectedVehicleId],
  );

  const renderedGasStations = useMemo(() => {
    if (!layers.gasStations) return null;

    return renderPOIs({
      stations: dynamicGasStations,
      isEV: false,
      zoom,
      icon: gasStation,
    });
  }, [layers.gasStations, dynamicGasStations, zoom, gasStation]);

  const renderedEVStations = useMemo(() => {
    if (!layers.evStations) return null;
    return renderPOIs({
      stations: dynamicEVStations,
      isEV: true,
      zoom,
      icon: evStation,
    });
  }, [layers.evStations, dynamicEVStations, zoom, evStation]);

  const renderedCustomPOIs = useMemo(() => {
    return renderCustomPOIs({
      customPOIs:
        customPOIs?.filter(
          (poi) => !poi.entityType || poi.entityType === "point",
        ) || [],
      icon: customPOI,
      zoom,
    });
  }, [customPOIs, customPOI, zoom]);

  // Convert custom zones to Zone format for rendering
  const customZonesAsZones = useMemo(() => {
    if (!customPOIs) return [];
    return customPOIs
      .filter((poi) => poi.entityType === "zone" && poi.coordinates)
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        coordinates: zone.coordinates,
        type: zone.zoneType || "LEZ",
        description: zone.description,
        requiredTags: zone.requiredTags,
        isCustom: true,
      }))
      .filter((zone) => !hiddenZones.includes(zone.id));
  }, [customPOIs, hiddenZones]);

  const renderedJobs = useMemo(() => {
    return renderJobMarkers({
      jobs: fleetJobs || [],
      icon: job,
      routeData,
      vehicles: fleetVehicles,
      zoom,
      selectedVehicleId,
    });
  }, [fleetJobs, job, routeData, fleetVehicles, zoom, selectedVehicleId]);

  useEffect(() => {
    if (!mounted) return;

    const fetchGlobalWeather = async () => {
      // If we don't have bounds yet, try to wait or use mapCenter to trigger something
      // but usually Leaflet provides bounds very quickly after mount.
      const currentBounds = viewportBounds;
      
      const body: any = {
        vehicleRoutes: [],
        startTime: new Date().toISOString()
      };

      if (currentBounds) {
        body.bbox = [
          currentBounds.getWest(),
          currentBounds.getSouth(),
          currentBounds.getEast(),
          currentBounds.getNorth()
        ];
      }

      try {
        const res = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          const globalRoute = data.routes?.find((r: any) => r.vehicle === 'GLOBAL');
          if (globalRoute?.alerts) {
            const windNodes = globalRoute.alerts
              .filter((a: any) => a.event === 'WIND')
              .map((a: any) => ({
                lat: a.lat,
                lon: a.lon,
                speed: a.value,
                direction: a.direction || 0
              }));
            if (windNodes.length > 0) {
              setGlobalWeather(windNodes);
            }
          }
        }
      } catch (e) {
        console.error("Global weather fetch failed", e);
      }
    };

    fetchGlobalWeather();
    const interval = setInterval(fetchGlobalWeather, 10 * 60 * 1000); // 10 mins
    return () => clearInterval(interval);
  }, [mounted, viewportBounds]);

  const windData = useMemo(() => {
    const weatherRoutes = routeData?.weatherRoutes || [];
    const routeWindAlerts = weatherRoutes.flatMap(wr => wr.alerts || [])
      .filter(a => a.event === 'WIND' && a.value !== undefined)
      .map(a => ({
        lat: a.lat,
        lon: a.lon,
        speed: (a as any).value!,
        direction: (a as any).direction || 0
      }));
    
    // Combine route alerts with global data, prioritizing route data
    const combined = [...routeWindAlerts];
    
    // Only add global nodes that are not near existing route nodes (simple dedup)
    for (const gw of globalWeather) {
      const exists = combined.some(rc => 
        Math.abs(rc.lat - gw.lat) < 0.1 && Math.abs(rc.lon - gw.lon) < 0.1
      );
      if (!exists) combined.push(gw);
    }

    return combined;
  }, [routeData?.weatherRoutes, globalWeather]);

  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        Loading map...
      </div>
    );

  return (
    <div className="relative h-full w-full">





      <LeafletMap
        center={MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0 outline-none"
        zoomControl={false}
        minZoom={5}
        maxZoom={activeStyle.maxZoom ?? 19}
        preferCanvas={true}
      >
        <TileLayer
          attribution={activeStyle.attribution}
          url={activeStyle.url}
          key={activeStyle.id}
        />

        {/* CONTRAST OVERLAY: A world-spanning black rectangle between tiles and weather */}
        {(layers.weatherWind || layers.weatherRain) && activeStyle.id !== 'dark' && (
          <Rectangle 
            bounds={[[-90, -180], [90, 180]]} 
            pathOptions={{ 
              color: 'transparent', 
              fillColor: '#000000', 
              fillOpacity: 0.65,
              stroke: false 
            }} 
          />
        )}



        {layers.weatherRain && (
          <TileLayer
            key="weather-rain"
            url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${process.env.NEXT_PUBLIC_OWM_API_KEY}`}
            opacity={0.6}
            zIndex={200}
          />
        )}
        {layers.weatherWind && (
          <>
            <TileLayer
              key="weather-wind"
              url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${process.env.NEXT_PUBLIC_OWM_API_KEY}`}
              opacity={0.4}
              zIndex={200}
            />
            <WindFlowLayer 
              visible={true} 
              opacity={0.8}
              data={windData}
            />
          </>
        )}
        {layers.weatherTemp && (
          <TileLayer
            key="weather-temp"
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${process.env.NEXT_PUBLIC_OWM_API_KEY}`}
            opacity={0.4}
            zIndex={200}
          />
        )}

        <MapCenterHandler center={mapCenter} />
        <MapEventHandler
          isRouting={isRouting}
          routePoints={routePoints}
          setRoutePoints={setRoutePoints}
          setDynamicEVStations={setDynamicEVStations}
          setDynamicGasStations={setDynamicGasStations}
          setDynamicZones={setDynamicZones}
          setMapCenter={setMapCenter}
          onMapClick={onMapClick}
          wrapAsync={wrapAsync}
          poiCache={poiCache}
          mapCenter={mapCenter}
          layers={layers}
          onZonesUpdate={onZonesUpdate}
          setZoom={setZoom}
          setViewportBounds={setViewportBounds}
        />

        <ZoneLayer
          zones={dynamicZones}
          visible={!!layers.cityZones}
          isInteracting={isInteracting}
          canAccessZone={canAccessZone}
          onEditZone={onEditZone}
          onDeleteZone={onDeleteZone}
          hiddenZones={hiddenZones}
          onToggleVisibility={onToggleZoneVisibility}
        />

        {/* Custom Zones Layer - renders custom zones with same behavior as LEZ */}
        <ZoneLayer
          zones={customZonesAsZones}
          visible={true}
          isInteracting={isInteracting}
          canAccessZone={canAccessZone}
          onEditZone={onEditZone}
          onDeleteZone={onDeleteZone}
          hiddenZones={hiddenZones}
          onToggleVisibility={onToggleZoneVisibility}
        />

        <ZoneDrawingPreview
          points={zonePoints}
          visible={interactionMode === "pick-zone"}
          isEditing={isEditingZone}
          isClosed={zoneIsClosed}
          onRemovePoint={onRemoveZonePoint}
          onUpdatePoint={onUpdateZonePoint}
        />

        {/* Floating Confirmation Tooltip on Map */}
        {interactionMode === "pick-zone" && zonePoints.length >= 3 && (
          <Popup
            position={zonePoints[zonePoints.length - 1]}
            closeButton={false}
            offset={[0, -10]}
          >
            <div className="p-1 flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground text-center leading-tight">
                ¿Finalizar diseño <br /> de la zona?
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // The Confirm handler is passed from GISMap
                  if ((window as any).confirmZoneDrawing) {
                    (window as any).confirmZoneDrawing();
                  }
                }}
                className="w-full py-1.5 px-3 bg-primary text-black text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Confirmar Zona
              </button>
            </div>
          </Popup>
        )}

        {layers.route && vehicleRoutes && vehicleRoutes.length > 0 && (
          <>
            <RouteLayer
              vehicleRoutes={vehicleRoutes as any}
              selectedVehicleId={selectedVehicleId}
            />
            <FitBounds routes={vehicleRoutes as any} />
          </>
        )}

        {renderedGasStations}
        {renderedEVStations}
        {renderedCustomPOIs}

        <VehiclesLayer
          vehicles={fleetVehicles || []}
          selectedVehicleId={selectedVehicleId}
          createVehicleIcon={vehicle}
          vehicleAlerts={vehicleAlerts}
          onUpdateType={onVehicleTypeChange}
          onUpdateLabel={onVehicleLabelUpdate}
          onSelect={onVehicleSelect}
          zoom={zoom}
        />

        {renderedJobs}

        <WeatherMarkersLayer
          weatherRoutes={(weatherRoutes || []).filter(wr => 
            vehicleRoutes?.some(vr => String(vr.vehicleId) === String(wr.vehicle))
          )}
          icons={{ snow, rain, ice, wind, fog, heat, cold }}
          layers={layers}
        />

        {pCoords && pCoords[0] != null && pCoords[1] != null && (
          <Marker position={[pCoords[0] as number, pCoords[1] as number] as L.LatLngExpression} icon={picking} />
        )}
      </LeafletMap>

      {/* Map style selector — rendered outside LeafletMap to stay above tile layer */}
      <MapStyleSelector
        currentStyleId={activeStyle.id}
        onStyleChange={setActiveStyle}
      />
    </div>
  );
}




