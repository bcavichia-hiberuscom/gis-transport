// hooks/use-map-poi-manager.ts
import { useCallback, useRef } from "react";
import L from "leaflet";
import { THEME } from "@/lib/theme";
import { snapToGrid, calculateFetchRadius } from "@/lib/map-utils";
import { POI } from "@/lib/types";
import { usePOICache } from "./use-poi-cache";

interface POIManagerProps {
  map: L.Map;
  poiCache: ReturnType<typeof usePOICache>;
  layers: {
    evStations: boolean;
    gasStations: boolean;
  };
  setDynamicEVStations: (stations: POI[]) => void;
  setDynamicGasStations: (stations: POI[]) => void;
}

export function useMapPOIManager({
  map,
  poiCache,
  layers,
  setDynamicEVStations,
  setDynamicGasStations,
}: POIManagerProps) {
  // Use a constant default vehicle label - POI fetching should be vehicle-independent
  const vehicleLabel = "all";

  // Track last successful fetch position to avoid refetching on small movements
  const lastFetchRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

  const fetchPOIs = useCallback(async (force = false) => {
    const center = map.getCenter();
    const zoom = map.getZoom();

    // LOD logic check — hide markers below threshold but DON'T clear existing data
    if (zoom < THEME.map.poi.lod.poi.hidden) {
      return;
    }

    const { evStations: willFetchEV, gasStations: willFetchGas } = layers;
    if (!willFetchEV && !willFetchGas) return;

    // ── Distance guard: skip fetch if we haven't moved far enough ──
    if (!force && lastFetchRef.current) {
      const lastCenter = L.latLng(lastFetchRef.current.lat, lastFetchRef.current.lng);
      const dist = center.distanceTo(lastCenter);
      const sameZoom = lastFetchRef.current.zoom === zoom;
      // Only refetch if moved > refetchDistanceThreshold OR zoom changed
      if (dist < THEME.map.poi.refetchDistanceThreshold && sameZoom) {
        return;
      }
    }

    const bounds = map.getBounds();
    const diagonalMeters = bounds
      .getNorthEast()
      .distanceTo(bounds.getSouthWest());
    const viewportDistanceKm = diagonalMeters / 1000;

    const fetchRadiusKm = calculateFetchRadius(viewportDistanceKm);
    const radiusMeters = fetchRadiusKm * 1000;

    // Grid snapping to avoid excessive calls
    const snapLat = snapToGrid(center.lat);
    const snapLng = snapToGrid(center.lng);

    // Record this fetch position BEFORE the request
    lastFetchRef.current = { lat: center.lat, lng: center.lng, zoom };

    // Fetch both in parallel to avoid race conditions
    const [evStations, gasStations] = await Promise.all([
      willFetchEV
        ? poiCache.fetchPOI(
            "ev",
            snapLat,
            snapLng,
            Math.ceil(radiusMeters),
            vehicleLabel,
          )
        : Promise.resolve(null),
      willFetchGas
        ? poiCache.fetchPOI(
            "gas",
            snapLat,
            snapLng,
            Math.ceil(Math.min(radiusMeters, THEME.map.poi.maxGasRadius)),
            vehicleLabel,
          )
        : Promise.resolve(null),
    ]);

    // Merge into state — the reducer handles deduplication by ID and
    // ignores empty payloads (only [] from toggleLayer clears).
    if (willFetchEV && evStations && evStations.length > 0) {
      setDynamicEVStations(evStations);
    }
    if (willFetchGas && gasStations && gasStations.length > 0) {
      setDynamicGasStations(gasStations);
    }
  }, [
    map,
    layers.evStations,
    layers.gasStations,
    vehicleLabel,
    setDynamicEVStations,
    setDynamicGasStations,
    poiCache,
  ]);

  return { fetchPOIs };
}
