import { Marker, Tooltip, Popup } from "react-leaflet";
import type { POI } from "@/lib/types";

interface RenderPOIsProps {
  stations: POI[];
  icon: L.Icon;
  isEV?: boolean;
  isRouting: boolean;
}

export function renderPOIs({
  stations,
  icon,
  isEV = false,
  isRouting,
}: RenderPOIsProps) {
  return stations.map((station) => (
    <Marker
      key={station.id}
      position={station.position as [number, number]}
      icon={icon}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
        <span style={{ fontSize: 12 }}>{station.name}</span>
      </Tooltip>
      {!isRouting && (
        <Popup>
          <div style={{ fontSize: 12 }}>
            <strong>{station.name}</strong>
            <div style={{ marginTop: 6 }}>
              {isEV
                ? station.connectors
                  ? `${station.connectors} connectors`
                  : "EV station"
                : station.address}
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  ));
}
