import { useCallback, useRef } from "react";
import type { GpxData, MergePoint, GpxPoint } from "@/contexts/GpxContext";
import type { MergeMethod, MergeOptions, PreviewStats } from "../GpxMerger";
import { toast } from "sonner";
import { simplifyTrack } from "@/lib/gpx-utils";

interface MergeStrategiesProps {
    filteredFiles: GpxData[];
    setSelectedPoints: (points: MergePoint[]) => void;
    mergeOptions: MergeOptions;
    selectedPoints: MergePoint[];
    setPreviewStats: (stats: PreviewStats) => void;
    mergeMethod: MergeMethod;
}

export function useMergeStrategies({
    filteredFiles,
    setSelectedPoints,
    mergeOptions,
    selectedPoints,
    setPreviewStats,
    mergeMethod,
}: MergeStrategiesProps) {
    // Use a ref to track if we're currently processing a merge
    const isProcessingRef = useRef(false);

    const updatePreviewStats = useCallback(() => {
        if (isProcessingRef.current) return;

        // Calculate total points in original files
        const totalOriginal = filteredFiles.reduce((sum, file) => {
            return sum + file.tracks.reduce((trackSum, track) => {
                return trackSum + track.points.length;
            }, 0);
        }, 0);

        // Calculate estimated file size (rough approximation)
        const bytesPerPoint = 120; // Rough estimate of bytes per GPX point
        const estimatedBytes = selectedPoints.length * bytesPerPoint;
        const estimatedSize =
            estimatedBytes < 1024 * 1024
                ? `${Math.round(estimatedBytes / 1024)} KB`
                : `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;

        // Calculate points removed by duplicate filtering
        const duplicatesRemoved = mergeOptions.skipDuplicatePoints
            ? totalOriginal - selectedPoints.length
            : 0;

        setPreviewStats({
            totalPointsOriginal: totalOriginal,
            totalPointsAfterMerge: selectedPoints.length,
            estimatedFileSize: estimatedSize,
            duplicatePointsRemoved: duplicatesRemoved,
        });
    }, [filteredFiles, selectedPoints.length, mergeOptions.skipDuplicatePoints, setPreviewStats]);

    const createSequentialMerge = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        const newMergePoints: MergePoint[] = [];
        const pointsMap = new Map<string, boolean>();

        try {
            // Add points from files in the order specified by fileOrder
            for (const fileId of mergeOptions.fileOrder) {
                const file = filteredFiles.find((f) => f.id === fileId);
                if (!file || !file.id) continue;

                for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                    const track = file.tracks[trackIndex];

                    for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                        const point = track.points[pointIndex];

                        // Skip duplicate points if option is enabled
                        if (mergeOptions.skipDuplicatePoints) {
                            const pointKey = `${point.lat},${point.lon}`;
                            if (pointsMap.has(pointKey)) continue;
                            pointsMap.set(pointKey, true);
                        }

                        newMergePoints.push({
                            sourceFileId: file.id,
                            trackIndex,
                            pointIndex,
                        });
                    }
                }
            }

            setSelectedPoints(newMergePoints);
        } finally {
            isProcessingRef.current = false;
        }
    }, [filteredFiles, mergeOptions, setSelectedPoints]);

    const createTimeMerge = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const newMergePoints: MergePoint[] = [];
            const allPoints: Array<MergePoint & { time: Date }> = [];
            const pointsMap = new Map<string, boolean>();

            // Collect all points with timestamps
            for (const file of filteredFiles) {
                if (!file.id) continue;

                for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                    const track = file.tracks[trackIndex];

                    for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                        const point = track.points[pointIndex];

                        if (point.time) {
                            try {
                                const timestamp = new Date(point.time);

                                // Skip duplicate points if option is enabled
                                if (mergeOptions.skipDuplicatePoints) {
                                    const pointKey = `${point.lat},${point.lon}`;
                                    if (pointsMap.has(pointKey)) continue;
                                    pointsMap.set(pointKey, true);
                                }

                                allPoints.push({
                                    sourceFileId: file.id,
                                    trackIndex,
                                    pointIndex,
                                    time: timestamp,
                                });
                            } catch {
                                console.error("Invalid timestamp:", point.time);
                            }
                        }
                    }
                }
            }

            // Sort points by timestamp
            allPoints.sort((a, b) => a.time.getTime() - b.time.getTime());

            // Split into segments if time gaps exceed threshold
            if (mergeOptions.timeGapThreshold > 0) {
                let currentSegment: typeof allPoints = [];

                for (let i = 0; i < allPoints.length; i++) {
                    const current = allPoints[i];
                    currentSegment.push(current);

                    if (i < allPoints.length - 1) {
                        const next = allPoints[i + 1];
                        const timeDiffMinutes = (next.time.getTime() - current.time.getTime()) / (1000 * 60);

                        // If gap exceeds threshold, add current segment and start a new one
                        if (timeDiffMinutes > mergeOptions.timeGapThreshold) {
                            // Add current segment points
                            newMergePoints.push(
                                ...currentSegment.map(({ sourceFileId, trackIndex, pointIndex }) => ({
                                    sourceFileId,
                                    trackIndex,
                                    pointIndex,
                                }))
                            );

                            currentSegment = [];
                        }
                    }
                }

                // Add the last segment if not empty
                if (currentSegment.length > 0) {
                    newMergePoints.push(
                        ...currentSegment.map(({ sourceFileId, trackIndex, pointIndex }) => ({
                            sourceFileId,
                            trackIndex,
                            pointIndex,
                        }))
                    );
                }
            } else {
                // No segmentation, just add all points
                newMergePoints.push(
                    ...allPoints.map(({ sourceFileId, trackIndex, pointIndex }) => ({
                        sourceFileId,
                        trackIndex,
                        pointIndex,
                    }))
                );
            }

            setSelectedPoints(newMergePoints);

            if (newMergePoints.length === 0) {
                toast.error("None of the selected files have points with timestamps");
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [filteredFiles, mergeOptions, setSelectedPoints]);

    const createSimplifiedMerge = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            // First create a sequential or time-based merge as the base
            if (mergeMethod === "simplified") {
                const baseMethod = mergeOptions.includeElevation ? "byTime" : "sequential";
                let basePoints: MergePoint[] = [];

                // Get base points first
                if (baseMethod === "byTime") {
                    const allPoints: Array<MergePoint & { time: Date }> = [];
                    const pointsMap = new Map<string, boolean>();

                    // Collect all points with timestamps
                    for (const file of filteredFiles) {
                        if (!file.id) continue;

                        for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                            const track = file.tracks[trackIndex];

                            for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                                const point = track.points[pointIndex];

                                if (point.time) {
                                    try {
                                        const timestamp = new Date(point.time);

                                        // Skip duplicate points if option is enabled
                                        if (mergeOptions.skipDuplicatePoints) {
                                            const pointKey = `${point.lat},${point.lon}`;
                                            if (pointsMap.has(pointKey)) continue;
                                            pointsMap.set(pointKey, true);
                                        }

                                        allPoints.push({
                                            sourceFileId: file.id,
                                            trackIndex,
                                            pointIndex,
                                            time: timestamp,
                                        });
                                    } catch {
                                        console.error("Invalid timestamp:", point.time);
                                    }
                                }
                            }
                        }
                    }

                    // Sort points by timestamp
                    allPoints.sort((a, b) => a.time.getTime() - b.time.getTime());
                    basePoints = allPoints.map(({ sourceFileId, trackIndex, pointIndex }) => ({
                        sourceFileId,
                        trackIndex,
                        pointIndex,
                    }));
                } else {
                    // Sequential merge
                    const newMergePoints: MergePoint[] = [];
                    const pointsMap = new Map<string, boolean>();

                    for (const fileId of mergeOptions.fileOrder) {
                        const file = filteredFiles.find((f) => f.id === fileId);
                        if (!file || !file.id) continue;

                        for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                            const track = file.tracks[trackIndex];

                            for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                                const point = track.points[pointIndex];

                                // Skip duplicate points if option is enabled
                                if (mergeOptions.skipDuplicatePoints) {
                                    const pointKey = `${point.lat},${point.lon}`;
                                    if (pointsMap.has(pointKey)) continue;
                                    pointsMap.set(pointKey, true);
                                }

                                newMergePoints.push({
                                    sourceFileId: file.id,
                                    trackIndex,
                                    pointIndex,
                                });
                            }
                        }
                    }
                    basePoints = newMergePoints;
                }

                // Apply simplification algorithm (Douglas-Peucker)
                if (basePoints.length > 0 && mergeOptions.simplificationTolerance > 0) {
                    // Convert MergePoints to actual GpxPoints for simplification
                    const pointsToSimplify: { point: GpxPoint; mergePoint: MergePoint }[] = [];

                    for (const mergePoint of basePoints) {
                        const file = filteredFiles.find(f => f.id === mergePoint.sourceFileId);
                        if (!file) continue;

                        const track = file.tracks[mergePoint.trackIndex];
                        if (!track) continue;

                        const point = track.points[mergePoint.pointIndex];
                        if (point) {
                            pointsToSimplify.push({
                                point,
                                mergePoint
                            });
                        }
                    }

                    if (pointsToSimplify.length >= 2) {
                        // Extract just the points for simplification
                        const points = pointsToSimplify.map(item => item.point);

                        // Apply Douglas-Peucker algorithm
                        const simplifiedPoints = simplifyTrack(points, mergeOptions.simplificationTolerance);

                        // Map simplified points back to MergePoints
                        const simplifiedMergePoints: MergePoint[] = [];
                        const simplifiedIndices = new Set<number>();

                        // First, find indices of points that survived simplification
                        for (let i = 0; i < points.length; i++) {
                            const point = points[i];
                            if (simplifiedPoints.some(p => p.lat === point.lat && p.lon === point.lon)) {
                                simplifiedIndices.add(i);
                            }
                        }

                        // Then get the corresponding MergePoints
                        for (let i = 0; i < pointsToSimplify.length; i++) {
                            if (simplifiedIndices.has(i)) {
                                simplifiedMergePoints.push(pointsToSimplify[i].mergePoint);
                            }
                        }

                        setSelectedPoints(simplifiedMergePoints);

                        // Only show toast if points were actually simplified
                        if (simplifiedMergePoints.length < basePoints.length) {
                            toast.success(`Simplified to ${simplifiedMergePoints.length} points (${Math.round(simplifiedMergePoints.length / basePoints.length * 100)}% of original)`, {
                                id: 'simplification-result' // Use a consistent ID to prevent duplicate toasts
                            });
                        }
                    }
                } else {
                    setSelectedPoints(basePoints);
                }
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [
        createSequentialMerge,
        createTimeMerge,
        mergeMethod,
        mergeOptions.simplificationTolerance,
        mergeOptions.includeElevation,
        mergeOptions.skipDuplicatePoints,
        mergeOptions.fileOrder,
        selectedPoints,
        setSelectedPoints,
        filteredFiles,
    ]);

    const createInterpolatedMerge = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            // Start with a time-based merge
            createTimeMerge();

            if (selectedPoints.length > 0 && mergeOptions.autoSmoothTransitions) {
                // In a real implementation, this would add interpolated points between tracks
                // For this example, we'll just notify the user
                toast.success("Transition points would be smoothed between segments");
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [createTimeMerge, mergeOptions.autoSmoothTransitions, selectedPoints.length]);

    return {
        createSequentialMerge,
        createTimeMerge,
        createSimplifiedMerge,
        createInterpolatedMerge,
        updatePreviewStats,
    };
}
