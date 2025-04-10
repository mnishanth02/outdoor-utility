"use client";

import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Card className="overflow-hidden border-2 bg-card shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-primary text-xl">
                            { gpxData.metadata.name || "Track Details" }
                        </CardTitle>
                        { gpxData.metadata.description && (
                            <CardDescription className="mt-1 line-clamp-1">
                                { gpxData.metadata.description }
                            </CardDescription>
                        ) }
                    </div>
                    <Badge variant="secondary" className="font-medium">
                        Active Track
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M2 12h20" />
                                <path d="M16 6l6 6-6 6" />
                            </svg>
                            <h3 className="font-medium text-muted-foreground text-sm">Distance</h3>
                        </div>
                        <p className="font-bold text-2xl text-foreground">{ formatDistance(totalDistance) }</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h3 className="font-medium text-muted-foreground text-sm">Duration</h3>
                        </div>
                        <p className="font-bold text-2xl text-foreground">
                            { duration ? formatDuration(duration) : "N/A" }
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M18 8V5c0-1-1-2-2-2H4C3 3 2 4 2 5v14c0 1 1 2 2 2h12c1 0 2-1 2-2v-3" />
                                <path d="M10 17l5-5" />
                                <path d="M15 17v-5h-5" />
                            </svg>
                            <h3 className="font-medium text-muted-foreground text-sm">Elevation Gain</h3>
                        </div>
                        <p className="font-bold text-2xl text-foreground">
                            { gain ? `${Math.round(gain)}m` : "N/A" }
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M18 8V5c0-1-1-2-2-2H4C3 3 2 4 2 5v14c0 1 1 2 2 2h12c1 0 2-1 2-2v-3" />
                                <path d="M10 12l5 5" />
                                <path d="M15 12h-5v5" />
                            </svg>
                            <h3 className="font-medium text-muted-foreground text-sm">Elevation Loss</h3>
                        </div>
                        <p className="font-bold text-2xl text-foreground">
                            { loss ? `${Math.round(loss)}m` : "N/A" }
                        </p>
                    </div>
                </div>
                { track.points.length > 0 && (
                    <div className="mt-4 text-center text-muted-foreground text-xs">
                        Track has { track.points.length } points | Last updated:{ " " }
                        { gpxData.metadata.time ? new Date(gpxData.metadata.time).toLocaleString() : "N/A" }
                    </div>
                ) }
            </CardContent>
        </Card>
    );
}
