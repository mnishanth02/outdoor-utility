"use client";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components with SSR disabled
const MapWithNoSSR = dynamic(() => import("./map-components/LeafletMap"), {
    ssr: false,
    loading: () => (
        <Card className="flex h-[400px] w-full items-center justify-center bg-gray-100">
            <CardContent className="p-6 text-center">Loading map...</CardContent>
        </Card>
    ),
});

export function GpxMap() {
    const { gpxData, isLoading, error } = useGpx();

    if (isLoading || error || !gpxData || gpxData.tracks.length === 0) {
        return (
            <Card className="flex h-[400px] w-full items-center justify-center bg-gray-100">
                <CardContent className="p-6 text-center">
                    { isLoading ? "Loading map..." : error ? "Error loading map" : "No GPX data available" }
                </CardContent>
            </Card>
        );
    }

    // Use the first track for now (can be enhanced to show multiple tracks)
    const track = gpxData.tracks[0];
    const points = track.points;

    return <MapWithNoSSR points={ points } />;
}
