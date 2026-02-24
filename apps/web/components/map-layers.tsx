"use client";

import { memo, useMemo } from "react";
import { Polygon, Popup, Marker, Tooltip } from "react-leaflet";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { THEME } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Zone, RouteWeather, LayerVisibility } from "@gis/shared";

interface ZoneLayerProps {
  zones: Zone[];
  visible: boolean;
  isInteracting: boolean;
  canAccessZone: (zone: Zone) => boolean;
  onEditZone?: (zoneId: string) => void;
  onDeleteZone?: (zoneId: string) => void;
  hiddenZones?: string[];
  onToggleVisibility?: (zoneId: string) => void;
}

// Helper functions moved outside component to avoid recreation
function getCoordDepth(coords: any): string {
  if (!Array.isArray(coords) || coords.length === 0) return "empty";
  if (!Array.isArray(coords[0])) return "1D";
  if (!Array.isArray(coords[0][0])) return "2D";
  if (!Array.isArray(coords[0][0][0])) return "3D";
  return "4D";
}

function normalizeCoords(coords: any): any {
  const depth = getCoordDepth(coords);

  if (depth === "2D") {
    return [coords];
  }
  if (depth === "3D") {
    return coords;
  }
  if (depth === "4D") {
    return coords;
  }

  return coords;
}

