"use client";

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, Truck, Navigation, MapPin, StickyNote, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

// Dynamic import for Map to avoid SSR issues
const DeliveryMap = dynamic(() => import('@/components/delivery/DeliveryMap'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-slate-100 animate-pulse text-center content-center rounded-xl">Loading Map Module...</div>
});

// Interfaces
interface DeliveryOrder {
    id: string;
    customer: string;
    address: string;
    startDate: string; // From API (dd-mm-yyyy usually)
    duration: string;  // e.g. "22 dana"
    note?: string;
}

// HQ Location (Luke Vojvodića 25f, approx)
const HQ_LAT = 44.7552;
const HQ_LNG = 20.4390;

// Helper: Parse 'dd-mm-yyyy' or 'dd.mm.yyyy' to Date object
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    try {
        // Replace dashes with dots to unify format
        const normalized = dateStr.replace(/-/g, '.');
        const parts = normalized.split('.');
        if (parts.length !== 3) return null;

        // Format is dd.mm.yyyy
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } catch {
        return null;
    }
};

// Helper: Parse Duration ("22 dana" -> 22)
const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 1; // Default to 1 day if missing
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[0]) : 1;
};

// Helper: Check if selected date is within [StartDate, StartDate + Duration)
const isDateInRange = (selectedDateStr: string, orderStartDate: string, orderDuration: string): boolean => {
    const selected = new Date(selectedDateStr); // YYYY-MM-DD from input type='date'
    selected.setHours(0, 0, 0, 0);

    // Try parsing dd.mm.yyyy first (common in this region)
    let start = parseDate(orderStartDate);

    // Fallback if format is different (e.g. if API returns standardized YYYY-MM-DD)
    if (!start && orderStartDate.includes('-')) {
        start = new Date(orderStartDate);
    }

    if (!start || isNaN(start.getTime())) return false;
    start.setHours(0, 0, 0, 0);

    const durationDays = parseDuration(orderDuration);

    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    end.setHours(0, 0, 0, 0);

    return selected >= start && selected < end;
};

// Cache for geocoding results to avoid re-fetching same addresses
const GEOCODE_CACHE: Record<string, { lat: number; lng: number }> = {};

// Nominatim Geocoding
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Check cache first
    if (GEOCODE_CACHE[address]) return GEOCODE_CACHE[address];

    try {
        const query = encodeURIComponent(`${address}, Belgrade, Serbia`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'SwiftOrbit-DeliveryApp/1.0' // Required by Nominatim
            }
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            GEOCODE_CACHE[address] = result;
            return result;
        }
    } catch (error) {
        console.error("Geocoding failed for:", address);
    }
    return null;
};

// ... (helpers remain same)

