"use client";

import { useState } from "react";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance } from "@/lib/gpx-utils";
import { toast } from "sonner";

export function GpxPointEditor() {
    const { gpxData, isLoading, error, deleteTrackPoints } = useGpx();
    const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
    const [editMode, setEditMode] = useState(false);

    if (isLoading || error || !gpxData || gpxData.tracks.length === 0) {
        return null;
    }

    // For now, we only support editing the first track
    const track = gpxData.tracks[0];
    const points = track.points;

    // Don't show the editor if there aren't enough points
    if (points.length <= 2) {
        return null;
    }

    const togglePoint = (index: number) => {
        const newSelected = new Set(selectedPoints);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedPoints(newSelected);
    };

    const handleDeletePoints = () => {
        if (selectedPoints.size === 0) {
            toast.error("No points selected for deletion");
            return;
        }

        // We can't delete all points
        if (selectedPoints.size >= points.length - 2) {
            toast.error("Cannot delete all points. At least 2 points must remain.");
            return;
        }

        try {
            // Convert Set to Array for the context function
            const pointIndices = Array.from(selectedPoints);
            deleteTrackPoints(0, pointIndices); // 0 is the index of the first track
            toast.success(`${selectedPoints.size} point(s) deleted successfully`);

            // Reset selection after deletion
            setSelectedPoints(new Set());
        } catch (error) {
            console.error("Error deleting points:", error);
            toast.error("Failed to delete points");
        }
    };

    if (!editMode) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Track Points</span>
                        <Button variant="outline" size="sm" onClick={ () => setEditMode(true) }>
                            Edit Points
                        </Button>
                    </CardTitle>
                    <CardDescription>{ points.length } points in track</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Edit Track Points</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={ () => {
                            setEditMode(false);
                            setSelectedPoints(new Set());
                        } }
                    >
                        Done
                    </Button>
                </CardTitle>
                <CardDescription>Select points to delete ({ selectedPoints.size } selected)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <ScrollArea className="h-60 rounded-md border p-2">
                        <div className="space-y-1">
                            { points.map((point, index) => {
                                // Skip first and last points as they are typically the start and end
                                const isEndpoint = index === 0 || index === points.length - 1;
                                const isSelected = selectedPoints.has(index);

                                return (
                                    <div
                                        key={ `point-${index}` }
                                        className={ `flex cursor-pointer items-center justify-between rounded-md p-2 ${isEndpoint ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"}
                                            ${isSelected ? "bg-blue-100" : ""}
                                        `}
                                        onClick={ () => {
                                            if (!isEndpoint) togglePoint(index);
                                        } }
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={ `h-2 w-2 rounded-full ${index === 0 ? "bg-green-500" : index === points.length - 1 ? "bg-red-500" : "bg-blue-500"}
                                            `}
                                            />
                                            <span>Point { index + 1 }</span>
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            { point.lat.toFixed(5) }, { point.lon.toFixed(5) }
                                            { index > 0 && (
                                                <span className="ml-2">
                                                    (
                                                    { formatDistance(
                                                        Math.sqrt(
                                                            (points[index].lat - points[index - 1].lat) ** 2 +
                                                            (points[index].lon - points[index - 1].lon) ** 2,
                                                        ) * 111000,
                                                    ) }{ " " }
                                                    from prev)
                                                </span>
                                            ) }
                                        </div>
                                    </div>
                                );
                            }) }
                        </div>
                    </ScrollArea>

                    { selectedPoints.size > 0 && (
                        <Button variant="destructive" className="w-full" onClick={ handleDeletePoints }>
                            Delete { selectedPoints.size } Selected Point{ selectedPoints.size !== 1 && "s" }
                        </Button>
                    ) }
                </div>
            </CardContent>
        </Card>
    );
}
