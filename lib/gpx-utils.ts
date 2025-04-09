import type { GpxPoint, GpxTrack } from "@/contexts/GpxContext";

/**
 * Calculate the distance between two GPS points using the Haversine formula.
 * This calculates the great-circle distance between two points on a sphere.
 */
export function calculateDistance(p1: GpxPoint, p2: GpxPoint): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

/**
 * Calculate the total distance of a track in meters
 */
export function calculateTotalDistance(track: GpxTrack): number {
    const points = track.points;
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
        totalDistance += calculateDistance(points[i - 1], points[i]);
    }

    return totalDistance;
}

/**
 * Calculate the elevation gain and loss from an array of track points
 */
export function calculateElevation(track: GpxTrack): { gain: number; loss: number } {
    const points = track.points;
    let gain = 0;
    let loss = 0;

    if (points.length < 2) return { gain, loss };

    for (let i = 1; i < points.length; i++) {
        const current = points[i].ele;
        const previous = points[i - 1].ele;

        if (current === undefined || previous === undefined) continue;

        const diff = current - previous;
        if (diff > 0) {
            gain += diff;
        } else {
            loss += Math.abs(diff);
        }
    }

    return { gain, loss };
}

/**
 * Calculate track duration if timestamps are available
 * Returns duration in seconds or null if timestamps are not available
 */
export function calculateDuration(track: GpxTrack): number | null {
    const points = track.points;
    if (points.length < 2) return null;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (!firstPoint.time || !lastPoint.time) return null;

    const startTime = new Date(firstPoint.time).getTime();
    const endTime = new Date(lastPoint.time).getTime();

    // Return duration in seconds
    return (endTime - startTime) / 1000;
}

/**
 * Format a duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
    if (seconds === null || Number.isNaN(seconds)) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a distance in meters to a human-readable string
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Calculate the center point of a track
 */
export function calculateCenter(points: GpxPoint[]): { lat: number; lon: number } {
    if (points.length === 0) {
        return { lat: 0, lon: 0 };
    }

    let sumLat = 0;
    let sumLon = 0;

    for (const point of points) {
        sumLat += point.lat;
        sumLon += point.lon;
    }

    return {
        lat: sumLat / points.length,
        lon: sumLon / points.length,
    };
}