export default function DeliveryPage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [routeOptimized, setRouteOptimized] = useState(false);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [optimizedOrderIds, setOptimizedOrderIds] = useState<string[]>([]);
    const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
    const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
    const [routeDistance, setRouteDistance] = useState<number | null>(null);

    // Store resolved coordinates: { [orderId]: { lat, lng } }
    const [resolvedCoords, setResolvedCoords] = useState<Record<string, { lat: number; lng: number }>>({});

    // Fetch Orders on mount
    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setOrders(data);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    // Filter Logic
    const dailyDeliveries = useMemo(() => {
        return orders.filter(order => {
            if (!order.startDate) return false;
            return isDateInRange(selectedDate, order.startDate, order.duration);
        });
    }, [orders, selectedDate]);

    // Geocoding Effect
    useEffect(() => {
        let isCancelled = false;

        const processGeocoding = async () => {
            // Find orders that need geocoding
            const ordersToGeocode = dailyDeliveries.filter(o => !resolvedCoords[o.id]);

            if (ordersToGeocode.length === 0) return;

            // Process one by one with delay
            for (const order of ordersToGeocode) {
                if (isCancelled) break;

                // If we already have it in cache (from previous visits), use it immediately without delay
                if (GEOCODE_CACHE[order.address]) {
                    setResolvedCoords(prev => ({
                        ...prev,
                        [order.id]: GEOCODE_CACHE[order.address]
                    }));
                    continue;
                }

                // Otherwise, fetch with delay to be polite
                const coords = await geocodeAddress(order.address);
                if (coords && !isCancelled) {
                    setResolvedCoords(prev => ({
                        ...prev,
                        [order.id]: coords
                    }));
                }

                // Wait 1.1s before next request (Nominatim standard is 1s)
                await new Promise(r => setTimeout(r, 1100));
            }
        };

        processGeocoding();

        return () => { isCancelled = true; };
    }, [dailyDeliveries, resolvedCoords]);

    // Map Stops with Coords
    const stops = useMemo(() => {
        return dailyDeliveries
            .filter(d => resolvedCoords[d.id]) // Only show ones we have found
            .map(d => {
                const coords = resolvedCoords[d.id];
                return {
                    ...d,
                    name: d.customer,
                    lat: coords.lat,
                    lng: coords.lng
                };
            });
    }, [dailyDeliveries, resolvedCoords]);

    // Handle Route Generation (OSRM)
    const handleGenerateRoute = async () => {
        if (stops.length === 0) return;
        setIsGeneratingRoute(true);
        setRouteOptimized(false);
        setRoutePath([]);
        setRouteDistance(null);

        try {
            // 1. Simple salesman sort (Nearest Neighbor) to get order of visit
            // (OSRM Trip API is better but Route API is simpler for drawing path given an order)
            // For now, we will sort points simply by distance from HQ to simulate a logical path
            // const sortedStops = [...stops]; (Removed unused)
            // Simple sort by distance from HQ? Or proper NN? Let's do a simple NN greedy sort.
            const routeOrder: typeof stops = [];
            const remaining = [...stops];
            let currentPos = { lat: HQ_LAT, lng: HQ_LNG };

            while (remaining.length > 0) {
                let nearestIdx = -1;
                let minDist = Infinity;
                remaining.forEach((stop, idx) => {
                    const dist = Math.sqrt(Math.pow(stop.lat - currentPos.lat, 2) + Math.pow(stop.lng - currentPos.lng, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        nearestIdx = idx;
                    }
                });

                if (nearestIdx !== -1) {
                    const next = remaining[nearestIdx];
                    routeOrder.push(next);
                    currentPos = { lat: next.lat, lng: next.lng };
                    remaining.splice(nearestIdx, 1);
                }
            }

            setOptimizedOrderIds(routeOrder.map(r => r.id));

            // 2. Call OSRM for the polyline
            // Format: {lon},{lat};{lon},{lat}...
            const coordinates = [
                `${HQ_LNG},${HQ_LAT}`, // Start
                ...routeOrder.map(s => `${s.lng},${s.lat}`) // Stops
            ].join(';');

            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

            const res = await fetch(osrmUrl);
            const data = await res.json();

            if (data.routes && data.routes[0]) {
                // Leaflet expects [lat, lng], GeoJSON is [lng, lat]
                const geoJsonCoords = data.routes[0].geometry.coordinates;
                const latLngPath = geoJsonCoords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                setRoutePath(latLngPath);
                setRouteOptimized(true);

                // Set Distance (meters -> kilometers)
                if (data.routes[0].distance) {
                    setRouteDistance(data.routes[0].distance);
                }
            }

        } catch (error) {
            console.error("Routing failed", error);
            alert("Nije uspelo generisanje rute. Proveri internet konekciju.");
        } finally {
            setIsGeneratingRoute(false);
        }
    };

    // Derived list for display (sorted if optimized)
    const displayList = useMemo(() => {
        if (!routeOptimized) return stops;
        // Sort stops based on optimizedOrderIds
        return [...stops].sort((a, b) => {
            return optimizedOrderIds.indexOf(a.id) - optimizedOrderIds.indexOf(b.id);
        });
    }, [stops, routeOptimized, optimizedOrderIds]);


    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#121333] to-[#9cbe48]">
                        Planiranje Dostave
                    </h1>
                    <p className="text-slate-500 mt-2">Upravljanje rutama i dostavama za vozače</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    {/* Route Distance Display */}
                    {routeDistance !== null && (
                        <div className="px-3 py-2 bg-[#121333] text-white rounded-lg text-sm font-semibold shadow-md border border-[#121333] mr-2 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#9cbe48]" />
                            {(routeDistance / 1000).toFixed(1)} km
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setRouteOptimized(false);
                                setRoutePath([]);
                                setRouteDistance(null);
                            }}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none"
                        />
                    </div>
                    {dailyDeliveries.length > 0 && (
                        <button
                            onClick={handleGenerateRoute}
                            disabled={isGeneratingRoute}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md",
                                routeOptimized
                                    ? "bg-[#9cbe48] text-white hover:bg-[#8bad3f]"
                                    : "bg-[#121333] text-white hover:bg-[#1a1b4b] shadow-slate-200",
                                isGeneratingRoute && "opacity-70 cursor-wait"
                            )}
                        >
                            {isGeneratingRoute ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                            {isGeneratingRoute ? "Računam..." : (routeOptimized ? "Ruta Generisana" : "Generiši Najbolju Rutu")}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                {/* Left: List View */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#9cbe48]" />
                            Lista Dostava ({dailyDeliveries.length})
                        </h2>
                        {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>

                    {!loading && dailyDeliveries.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p>Nema aktivnih dostava za izabrani datum.</p>
                            <p className="text-xs mt-2 text-slate-300">(Proveri početak i trajanje paketa)</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayList.map((order, idx) => (
                                <div
                                    key={order.id}
                                    onMouseEnter={() => setHoveredOrderId(order.id)}
                                    onMouseLeave={() => setHoveredOrderId(null)}
                                    className={cn(
                                        "group relative p-4 rounded-xl border transition-all cursor-pointer",
                                        hoveredOrderId === order.id
                                            ? "border-[#9cbe48] bg-[#f4f9e8] shadow-md ring-1 ring-[#9cbe48]" // Highlight style
                                            : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#121333]/20 hover:shadow-md"
                                    )}
                                >
                                    {routeOptimized && (
                                        <div className="absolute -left-2 -top-2 w-6 h-6 bg-[#121333] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-white">
                                            {idx + 1}
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-2 rounded-full border transition-colors",
                                            hoveredOrderId === order.id
                                                ? "bg-amber-100 text-amber-600 border-amber-200"
                                                : "bg-white border-slate-100 text-slate-400 group-hover:text-indigo-500"
                                        )}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className={cn(
                                                    "font-semibold",
                                                    hoveredOrderId === order.id ? "text-amber-900" : "text-slate-900"
                                                )}>{order.customer}</h3>
                                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{order.id}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{order.address}</p>

                                            {/* Debug Info */}
                                            {/* <p className="text-xs text-slate-300 mt-1">Start: {order.startDate}, Trajanje: {order.duration}</p> */}

                                            {order.note && (
                                                <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-100">
                                                    <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                                                    {order.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Map View */}
                <div className="lg:col-span-2 h-full">
                    <DeliveryMap
                        stops={displayList.map((s, i) => ({ ...s, order: routeOptimized ? i + 1 : undefined }))}
                        routePath={routePath}
                        hoveredOrderId={hoveredOrderId}
                    />
                </div>
            </div>
        </div>
    );
}
