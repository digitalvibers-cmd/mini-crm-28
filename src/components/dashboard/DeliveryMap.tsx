"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Belgrade coordinates approx
const CENTER_LAT = 44.7866;
const CENTER_LNG = 20.4489;

// Mock data points for heatmap simulation (clustered around Belgrade)
const points = Array.from({ length: 50 }).map(() => ({
    lat: CENTER_LAT + (Math.random() - 0.5) * 0.1,
    lng: CENTER_LNG + (Math.random() - 0.5) * 0.15,
    intensity: Math.random()
}));

export default function DeliveryMap() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="bg-slate-100 rounded-xl w-full h-full animate-pulse" />;
    }

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden z-0">
            <MapContainer
                center={[CENTER_LAT, CENTER_LNG]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {points.map((pt, idx) => (
                    <CircleMarker
                        key={idx}
                        center={[pt.lat, pt.lng]}
                        pathOptions={{
                            fillColor: '#9cbe48',
                            color: 'transparent',
                            fillOpacity: 0.3 + (pt.intensity * 0.4),
                        }}
                        radius={8 + (pt.intensity * 10)}
                    >
                        <Popup>
                            Delivery Zone #{idx + 1} <br /> Density: {Math.round(pt.intensity * 100)}%
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
