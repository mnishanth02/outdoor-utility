"use client";

import { useState } from "react";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    calculateTotalDistance,
    calculateElevation,
    calculateDuration,
    formatDuration,
    formatDistance
} from "@/lib/gpx-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function GpxComparison() {
    const { storedFiles, setActiveFile, gpxData } = useGpx();
    const [expanded, setExpanded] = useState(false);

    // Only show comparison if we have more than one file
    if (storedFiles.length <= 1) {
        return null;
    }

    // Calculate basic stats for each file
    const fileStats = storedFiles.map(file => {
        // For simplicity, we'll just use the first track in each file
        const track = file.tracks[0];
        const totalDistance = calculateTotalDistance(track);
        const { gain, loss } = calculateElevation(track);
        const duration = calculateDuration(track);
        const isActive = gpxData?.id === file.id;

        return {
            id: file.id,
            name: file.metadata.name || "Unnamed Track",
            distance: totalDistance,
            formattedDistance: formatDistance(totalDistance),
            duration: duration,
            formattedDuration: duration ? formatDuration(duration) : "N/A",
            elevationGain: gain ? Math.round(gain) : 0,
            elevationLoss: loss ? Math.round(loss) : 0,
            pointCount: track.points.length,
            isActive
        };
    });

    // Sort by distance (longest first)
    const sortedStats = [...fileStats].sort((a, b) => b.distance - a.distance);

    // Show only first 3 files if not expanded
    const displayStats = expanded ? sortedStats : sortedStats.slice(0, 3);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Track Comparison</CardTitle>
                        <CardDescription>Compare your loaded GPX tracks</CardDescription>
                    </div>
                    {storedFiles.length > 3 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? "Show Less" : `Show All (${storedFiles.length})`}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Track Name</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Elevation</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayStats.map((stat) => (
                            <TableRow key={stat.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        {stat.name}
                                        {stat.isActive && (
                                            <Badge variant="outline" className="mt-1 w-fit bg-blue-50 text-blue-600">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{stat.formattedDistance}</TableCell>
                                <TableCell>{stat.formattedDuration}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1 text-xs text-green-600">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="m18 9-6-6-6 6" />
                                                <path d="M12 3v18" />
                                            </svg>
                                            {stat.elevationGain}m
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-red-600">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="m6 15 6 6 6-6" />
                                                <path d="M12 3v18" />
                                            </svg>
                                            {stat.elevationLoss}m
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{stat.pointCount}</TableCell>
                                <TableCell className="text-right">
                                    {!stat.isActive ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => stat.id && setActiveFile(stat.id)}
                                        >
                                            Select
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" disabled>
                                            Selected
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!expanded && storedFiles.length > 3 && (
                    <div className="mt-4 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(true)}
                        >
                            Show all {storedFiles.length} tracks
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}