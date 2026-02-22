import { THEME } from "@/lib/theme";
import { POI_CONFIG } from "@/lib/config";
import { Marker, Tooltip, Popup, CircleMarker } from "react-leaflet";
import { Icon, DivIcon, divIcon } from "leaflet";
import { VEHICLE_TYPES } from "@/lib/types";
import {
  POI,
  FleetVehicle,
  FleetJob,
  CustomPOI,
  VehicleType,
} from "@gis/shared";
import { createMapIcon } from "@/lib/map-icons";
import { Package, Truck, Fuel, Zap, Octagon } from "lucide-react";
import { getLOD, MapLOD } from "@/lib/map-utils";
import { clusterItems, type ClusterableItem, type Cluster } from "@/lib/spatial-cluster";

import { AlertBadge } from "@/components/alert-badge";
import { Alert } from "@/lib/utils";
import { renderToStaticMarkup } from "react-dom/server";

// ── Cluster icon factory (cached by color + count + offset) ──

const clusterIconCache = new Map<string, DivIcon>();

/**
 * Per-type pixel offsets so clusters from different layers don't stack
 * on top of each other when their centroids coincide.
 * Values are [dx, dy] in CSS pixels.
 */
const CLUSTER_TYPE_OFFSET: Record<string, [number, number]> = {
  gas:     [0, 0],
  ev:      [14, 0],
  vehicle: [0, -14],
  job:     [-14, 0],
  cpoi:    [0, 14],
};

