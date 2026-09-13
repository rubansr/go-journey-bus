import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, Tooltip, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";

import type { LatLng } from "@/lib/gps";

export type LiveMapProps = {
  bus: LatLng | null;
  from: LatLng | null;
  to: LatLng | null;
  trail: LatLng[];
  fromLabel: string;
  toLabel: string;
  follow?: boolean;
};

function Recenter({ point, follow }: { point: LatLng | null; follow?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (point && follow) map.panTo([point.lat, point.lng], { animate: true });
  }, [point?.lat, point?.lng, follow, map, point]);
  return null;
}

export default function LiveMap({ bus, from, to, trail, fromLabel, toLabel, follow = true }: LiveMapProps) {
  const center = bus ?? from ?? to ?? { lat: 10.79, lng: 78.7 };
  const path: [number, number][] = [];
  if (from) path.push([from.lat, from.lng]);
  if (to) path.push([to.lat, to.lng]);

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-border sm:h-80">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={bus ? 9 : 7}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {path.length === 2 && <Polyline positions={path} pathOptions={{ color: "#6366f1", weight: 3, dashArray: "8 8" }} />}

        {trail.length > 1 && (
          <Polyline positions={trail.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#2563eb", weight: 4 }} />
        )}

        {from && (
          <CircleMarker center={[from.lat, from.lng]} radius={7} pathOptions={{ color: "#16a34a", fillOpacity: 1 }}>
            <Tooltip>{fromLabel}</Tooltip>
          </CircleMarker>
        )}
        {to && (
          <CircleMarker center={[to.lat, to.lng]} radius={7} pathOptions={{ color: "#dc2626", fillOpacity: 1 }}>
            <Tooltip>{toLabel}</Tooltip>
          </CircleMarker>
        )}
        {bus && (
          <CircleMarker center={[bus.lat, bus.lng]} radius={10} pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 1 }}>
            <Tooltip permanent direction="top">
              Bus
            </Tooltip>
          </CircleMarker>
        )}

        <Recenter point={bus} follow={follow} />
      </MapContainer>
    </div>
  );
}
