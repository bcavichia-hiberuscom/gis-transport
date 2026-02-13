// components/map-preview.tsx
"use client";

import { memo, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { MAP_CENTER, MAP_TILE_URL, MAP_ATTRIBUTION } from "@/lib/config";
import type { FleetVehicle, FleetJob, RouteData } from "@gis/shared";
import type { Alert } from "@/lib/utils";
import { createMapIcons } from "@/lib/map-icons";
import {
    renderJobMarkers,
} from "@/app/helpers/map-render-helpers";
import { VehiclesLayer } from "./map/VehiclesLayer";
import { RouteLayer } from "./map/RouteLayer";
import { FitBounds } from "./map/FitBounds";
import { useEffect } from "react";

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        // Delay slightly to ensure container has its final dimensions
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function AutoCenter({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

interface MapPreviewProps {
    coords?: [number, number];
    fleetVehicles?: FleetVehicle[];
    fleetJobs?: FleetJob[];
    routeData?: RouteData | null;
    selectedVehicleId?: string | number | null;
    vehicleAlerts?: Record<string | number, Alert[]>;
}

// Map style constants
const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const LIGHT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const MapPreview = memo(({
    coords,
    fleetVehicles = [],
    fleetJobs = [],
    routeData = null,
    selectedVehicleId = null,
    vehicleAlerts = {}
}: MapPreviewProps) => {
    const mapIcons = useMemo(() => createMapIcons(), []);

    // Only show the selected vehicle in the preview if one is selected
    const displayedVehicles = useMemo(() => {
        if (!selectedVehicleId) return fleetVehicles;
        return fleetVehicles.filter(v => String(v.id) === String(selectedVehicleId));
    }, [fleetVehicles, selectedVehicleId]);

    const selectedVehicle = useMemo(() => {
        return displayedVehicles[0] || null;
    }, [displayedVehicles]);

    // Filter routes to show ONLY for the selected vehicle
    const displayedRoutes = useMemo(() => {
        if (!routeData?.vehicleRoutes) return [];
        if (!selectedVehicleId) return routeData.vehicleRoutes;
        return routeData.vehicleRoutes.filter(r => String(r.vehicleId) === String(selectedVehicleId));
    }, [routeData, selectedVehicleId]);

    const renderedJobs = useMemo(() => {
        // Filter jobs strictly to the selected vehicle's jobs
        const filteredJobs = fleetJobs.filter(j => !selectedVehicleId || String(j.assignedVehicleId) === String(selectedVehicleId));

        return renderJobMarkers({
            jobs: filteredJobs,
            icon: mapIcons.job,
            routeData,
            vehicles: displayedVehicles,
            zoom: 16, // Much closer detail as requested
            selectedVehicleId: selectedVehicleId ? String(selectedVehicleId) : null,
        });
    }, [fleetJobs, mapIcons.job, routeData, displayedVehicles, selectedVehicleId]);

    // Focus center on the selected vehicle if it exists
    const center = useMemo(() => {
        if (coords) return coords;
        if (selectedVehicle) return selectedVehicle.position;
        return MAP_CENTER;
    }, [coords, selectedVehicle]);

    // Closer zoom level (16 is very close, 15 is standard detail)
    const zoom = useMemo(() => {
        if (coords) return 17;
        if (selectedVehicle) return 16;
        return 12;
    }, [coords, selectedVehicle]);

    return (
        <div className="h-full w-full relative rounded-xl overflow-hidden shadow-inner min-h-[150px] bg-slate-50">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                className="h-full w-full grayscale-[0.3]"
            >
                <MapResizer />
                <AutoCenter center={center} zoom={zoom} />
                <TileLayer attribution={LIGHT_ATTRIBUTION} url={LIGHT_TILE_URL} />

                {coords && <Marker position={coords} />}

                {displayedRoutes.length ? (
                    <>
                        <RouteLayer
                            vehicleRoutes={displayedRoutes}
                            selectedVehicleId={selectedVehicleId ? String(selectedVehicleId) : null}
                        />
                        <FitBounds routes={displayedRoutes} />
                    </>
                ) : null}

                <VehiclesLayer
                    vehicles={displayedVehicles}
                    selectedVehicleId={selectedVehicleId ? String(selectedVehicleId) : null}
                    createVehicleIcon={mapIcons.vehicle}
                    vehicleAlerts={vehicleAlerts}
                    zoom={zoom}
                />

                {renderedJobs}
            </MapContainer>

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />

            {/* Overlay to ensure strictly read-only */}
            <div className="absolute inset-0 z-[1001] bg-transparent cursor-default" />
        </div>
    );
});

MapPreview.displayName = "MapPreview";

export default MapPreview;