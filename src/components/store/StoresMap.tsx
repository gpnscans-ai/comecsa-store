"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STORES } from "@/data/stores";

// Ícono de marcador en el morado de marca (Leaflet no trae íconos por defecto
// que funcionen bien con bundlers, así que usamos uno propio en SVG).
const markerIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2D1B69;border:2px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export default function StoresMap() {
  return (
    <MapContainer
      center={[-1.6, -80.2]}
      zoom={7}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ minHeight: 360 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {STORES.map((s) => (
        <Marker key={s.city} position={[s.lat, s.lng]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-brand-600">{s.name}</p>
              <p className="text-ink-700">{s.city}, {s.province}</p>
              <a
                href={s.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline"
              >
                Ver ubicación →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
