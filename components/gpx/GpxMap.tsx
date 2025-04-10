"use client";
import { useState } from "react";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, FileX, RefreshCcw } from "lucide-react";
import dynamic from "next/dynamic";
import type { GpxPoint } from "@/contexts/GpxContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components with SSR disabled
const MapWithNoSSR = dynamic(() => import("./map-components/LeafletMap"), {
    ssr: false,
    loading: () => (
        <Card className="flex h-[600px] w-full items-center justify-center bg-gray-100">
            <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p>Loading map...</p>
                </div>
            </CardContent>
        </Card>
    ),
});

export function GpxMap() {
    const { gpxData, isLoading, error, updateTrackPoints } = useGpx();
    const [isEditing, setIsEditing] = useState(false);

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    const handlePointsUpdate = (updatedPoints: GpxPoint[]) => {
        if (gpxData && gpxData.tracks.length > 0) {
            updateTrackPoints(0, updatedPoints);
        }
    };

    if (isLoading) {
        return (
            <Card className="flex h-[600px] w-full items-center justify-center bg-gray-100">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p>Loading GPX data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="flex h-[600px] w-full items-center justify-center">
                <CardContent className="max-w-md p-6">
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error loading GPX data</AlertTitle>
                        <AlertDescription>{ error }</AlertDescription>
                    </Alert>
                    <div className="mt-4 flex justify-center">
                        <Button variant="secondary" onClick={ () => window.location.reload() }>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reload page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!gpxData || gpxData.tracks.length === 0) {
        return (
            <Card className="flex h-[600px] w-full items-center justify-center bg-gray-100">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                        <div>
                            <h3 className="font-medium text-lg">No GPX data available</h3>
                            <p className="mt-1 text-muted-foreground text-sm">
                                Please upload a GPX file to view its track on the map
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Use the first track for now (can be enhanced to show multiple tracks)
    const track = gpxData.tracks[0];
    const points = track.points;

    return (
        <Card className="w-full">
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
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <MapWithNoSSR
                    points={ points }
                    height="600px"
                    isEditing={ isEditing }
                    onPointsChange={ handlePointsUpdate }
                />
            </CardContent>
        </Card>
    );
}
