"use client";
import { useState } from "react";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Edit3 } from "lucide-react";
import dynamic from "next/dynamic";
import type { GpxPoint } from "@/contexts/GpxContext";

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
    const { gpxData, isLoading, error, updateTrackPoints } = useGpx();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        if (isFullScreen) {
            setIsEditing(false); // Exit edit mode when exiting full screen
        }
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        if (!isFullScreen && !isEditing) {
            setIsFullScreen(true); // Enter full screen when entering edit mode
        }
    };

    const handlePointsUpdate = (updatedPoints: GpxPoint[]) => {
        if (gpxData && gpxData.tracks.length > 0) {
            updateTrackPoints(0, updatedPoints);
        }
    };

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

    return (
        <Card className={ isFullScreen ? "fixed inset-0 z-50 rounded-none" : "w-full" }>
            { isFullScreen && (
                <CardHeader className="p-4 pb-0">
                    <CardTitle className="flex items-center justify-between">
                        <span>Interactive Map { isEditing ? "- Edit Mode" : "" }</span>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={ toggleEditMode }
                                className={ isEditing ? "bg-blue-100" : "" }
                            >
                                <Edit3 className="mr-1 h-4 w-4" />
                                { isEditing ? "Editing" : "Edit Route" }
                            </Button>
                            <Button variant="outline" size="sm" onClick={ toggleFullScreen }>
                                <Maximize2 className="h-4 w-4" />
                                Exit Full Screen
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
            ) }
            <CardContent className={ isFullScreen ? "p-4" : "p-0" }>
                <div className={ isFullScreen ? "" : "relative" }>
                    { !isFullScreen && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 z-10 bg-white bg-opacity-80 shadow-sm"
                            onClick={ toggleFullScreen }
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    ) }
                    <MapWithNoSSR
                        points={ points }
                        height={ isFullScreen ? "calc(100vh - 100px)" : "400px" }
                        isEditing={ isEditing }
                        onPointsChange={ handlePointsUpdate }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
