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
    vehicle?: FleetVehicle | null;
    jobs?: FleetJob[];
    routeData?: RouteData | null;
    vehicleAlerts?: Record<string | number, Alert[]>;
}

// Map style constants
const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const LIGHT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DEFAULT_ZOOM = 14;

const MapPreview = memo(({
    coords,
    vehicle = null,
    jobs = [],
    routeData = null,
    vehicleAlerts = {}
}: MapPreviewProps) => {
    const mapIcons = useMemo(() => createMapIcons(), []);

    // Filter routes for this specific vehicle
    const displayedRoutes = useMemo(() => {
        if (!routeData?.vehicleRoutes || !vehicle) return [];
        return routeData.vehicleRoutes.filter(r => String(r.vehicleId) === String(vehicle.id));
    }, [routeData, vehicle]);

    const renderedJobs = useMemo(() => {
        return renderJobMarkers({
            jobs: jobs, // Already filtered by parent
            icon: mapIcons.job,
            routeData,
            vehicles: vehicle ? [vehicle] : [],
            zoom: DEFAULT_ZOOM,
            selectedVehicleId: vehicle ? String(vehicle.id) : null,
        });
    }, [jobs, mapIcons.job, routeData, vehicle]);

    const center = useMemo(() => {
        if (coords) return coords;
        return vehicle?.position || MAP_CENTER;
    }, [coords, vehicle]);

    const zoom = useMemo(() => {
        if (coords) return 16;
        return DEFAULT_ZOOM;
    }, [coords]);

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
                {(vehicle || coords) && <AutoCenter center={center} zoom={zoom} />}
                <TileLayer attribution={LIGHT_ATTRIBUTION} url={LIGHT_TILE_URL} />

                {coords && <Marker position={coords} />}

                {displayedRoutes.length ? (
                    <RouteLayer
                        vehicleRoutes={displayedRoutes}
                        selectedVehicleId={vehicle ? String(vehicle.id) : null}
                    />
                ) : null}

                <VehiclesLayer
                    vehicles={vehicle ? [vehicle] : []}
                    selectedVehicleId={vehicle ? String(vehicle.id) : null}
                    createVehicleIcon={mapIcons.vehicle}
                    vehicleAlerts={vehicleAlerts}
                    zoom={DEFAULT_ZOOM}
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