export const ZoneLayer = memo(
  function ZoneLayer({
    zones,
    visible,
    isInteracting,
    canAccessZone,
    onEditZone,
    onDeleteZone,
    hiddenZones = [],
    onToggleVisibility,
  }: ZoneLayerProps) {
    // Memoize zone processing to avoid recalculation on every render
    const processedZones = useMemo(() => {
      if (!visible) return [];

      return zones
        .map((zone, idx) => {
          const hasAccess = canAccessZone(zone);
          const normalizedType = (zone.type || "").toUpperCase();
          const isLEZ =
            normalizedType === "LEZ" || normalizedType === "ENVIRONMENTAL";
          const zType = isLEZ ? "LEZ" : "RESTRICTED";
          const isCustom = (zone as any).isCustom === true;

          // Normalize and debug coordinates
          const rawCoords = zone.coordinates;
          const depth = getCoordDepth(rawCoords);
          const normalizedCoords = normalizeCoords(rawCoords);

          console.log(
            `[ZoneLayer] Zone "${zone.name}": raw depth=${depth}, normalized length=${normalizedCoords?.length}`,
          );

          if (!normalizedCoords || normalizedCoords.length === 0) {
            console.warn(
              `[ZoneLayer] Skipping zone "${zone.name}" - no valid coordinates`,
            );
            return null;
          }

          // Modern styling for custom zones
          let style;
          if (isCustom) {
            if (isLEZ) {
              // Custom LEZ zones
              const config = THEME.map.polygons.customZone.lez;
              style = {
                color: config.primaryColor,
                fillColor: (config as any).fillColor || "#1C1C1C",
                fillOpacity: config.fillOpacity,
                weight: config.weight,
                dashArray: config.dashArray,
                className: "custom-zone-polygon"
              };
            } else if (hasAccess) {
              // Custom accessible zones
              const config = THEME.map.polygons.customZone.accessible;
              style = {
                color: config.primaryColor,
                fillColor: (config as any).fillColor || "#1C1C1C",
                fillOpacity: config.fillOpacity,
                weight: config.weight,
                dashArray: config.dashArray,
                className: "custom-zone-polygon"
              };
            } else {
              // Custom restricted zones
              const config = THEME.map.polygons.customZone.restricted;
              style = {
                color: config.primaryColor,
                fillColor: (config as any).fillColor || "#1C1C1C",
                fillOpacity: config.fillOpacity,
                weight: config.weight,
                dashArray: config.dashArray,
                className: "custom-zone-polygon"
              };
            }
          } else {
            // API zones keep existing styling
            style = isLEZ
              ? {
                color: hasAccess ? THEME.colors.success : THEME.colors.danger,
                fillColor: hasAccess
                  ? THEME.colors.success
                  : THEME.colors.danger,
                fillOpacity: hasAccess
                  ? 0.2 // Higher opacity for visibility
                  : 0.3,
                weight: 2, // Thicker lines
                dashArray: undefined,
              }
              : {
                color: THEME.colors.danger,
                fillColor: THEME.colors.danger,
                fillOpacity: 0.25,
                weight: 2,
                dashArray: THEME.map.polygons.restricted.dashArray,
              };
          }

          return {
            key: `${zone.id}-${idx}`,
            zone,
            normalizedCoords,
            style,
            hasAccess,
            zType,
            isCustom,
          };
        })
        .filter(Boolean);
    }, [zones, visible, canAccessZone]);

    if (!visible || processedZones.length === 0) return null;

    console.log(
      `[ZoneLayer] Rendering ${processedZones.length} zones, visible=${visible}`,
    );

    return (
      <>
        {processedZones.map((processedZone) => {
          if (!processedZone) return null;

          const {
            key,
            zone,
            normalizedCoords,
            style,
            hasAccess,
            zType,
            isCustom,
          } = processedZone;

          return (
            <Polygon
              key={key}
              positions={normalizedCoords}
              pathOptions={style}
              interactive={!isInteracting}
              bubblingMouseEvents={false}
            >
              {!isInteracting && (
                <Popup
                  closeButton={false}
                  autoClose={false}
                  className="premium-map-popup"
                >
                  <div className="bg-[#1C1C1C] text-white px-3 py-2 min-w-[180px] rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 border-l-2 border-l-[#D4F04A] flex items-center justify-between gap-4">
                    <strong className="text-[11px] font-bold tracking-widest uppercase leading-tight truncate max-w-[150px]">{zone.name}</strong>
                    
                    {(isCustom && (onToggleVisibility || onEditZone || onDeleteZone)) && (
                      <div className="flex items-center gap-0.5">
                        {onToggleVisibility && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleVisibility(zone.id);
                            }}
                            className="p-1.5 hover:bg-[#D4F04A]/10 rounded transition-colors text-[#D4F04A] hover:opacity-80"
                            title="Ocultar zona"
                          >
                            <Eye size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        {onEditZone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditZone(zone.id);
                            }}
                            className="p-1.5 hover:bg-[#D4F04A]/10 rounded transition-colors text-[#D4F04A] hover:opacity-80"
                            title="Editar zona"
                          >
                            <Edit2 size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        {onDeleteZone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Estás seguro de eliminar la zona "${zone.name}"?`)) {
                                onDeleteZone(zone.id);
                              }
                            }}
                            className="p-1.5 hover:bg-[#EF4444]/20 rounded transition-colors text-[#EF4444]"
                            title="Eliminar zona"
                          >
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              )}
            </Polygon>
          );
        })}
      </>
    );
  },
  (prev: ZoneLayerProps, next: ZoneLayerProps) => {
    return (
      prev.zones === next.zones &&
      prev.visible === next.visible &&
      prev.isInteracting === next.isInteracting &&
      prev.canAccessZone === next.canAccessZone &&
      prev.onEditZone === next.onEditZone &&
      prev.onDeleteZone === next.onDeleteZone &&
      prev.hiddenZones === next.hiddenZones &&
      prev.onToggleVisibility === next.onToggleVisibility
    );
  },
);

interface WeatherMarkersLayerProps {
  weatherRoutes: RouteWeather[];
  icons: {
    snow: any;
    rain: any;
    ice: any;
    wind: any;
    fog: any;
    heat: any;
    cold: any;
  };
  layers: LayerVisibility;
}

export const WeatherMarkersLayer = memo(
  function WeatherMarkersLayer({
    weatherRoutes,
    icons,
    layers
  }: WeatherMarkersLayerProps) {
    const weatherMarkers = useMemo(() => {
      if (!weatherRoutes || weatherRoutes.length === 0) return [];

      // Priority for severity: HIGH > MEDIUM > LOW
      const severityMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      
      let overallBest: any = null;

      weatherRoutes.forEach(wr => {
        if (!wr.alerts) return;
        wr.alerts.forEach(alert => {
            // Filter by active layers
            const isRainType = ["RAIN", "SNOW", "ICE", "FOG"].includes(alert.event);
            const isWindType = alert.event === "WIND";
            const isTempType = ["HEAT", "COLD"].includes(alert.event);

            if (isRainType && !layers.weatherRain) return;
            if (isWindType && !layers.weatherWind) return;
            if (isTempType && !layers.weatherTemp) return;

            if (!overallBest || (severityMap[alert.severity] || 0) > (severityMap[overallBest.severity] || 0)) {
                overallBest = { ...alert, vehicle: wr.vehicle };
            }
        });
      });

      if (!overallBest || overallBest.lat == null || overallBest.lon == null) return [];

      let icon;
      switch (overallBest.event) {
        case "SNOW": icon = icons.snow; break;
        case "RAIN": icon = icons.rain; break;
        case "ICE": icon = icons.ice; break;
        case "WIND": icon = icons.wind; break;
        case "FOG": icon = icons.fog; break;
        case "HEAT": icon = icons.heat; break;
        case "COLD": icon = icons.cold; break;
        default: return [];
      }

      return [{
        key: 'weather-primary-alert',
        position: [overallBest.lat + 0.0003, overallBest.lon + 0.0003] as [number, number],
        icon,
        value: overallBest.value,
        direction: overallBest.direction,
        event: overallBest.event,
        severity: overallBest.severity
      }];
    }, [weatherRoutes, icons, layers]);

    return (
      <>
        {weatherMarkers.map((marker) => (
          <Marker
            key={marker.key}
            position={marker.position}
            icon={marker.icon}
          >
            <Tooltip 
              direction="right" 
              offset={[10, 0]} 
              opacity={1} 
              className="!p-0 !bg-transparent !border-none !shadow-none"
            >
              <div className="flex items-center gap-2 px-2 py-1 bg-white border border-[#EAEAEA] rounded shadow-sm">
                <div className="flex flex-col items-center leading-none border-r border-[#EAEAEA] pr-2">
                   <span className="text-[11px] font-bold text-[#1C1C1C]">
                     {marker.value != null ? Math.round(marker.value) : ''}
                   </span>
                   <span className="text-[7px] text-[#6B7280] uppercase tracking-tighter">
                     {marker.event === 'WIND' ? 'm/s' : 'º'}
                   </span>
                </div>
                
                {marker.direction !== undefined && marker.event === 'WIND' && (
                  <div 
                    className="text-[10px] text-[#1C1C1C]"
                    style={{ transform: `rotate(${marker.direction}deg)` }}
                  >
                    ↓
                  </div>
                )}

                <div className={cn(
                  "text-[8px] font-bold px-1 rounded uppercase",
                  marker.severity === 'HIGH' ? "text-red-600 bg-red-50" : 
                  marker.severity === 'MEDIUM' ? "text-amber-600 bg-amber-50" : 
                  "text-blue-600 bg-blue-50"
                )}>
                  {marker.event}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </>
    );
  },
  (prev: WeatherMarkersLayerProps, next: WeatherMarkersLayerProps) => {
    return (
      prev.weatherRoutes === next.weatherRoutes && prev.icons === next.icons
    );
  },
);
