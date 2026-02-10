"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Belgrade coordinates approx - HQ
const HQ_LAT = 44.7552; // Approximate for Luke Vojvodica 25f area (Rakovica/Vidikovac)
const HQ_LNG = 20.4390;

interface Location {
    id: string;
    lat: number;
    lng: number;
    address: string;
    name: string;
    note?: string;
    order?: number; // Sequence in route
}


interface DeliveryMapProps {
    stops: Location[];
    routePath?: [number, number][]; // Array of lat/lng pairs for the line
    hoveredOrderId?: string | null;
}

// Custom Icons
const createIcon = (color: string, number?: number, isHighlighted?: boolean) => {
    const size = isHighlighted ? 45 : 30; // Larger when highlighted
    return L.divIcon({
        className: 'custom-icon',
        html: `
            <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-family: sans-serif;
                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                transform: ${isHighlighted ? 'scale(1.1)' : 'scale(1)'};
                transition: all 0.2s ease-out;
                z-index: ${isHighlighted ? 1000 : 1};
            ">
                ${number || ''}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const hqIcon = createIcon('#121333'); // Navy for HQ
const deliveryIcon = (num: number, isHighlighted?: boolean) => createIcon(isHighlighted ? '#121333' : '#9cbe48', num, isHighlighted); // Green usually, Navy when highlighted

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export default function DeliveryMap({ stops, routePath, hoveredOrderId }: DeliveryMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsMounted(true); // Suppress warning: we intentionally trigger re-render on mount to handle Leaflet no-SSR
    }, []);

    if (!isMounted) {
        return <div className="bg-slate-100 rounded-xl w-full h-[600px] animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;
    }

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden z-0 border border-slate-200 shadow-sm relative">
            <MapContainer
                center={[HQ_LAT, HQ_LNG]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* HQ Marker */}
                <Marker position={[HQ_LAT, HQ_LNG]} icon={hqIcon}>
                    <Popup>
                        <div className="font-sans">
                            <strong className="text-red-500">HQ - Početna tačka</strong><br />
                            Luke Vojvodića 25f<br />
                            Beograd
                        </div>
                    </Popup>
                </Marker>

                {/* Delivery Markers */}
                {stops.map((stop, idx) => (
                    <Marker
                        key={stop.id}
                        position={[stop.lat, stop.lng]}
                        icon={deliveryIcon(stop.order || idx + 1, stop.id === hoveredOrderId)}
                        zIndexOffset={stop.id === hoveredOrderId ? 1000 : 0}
                    >
                        <Popup>
                            <div className="font-sans min-w-[200px]">
                                <h3 className="font-bold text-slate-900 border-b pb-1 mb-2">{stop.name}</h3>
                                <p className="text-sm text-slate-600 mb-1">{stop.address}</p>
                                {stop.note && (
                                    <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded mt-2 border border-amber-100">
                                        <strong>Napomena:</strong> {stop.note}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Route Line */}
                {routePath && routePath.length > 0 && (
                    <Polyline
                        positions={routePath}
                        color="#4f46e5"
                        weight={4}
                        opacity={0.8}
                        dashArray="10, 10"
                    />
                )}

                <MapController center={[HQ_LAT, HQ_LNG]} />
            </MapContainer>
        </div>
    );
}
