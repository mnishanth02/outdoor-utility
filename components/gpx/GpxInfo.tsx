"use client";

import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    calculateTotalDistance,
    calculateElevation,
    calculateDuration,
    formatDuration,
    formatDistance,
} from "@/lib/gpx-utils";

export function GpxInfo() {
    const { gpxData, isLoading, error } = useGpx();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                    <CardDescription>Processing your GPX file</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>{ error }</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!gpxData || gpxData.tracks.length === 0) {
        return null;
    }

    // Calculate stats for the first track (in the future we might want to show stats for all tracks)
    const track = gpxData.tracks[0];
    const totalDistance = calculateTotalDistance(track);
    const { gain, loss } = calculateElevation(track);
    const duration = calculateDuration(track);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{ gpxData.metadata.name || "Unnamed Track" }</CardTitle>
                <CardDescription>{ gpxData.metadata.description || "No description" }</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                        <h3 className="font-medium text-sm">Distance</h3>
                        <p className="font-bold text-2xl">{ formatDistance(totalDistance) }</p>
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-medium text-sm">Duration</h3>
                        <p className="font-bold text-2xl">{ duration ? formatDuration(duration) : "N/A" }</p>
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-medium text-sm">Elevation Gain</h3>
                        <p className="font-bold text-2xl">{ gain ? `${Math.round(gain)}m` : "N/A" }</p>
                    </div>

                    <div className="space-y-1">
                        <h3 className="font-medium text-sm">Elevation Loss</h3>
                        <p className="font-bold text-2xl">{ loss ? `${Math.round(loss)}m` : "N/A" }</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}