'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPin {
  supplier_id: number;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  listing_count: number;
  best_status: string;
  pin_color: string;
}

interface SearchMapProps {
  pins: MapPin[];
  userLat?: number;
  userLng?: number;
}

const PIN_COLORS: Record<string, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  gray: '#6b7280',
};

function FitBounds({ pins, userLat, userLng }: { pins: MapPin[]; userLat?: number; userLng?: number }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;

    const points: [number, number][] = pins.map(p => [p.lat, p.lng]);
    if (userLat && userLng) {
      points.push([userLat, userLng]);
    }

    if (points.length === 1) {
      map.setView(points[0], 6);
    } else {
      const lats = points.map(p => p[0]);
      const lngs = points.map(p => p[1]);
      map.fitBounds([
        [Math.min(...lats) - 1, Math.min(...lngs) - 1],
        [Math.max(...lats) + 1, Math.max(...lngs) + 1],
      ]);
    }
  }, [pins, userLat, userLng, map]);

  return null;
}

export default function SearchMap({ pins, userLat, userLng }: SearchMapProps) {
  const center: [number, number] = userLat && userLng
    ? [userLat, userLng]
    : [39.8283, -98.5795]; // Center of US

  return (
    <MapContainer
      center={center}
      zoom={4}
      className="w-full h-full"
      style={{ background: '#1c1917' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FitBounds pins={pins} userLat={userLat} userLng={userLng} />

      {/* User location marker */}
      {userLat && userLng && (
        <CircleMarker
          center={[userLat, userLng]}
          radius={6}
          pathOptions={{
            color: '#a78bfa',
            fillColor: '#a78bfa',
            fillOpacity: 0.4,
            weight: 2,
          }}
        >
          <Popup>
            <span className="text-xs">Your location</span>
          </Popup>
        </CircleMarker>
      )}

      {/* Supplier pins */}
      {pins.map((pin) => (
        <CircleMarker
          key={pin.supplier_id}
          center={[pin.lat, pin.lng]}
          radius={Math.min(12, 6 + pin.listing_count * 1.5)}
          pathOptions={{
            color: PIN_COLORS[pin.pin_color] || PIN_COLORS.gray,
            fillColor: PIN_COLORS[pin.pin_color] || PIN_COLORS.gray,
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs min-w-[140px]">
              <p className="font-semibold text-sm">{pin.name}</p>
              <p className="text-gray-500">{pin.city}, {pin.state}</p>
              <p className="mt-1">{pin.listing_count} matching {pin.listing_count === 1 ? 'listing' : 'listings'}</p>
              <a
                href={`/supplier/${pin.slug}`}
                className="text-emerald-600 hover:underline mt-1 block"
              >
                View nursery &rarr;
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
