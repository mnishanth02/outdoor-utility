"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateCenter } from "@/lib/gpx-utils";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { GpxPoint } from "@/contexts/GpxContext";

// Leaflet marker icon fix for Next.js
// This is needed because of how Next.js handles static assets
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

// Set default icon for all markers
if (typeof window !== "undefined") {
    L.Marker.prototype.options.icon = defaultIcon;
}

// Component to auto-adjust the map view to fit the route
function MapViewAdapter({ points }: { points: Array<[number, number]> }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) return;

        // If there's only one point, just center on it
        if (points.length === 1) {
            map.setView(points[0], 13);
            return;
        }

        // Create a bounds object that includes all points
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
        });
    }, [map, points]);

    return null;
}

interface LeafletMapProps {
    points: GpxPoint[];
}

export default function LeafletMap({ points }: LeafletMapProps) {
    // Transform points for Leaflet - [lat, lon] format
    const coordinates: Array<[number, number]> = points.map((point) => [point.lat, point.lon]);

    // Get start and end points
    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];

    // Calculate center point for initial map view
    const center = calculateCenter(points);

    return (
        <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
                <div className="relative h-[400px] w-full">
                    <MapContainer
                        center={ [center.lat, center.lon] }
                        zoom={ 13 }
                        style={ { height: "100%", width: "100%" } }
                        attributionControl={ false }
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Draw the track as a polyline */ }
                        <Polyline positions={ coordinates } color="#3b82f6" weight={ 4 } opacity={ 0.8 } />

                        {/* Mark the start point */ }
                        <Marker
                            position={ startPoint }
                            icon={ L.divIcon({
                                className: "bg-green-500 h-4 w-4 rounded-full border-2 border-white",
                                iconSize: [16, 16],
                                iconAnchor: [8, 8],
                            }) }
                        />

                        {/* Mark the end point */ }
                        <Marker
                            position={ endPoint }
                            icon={ L.divIcon({
                                className: "bg-red-500 h-4 w-4 rounded-full border-2 border-white",
                                iconSize: [16, 16],
                                iconAnchor: [8, 8],
                            }) }
                        />

                        {/* Auto-fit the map to the track */ }
                        <MapViewAdapter points={ coordinates } />
                    </MapContainer>
                </div>
            </CardContent>
        </Card>
    );
}