function createClusterIcon(
  count: number,
  color: string,
  typeKey: string = "",
): DivIcon {
  const digits = count.toString().length;
  const [dx, dy] = CLUSTER_TYPE_OFFSET[typeKey] ?? [0, 0];
  const cacheKey = `${color}-${count}-${dx}-${dy}`;
  const cached = clusterIconCache.get(cacheKey);
  if (cached) return cached;

  // Size scales slightly with digit count
  const size = 28 + (digits - 1) * 6;
  const half = size / 2;
  const transform = dx || dy ? `transform:translate(${dx}px,${dy}px);` : "";

  const icon = divIcon({
    html: `<div style="
      ${transform}
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:800;font-size:${11 + (digits > 2 ? -1 : 0)}px;
      font-family:ui-monospace,monospace;
      line-height:1;
      user-select:none;
    ">${count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
  });

  clusterIconCache.set(cacheKey, icon);
  return icon;
}

/** Render cluster markers for a group of clusters. */
function renderClusterMarkers<T extends ClusterableItem>(
  clusters: Cluster<T>[],
  color: string,
  keyPrefix: string,
): React.ReactNode[] {
  return clusters.map((cluster) => (
    <Marker
      key={`${keyPrefix}-cluster-${cluster.key}`}
      position={cluster.center}
      icon={createClusterIcon(cluster.count, color, keyPrefix)}
      interactive={false}
    />
  ));
}

interface RenderPOIsProps {
  stations: POI[];
  isEV?: boolean;
  zoom: number;
  icon: Icon | DivIcon;
}

interface RenderVehiclesProps {
  vehicles: FleetVehicle[];
  selectedVehicleId?: string | null;
  createVehicleIcon: (color: string) => DivIcon;
  onUpdateType?: (vehicleId: string, type: VehicleType) => void;
  onUpdateLabel?: (vehicleId: string, label: string) => void;
  onSelect?: (vehicleId: string) => void;
  zoom: number;
  vehicleAlerts?: Record<string | number, any[]>;
}

interface RenderJobsProps {
  jobs: FleetJob[];
  icon: Icon | DivIcon;
  routeData?: any;
  vehicles?: FleetVehicle[];
  zoom: number;
  selectedVehicleId?: string | null;
}

interface RenderCustomPOIsProps {
  customPOIs: CustomPOI[];
  icon: Icon | DivIcon;
  zoom: number;
}

export function renderPOIs({
  stations,
  isEV = false,
  zoom,
  icon,
}: RenderPOIsProps) {
  const lod = getLOD(zoom, THEME.map.poi.lod.poi);
  if (lod === "HIDDEN") return null;

  const type = isEV ? "ev" : "gas";
  const color = isEV ? "#76e19dff" : "#f97316";

  // ── CLUSTERED: group nearby stations of the same type ──
  if (lod === "CLUSTERED") {
    const clusterInput = (stations || [])
      .filter((s) => s.position)
      .map((s) => ({ ...s, id: s.id, position: s.position as [number, number] }));
    const { singles, clusters } = clusterItems(clusterInput, zoom);
    return [
      ...renderClusterMarkers(clusters, color, type),
      ...singles.map((s) => (
        <CircleMarker
          key={`${type}-csingle-${s.id}`}
          center={s.position}
          radius={4}
          pathOptions={{ fillColor: color, fillOpacity: 0.8, color: "white", weight: 1 }}
          interactive={false}
        />
      )),
    ];
  }

  return (stations || []).map((station) => {
    const pos = station.position as [number, number];

    if (lod === "MINIMAL") {
      return (
        <CircleMarker
          key={`dot-${station.id}`}
          center={pos}
          radius={4}
          pathOptions={{
            fillColor: color,
            fillOpacity: 0.8,
            color: "white",
            weight: 1,
          }}
          interactive={true}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={0.8}>
            <span style={{ fontSize: 10 }}>{station.name}</span>
          </Tooltip>
        </CircleMarker>
      );
    }

    // NORMAL or DETAILED: Use Marker with the passed icon and premium popup
    return (
      <Marker key={`${type}-${station.id}`} position={pos} icon={icon}>
        <Tooltip direction="top" offset={[0, -20]} opacity={0.8}>
          <span className="font-semibold text-[10px]">{station.name}</span>
        </Tooltip>
        <Popup className="premium-popup">
          <div className="p-3 min-w-[200px] bg-white rounded-lg">
            <header className="mb-2 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">
                {station.name}
              </h3>
              {station.address && (
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">
                  {station.address} {station.town ? `· ${station.town}` : ""}
                </p>
              )}
            </header>

            {type === "gas" && station.prices && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <span>Combustibles</span>
                  <Fuel className="w-3 h-3" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {station.prices.gasoline95 && (
                    <div className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold">
                        G95 E5
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {station.prices.gasoline95.toFixed(3)}
                        <span className="text-[10px] ml-0.5">€</span>
                      </span>
                    </div>
                  )}
                  {station.prices.diesel && (
                    <div className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold">
                        DIESEL A
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {station.prices.diesel.toFixed(3)}
                        <span className="text-[10px] ml-0.5">€</span>
                      </span>
                    </div>
                  )}
                  {station.prices.gasoline98 && (
                    <div className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold">
                        G98 E5
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {station.prices.gasoline98.toFixed(3)}
                        <span className="text-[10px] ml-0.5">€</span>
                      </span>
                    </div>
                  )}
                  {station.prices.dieselPremium && (
                    <div className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold">
                        DIESEL+
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {station.prices.dieselPremium.toFixed(3)}
                        <span className="text-[10px] ml-0.5">€</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-1 text-center">
                  <span className="text-[9px] text-slate-300 font-medium italic">
                    Actualizado: {station.prices.updatedAt}
                  </span>
                </div>
              </div>
            )}

            {type === "ev" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-green-500 tracking-wider">
                  <span>Punto de Carga</span>
                  <Zap className="w-3 h-3" />
                </div>
                <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-green-700">
                      Conectores:
                    </span>
                    <span className="text-xs font-black text-green-800">
                      {station.connectors || 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  });
}

export function renderVehicleMarkers({
  vehicles,
  selectedVehicleId,
  createVehicleIcon,
  onSelect,
  zoom,
  vehicleAlerts = {},
}: RenderVehiclesProps) {
  const lod = getLOD(zoom, THEME.map.poi.lod.vehicle);
  if (lod === "HIDDEN") return null;

  // ── CLUSTERED: group nearby vehicles ──
  if (lod === "CLUSTERED") {
    const allWithPos = (vehicles || [])
      .filter((v) => v.position)
      .map((v) => ({ ...v, id: String(v.id), position: v.position as [number, number] }));

    // Extract the selected vehicle before clustering so it always renders individually
    const selId = selectedVehicleId ? String(selectedVehicleId) : null;
    const selectedSingles = selId
      ? allWithPos.filter((v) => v.id === selId)
      : [];
    const toCluster = selId
      ? allWithPos.filter((v) => v.id !== selId)
      : allWithPos;

    const { singles, clusters } = clusterItems(toCluster, zoom);

    const vehicleColor = THEME.colors.muted;
    const clusterMarkers = renderClusterMarkers(clusters, vehicleColor, "vehicle");
    const singleMarkers = singles.map((v) => (
      <CircleMarker
        key={`vehicle-csingle-${v.id}`}
        center={v.position}
        radius={5}
        pathOptions={{ fillColor: vehicleColor, fillOpacity: 1, color: "white", weight: 1.5 }}
        eventHandlers={{ click: () => onSelect?.(String(v.id)) }}
      />
    ));
    const selectedMarkers = selectedSingles.map((v) => {
      const selIcon = createVehicleIcon(THEME.colors.vehicleSelected);
      return (
        <Marker
          key={`vehicle-sel-${v.id}`}
          position={v.position}
          icon={selIcon}
          eventHandlers={{ click: () => onSelect?.(String(v.id)) }}
        />
      );
    });

    return [...clusterMarkers, ...singleMarkers, ...selectedMarkers];
  }

  return (vehicles || []).map((vehicle) => {
    const isSelected = String(selectedVehicleId) === String(vehicle.id);
    const isDimmed = !!selectedVehicleId && !isSelected;
    const pos = vehicle.position;
    const color = isSelected
      ? THEME.colors.vehicleSelected
      : THEME.colors.muted;
    const alerts = vehicleAlerts[vehicle.id] || [];

    if (lod === "MINIMAL" && !isSelected) {
      return (
        <CircleMarker
          key={`vehicle-dot-${vehicle.id}`}
          center={pos}
          radius={5}
          pathOptions={{
            fillColor: color,
            fillOpacity: isDimmed ? THEME.map.hierarchy.dimmedOpacity : 1,
            color: "white",
            weight: 1.5,
          }}
          eventHandlers={{
            click: () => onSelect?.(String(vehicle.id)),
          }}
        />
      );
    }

    const icon = createVehicleIcon(color);
    const opacity = isDimmed ? THEME.map.hierarchy.dimmedOpacity : 1;

    return (
      <Marker
        key={`vehicle-${vehicle.id}`}
        position={pos}
        icon={icon}
        opacity={opacity}
        eventHandlers={{
          click: () => onSelect?.(String(vehicle.id)),
        }}
      />
    );
  });
}

export function renderJobMarkers({
  jobs,
  icon,
  routeData,
  vehicles = [],
  zoom,
  selectedVehicleId,
}: RenderJobsProps) {
  const lod = getLOD(zoom, THEME.map.poi.lod.job);
  if (lod === "HIDDEN") return null;

  // ── CLUSTERED: group nearby jobs ──
  if (lod === "CLUSTERED") {
    const clusterInput = (jobs || [])
      .filter((j) => j.position)
      .map((j) => ({ ...j, id: String(j.id), position: j.position as [number, number] }));
    const { singles, clusters } = clusterItems(clusterInput, zoom);
    const jobColor = THEME.colors.accent;
    return [
      ...renderClusterMarkers(clusters, jobColor, "job"),
      ...singles.map((j) => (
        <CircleMarker
          key={`job-csingle-${j.id}`}
          center={j.position}
          radius={4}
          pathOptions={{ fillColor: jobColor, fillOpacity: 0.8, color: "white", weight: 1 }}
          interactive={false}
        />
      )),
    ];
  }

  // Build a map of job ID -> vehicle info for quick lookup
  const jobToVehicleMap: Record<
    string | number,
    { vehicleId: string | number; color: string; label: string }
  > = {};

  if (routeData?.vehicleRoutes) {
    routeData.vehicleRoutes.forEach((route: any) => {
      const vehicle = vehicles.find(
        (v) => String(v.id) === String(route.vehicleId),
      );
      const vehicleLabel =
        vehicle?.label || vehicle?.type.label || `Vehicle ${route.vehicleId}`;

      // Use assignedJobIds if available
      if (route.assignedJobIds && Array.isArray(route.assignedJobIds)) {
        route.assignedJobIds.forEach((jobId: any) => {
          jobToVehicleMap[jobId] = {
            vehicleId: route.vehicleId,
            color: route.color,
            label: vehicleLabel,
          };
        });
      }
    });
  }

  return (jobs || []).map((job) => {
    const pos = job.position;
    const assignedTo = jobToVehicleMap[job.id];
    const routeColor = assignedTo?.color || THEME.colors.accent;

    const isJobOfSelected =
      !!selectedVehicleId && assignedTo?.vehicleId === selectedVehicleId;
    const isJobDimmed = !!selectedVehicleId && !isJobOfSelected;
    const jobOpacity = isJobDimmed ? THEME.map.hierarchy.dimmedOpacity : 1;

    if (lod === "MINIMAL") {
      return (
        <CircleMarker
          key={`job-dot-${job.id}`}
          center={pos}
          radius={4}
          pathOptions={{
            fillColor: routeColor,
            fillOpacity: isJobDimmed ? THEME.map.hierarchy.dimmedOpacity : 0.8,
            color: "white",
            weight: 1,
          }}
        />
      );
    }

    // Use dynamic icon color based on assigned vehicle
    // If it has an assigned vehicle (either by routing or manual assignment), it's a "stop" logic
    // But specifically, if manual assignment exists (job.assignedVehicleId), we want the Stop icon (Octagon)
    const isCustomStop = !!job.assignedVehicleId;
    const IconComponent = isCustomStop ? Octagon : Package;
    const iconSize = isCustomStop ? 22 : 26; // Slightly smaller for Octagon as it's blocky

    const iconToUse = assignedTo
      ? createMapIcon(IconComponent, routeColor, iconSize, 15, { opacity: 1 })
      : icon;

    return (
      <Marker
        key={`job-${job.id}`}
        position={pos}
        icon={iconToUse}
        opacity={jobOpacity}
      >
        <Popup closeButton={false} offset={[0, -25]}>
          <div style={{ fontSize: THEME.map.popups.fontSize }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  backgroundColor: routeColor,
                  boxShadow: `0 0 4px ${routeColor}80`,
                }}
              />
              <strong style={{ color: routeColor }}>{job.label}</strong>
            </div>
            {assignedTo ? (
              <div
                style={{
                  marginTop: THEME.map.popups.marginTop,
                  fontSize: THEME.map.popups.subtitleFontSize,
                  color: THEME.colors.secondary,
                  padding: "6px 8px",
                  backgroundColor: routeColor + "15",
                  borderLeft: `3px solid ${routeColor}`,
                  borderRadius: "2px",
                }}
              >
                <strong style={{ color: routeColor }}>
                  → {assignedTo.label}
                </strong>
                <div
                  style={{ fontSize: "10px", marginTop: "2px", opacity: 0.7 }}
                >
                  Vehicle ID: {assignedTo.vehicleId}
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: THEME.map.popups.marginTop,
                  fontSize: THEME.map.popups.subtitleFontSize,
                  color: "#f59e0b",
                  padding: "6px 8px",
                  backgroundColor: "#fef3c715",
                  borderLeft: "3px solid #f59e0b",
                  borderRadius: "2px",
                }}
              >
                Trabajo no asignado.
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  });
}

export function renderCustomPOIs({
  customPOIs,
  icon,
  zoom,
}: RenderCustomPOIsProps) {
  const lod = getLOD(zoom, THEME.map.poi.lod.poi); // Use same LOD as POIs for custom ones
  if (lod === "HIDDEN") return null;

  // ── CLUSTERED: group nearby custom POIs ──
  if (lod === "CLUSTERED") {
    const poiColor = THEME.colors.customPOI;
    const clusterInput = (customPOIs || [])
      .filter((p) => p.position && p.position.length === 2)
      .map((p) => ({ ...p, id: p.id, position: p.position as [number, number] }));
    const { singles, clusters } = clusterItems(clusterInput, zoom);
    return [
      ...renderClusterMarkers(clusters, poiColor, "cpoi"),
      ...singles.map((p) => (
        <CircleMarker
          key={`cpoi-csingle-${p.id}`}
          center={p.position}
          radius={4}
          pathOptions={{ fillColor: poiColor, fillOpacity: 0.8, color: "white", weight: 1 }}
          interactive={false}
        />
      )),
    ];
  }

  return (customPOIs || [])
    .filter(poi => poi.position && poi.position.length === 2)
    .map((poi) => {
    const pos = poi.position as [number, number];

    if (lod === "MINIMAL") {
      return (
        <CircleMarker
          key={`custom-dot-${poi.id}`}
          center={pos}
          radius={4}
          pathOptions={{
            fillColor: THEME.colors.customPOI,
            fillOpacity: 0.8,
            color: "white",
            weight: 1,
          }}
        />
      );
    }

    return (
      <Marker key={`custom-${poi.id}`} position={pos} icon={icon}>
        <Tooltip
          direction="top"
          offset={THEME.map.popups.customPoiTooltipOffset}
          opacity={THEME.map.popups.tooltipOpacity}
        >
          <span style={{ fontSize: THEME.map.popups.fontSize }}>
            {poi.name}
          </span>
        </Tooltip>
        <Popup offset={[0, -25]}>
          <div style={{ fontSize: THEME.map.popups.fontSize }}>
            <strong>{poi.name}</strong>
            {poi.description && (
              <div
                style={{
                  marginTop: THEME.map.popups.marginTop,
                  fontSize: THEME.map.popups.subtitleFontSize,
                  fontStyle: "italic",
                  color: THEME.colors.textMuted,
                }}
              >
                {poi.description}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  });
}
