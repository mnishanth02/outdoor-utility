import type { GpxPoint, GpxTrack } from "@/contexts/GpxContext";

/**
 * Calculate the distance between two GPS points using the Haversine formula.
 * This calculates the great-circle distance between two points on a sphere.
 *
 * @param p1 First GPS point
 * @param p2 Second GPS point
 * @returns Distance in meters
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
 *
 * @param track GPX track
 * @returns Total distance in meters
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
 * Calculate the elevation gain and loss from a GPX track
 *
 * @param track GPX track or array of elevation values
 * @returns Object with gain and loss values in meters
 */
export function calculateElevation(trackOrElevations: GpxTrack | number[]): { gain: number; loss: number } {
    let gain = 0;
    let loss = 0;

    // Handle different input types
    const elevations = Array.isArray(trackOrElevations)
        ? trackOrElevations
        : trackOrElevations.points
            .map(point => point.ele)
            .filter((ele): ele is number => ele !== undefined);

    if (elevations.length < 2) {
        return { gain, loss };
    }

    for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
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
 *
 * @param track GPX track
 * @returns Duration in seconds or null if timestamps are not available
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
 *
 * @param seconds Duration in seconds
 * @param detailed If true, returns detailed format (HH:MM:SS), otherwise returns simplified format (2h 30m)
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, detailed = false): string {
    if (seconds === null || Number.isNaN(seconds)) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (detailed) {
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

/**
 * Format a distance in meters to a human-readable string
 *
 * @param meters Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(
    distance: number | GpxPoint | number,
    lon1?: number,
    lat2?: number,
    lon2?: number,
    rawNumber = false
): string | number {
    let meters: number;

    // Handle different input types
    if (typeof distance === 'object') {
        // Called with two GpxPoints
        if (typeof lon1 === 'object') {
            meters = calculateDistance(distance, lon1);
        } else {
            throw new Error('Invalid parameters for formatDistance');
        }
    } else if (typeof lat2 === 'number' && typeof lon1 === 'number' && typeof lon2 === 'number') {
        // Called with coordinates
        const lat1 = distance as number;

        // Convert latitude and longitude from degrees to radians
        const radLat1 = (lat1 * Math.PI) / 180;
        const radLon1 = (lon1 * Math.PI) / 180;
        const radLat2 = (lat2 * Math.PI) / 180;
        const radLon2 = (lon2 * Math.PI) / 180;

        // Haversine formula
        const R = 6371000; // Earth's radius in meters
        const dLat = radLat2 - radLat1;
        const dLon = radLon2 - radLon1;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        meters = R * c;

        // If raw number requested in kilometers
        if (rawNumber) {
            return meters / 1000;
        }
    } else {
        // Called with a distance in meters
        meters = distance as number;
    }

    // Format the distance string
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Calculate the center point of a track
 *
 * @param points Array of GpxPoints
 * @returns Center point {lat, lon}
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

/**
 * Formats an elevation value to a human-readable format
 *
 * @param elevation Elevation in meters
 * @returns Formatted elevation string
 */
export function formatElevation(elevation: number): string {
    return `${elevation.toFixed(0)} m`;
}
