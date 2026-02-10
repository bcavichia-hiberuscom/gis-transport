// components/map/MapEventHandler.tsx
"use client";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { THEME } from "@/lib/theme";
import { useZoneCache } from "@/hooks/use-zone-cache";
import { useMapPOIManager } from "@/hooks/use-map-poi-manager";
import {
  LayerVisibility,
  VehicleType,
  POI,
  Zone,
  RouteData,
  WeatherData,
} from "@/lib/types";
import { usePOICache } from "@/hooks/use-poi-cache";

interface MapEventHandlerProps {
  isRouting: boolean;
  routePoints: { start: [number, number] | null; end: [number, number] | null };
  setRoutePoints: (points: {
    start: [number, number] | null;
    end: [number, number] | null;
  }) => void;
  setDynamicEVStations: (stations: POI[]) => void;
  setDynamicGasStations: (stations: POI[]) => void;
  setDynamicZones: (zones: Zone[]) => void;
  setMapCenter: (center: [number, number]) => void;
  layers: LayerVisibility;
  onMapClick?: (coords: [number, number]) => void;
  wrapAsync: (fn: () => Promise<void>) => Promise<void>;
  poiCache: ReturnType<typeof usePOICache>;
  mapCenter: [number, number];
  onZonesUpdate?: (zones: Zone[]) => void;
  setZoom: (zoom: number) => void;
  setViewportBounds: (bounds: L.LatLngBounds) => void;
}

export function MapEventHandler({
  isRouting,
  routePoints,
  setRoutePoints,
  setDynamicEVStations,
  setDynamicGasStations,
  setDynamicZones,
  setMapCenter,
  layers,
  onMapClick,
  wrapAsync,
  poiCache,
  mapCenter,
  onZonesUpdate,
  setZoom,
  setViewportBounds,
}: MapEventHandlerProps) {
  const map = useMap();
  const zoneCache = useZoneCache(map, layers, wrapAsync);
  const { fetchPOIs } = useMapPOIManager({
    map,
    poiCache,
    layers,
    setDynamicEVStations,
    setDynamicGasStations,
  });

  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomRenderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingZoomRef = useRef<number | null>(null);
  const lastLayersStateRef = useRef({
    ev: layers.evStations,
    gas: layers.gasStations,
  });
  const lastZoomLevelRef = useRef<number | null>(null);
  const lastMoveCenter = useRef<L.LatLng | null>(null);

  // Check if any POI layer is enabled
  const hasAnyLayerEnabled = useMemo(
    () => layers.evStations || layers.gasStations,
    [layers.evStations, layers.gasStations],
  );

  useEffect(() => {
    setDynamicZones(zoneCache.zones);
    onZonesUpdate?.(zoneCache.zones);
  }, [zoneCache.zones, setDynamicZones, onZonesUpdate]);

  useMapEvents({
    click: (e) => {
      const point: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (onMapClick) {
        onMapClick(point);
        return;
      }
      if (!isRouting) return;
      if (!routePoints.start) setRoutePoints({ start: point, end: null });
      else if (!routePoints.end) setRoutePoints({ ...routePoints, end: point });
    },
    moveend: () => {
      const newCenter = map.getCenter();
      const dist = newCenter.distanceTo({
        lat: mapCenter[0],
        lng: mapCenter[1],
      });

      if (dist > THEME.map.interaction.moveThreshold) {
        setMapCenter([newCenter.lat, newCenter.lng]);
        setViewportBounds(map.getBounds());
      }

      // Skip fetch entirely if movement is too small
      if (lastMoveCenter.current) {
        const moveDist = newCenter.distanceTo(lastMoveCenter.current);
        if (moveDist < THEME.map.poi.refetchDistanceThreshold) {
          return; // Don't even start debounce for tiny movements
        }
      }
      lastMoveCenter.current = newCenter;

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        zoneCache.fetchZones();
        // Only fetch POIs when zoomed in enough to show individual markers
        const currentZoom = map.getZoom();
        if (hasAnyLayerEnabled && currentZoom >= THEME.map.poi.lod.poi.minimal) {
          fetchPOIs();
        }
      }, THEME.map.interaction.fetchDebounce);
    },
    zoomend: () => {
      const newZoom = Math.round(map.getZoom());

      // Debounce the React state update (250ms) — collapses rapid scroll-wheel
      // zoom into a single re-render, eliminating marker flicker.
      pendingZoomRef.current = newZoom;
      if (zoomRenderTimerRef.current) clearTimeout(zoomRenderTimerRef.current);
      zoomRenderTimerRef.current = setTimeout(() => {
        if (pendingZoomRef.current !== null) {
          setZoom(pendingZoomRef.current);
        }
      }, 250);

      setViewportBounds(map.getBounds());

      // Check if zoom crossed the threshold for showing POI icons
      const wasAboveThreshold =
        lastZoomLevelRef.current !== null &&
        lastZoomLevelRef.current >= THEME.map.poi.lod.poi.minimal;
      const isNowAboveThreshold = newZoom >= THEME.map.poi.lod.poi.minimal;
      const thresholdCrossed = wasAboveThreshold !== isNowAboveThreshold;

      lastZoomLevelRef.current = newZoom;

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

      // If crossing INTO the detailed zone, fetch immediately so markers appear
      if (thresholdCrossed && hasAnyLayerEnabled && isNowAboveThreshold) {
        fetchPOIs(true); // force=true — threshold crossing must always fetch
        lastMoveCenter.current = map.getCenter();
      } else if (isNowAboveThreshold) {
        // Already above threshold — debounced fetch
        fetchTimeoutRef.current = setTimeout(() => {
          zoneCache.fetchZones();
          if (hasAnyLayerEnabled) {
            fetchPOIs();
          }
        }, THEME.map.interaction.zoomDebounce);
      } else {
        // Below threshold — only fetch zones, skip POIs (clusters work from existing data)
        fetchTimeoutRef.current = setTimeout(() => {
          zoneCache.fetchZones();
        }, THEME.map.interaction.zoomDebounce);
      }
    },
  });

  useEffect(() => {
    zoneCache.fetchZones();
    setViewportBounds(map.getBounds());
    // Only fetch POIs on init if a layer is enabled
    if (hasAnyLayerEnabled) {
      fetchPOIs(true); // force=true — initial load
    }
  }, []);

  // Trigger fetch when layers toggle
  useEffect(() => {
    const hasChanged =
      lastLayersStateRef.current.ev !== layers.evStations ||
      lastLayersStateRef.current.gas !== layers.gasStations;

    if (hasChanged) {
      lastLayersStateRef.current = {
        ev: layers.evStations,
        gas: layers.gasStations,
      };
      // Only fetch if turning ON (not turning OFF)
      if (layers.evStations || layers.gasStations) {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        // Execute immediately, don't wait for timeout
        console.log(
          "[MapEventHandler] Fetching POIs, gas layer:",
          layers.gasStations,
        );
        fetchPOIs(true); // force=true — layer toggle must always fetch
      } else {
        // If all layers are OFF, don't update state to avoid unnecessary re-renders
        // The renderedGasStations and renderedEVStations memos will return null
        // based on the layers visibility check, so we don't need to clear the arrays
      }
    }
  }, [layers.evStations, layers.gasStations, fetchPOIs]);

  return null;
}
