"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { parseString } from "xml2js";

// Types for GPX data
export type GpxPoint = {
    lat: number;
    lon: number;
    ele?: number;
    time?: string;
};

export type GpxTrack = {
    name?: string;
    points: GpxPoint[];
};

export type GpxMetadata = {
    name?: string;
    description?: string;
    time?: string;
};

export type GpxData = {
    metadata: GpxMetadata;
    tracks: GpxTrack[];
    rawXml?: string;
};

// Context type
type GpxContextType = {
    gpxData: GpxData | null;
    isLoading: boolean;
    error: string | null;
    loadGpxFromFile: (content: string, fileName: string) => Promise<void>;
    updateMetadata: (metadata: Partial<GpxMetadata>) => void;
    deleteTrackPoints: (trackIndex: number, pointIndices: number[]) => void;
    clearGpxData: () => void;
};

// Create context
const GpxContext = createContext<GpxContextType | null>(null);

// Hook to use the context
export const useGpx = () => {
    const context = useContext(GpxContext);
    if (!context) {
        throw new Error("useGpx must be used within a GpxProvider");
    }
    return context;
};

// Provider component
export function GpxProvider({ children }: { children: ReactNode }) {
    const [gpxData, setGpxData] = useState<GpxData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Parse GPX XML to structured data
    const parseGpxXml = async (xml: string): Promise<GpxData> => {
        return new Promise((resolve, reject) => {
            parseString(xml, { explicitArray: false }, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const gpxResult = result.gpx;

                    // Extract metadata
                    const metadata: GpxMetadata = {
                        name: gpxResult.metadata?.name || gpxResult.name || "",
                        description: gpxResult.metadata?.desc || gpxResult.desc || "",
                        time: gpxResult.metadata?.time || "",
                    };

                    // Extract tracks
                    let tracks: GpxTrack[] = [];

                    if (gpxResult.trk) {
                        // Handle single track or array of tracks
                        const trks = Array.isArray(gpxResult.trk) ? gpxResult.trk : [gpxResult.trk];

                        tracks = trks.map((trk: { name?: string; trkseg?: { trkpt?: unknown }[] | { trkpt?: unknown } }) => {
                            const name = trk.name || "";
                            const points: GpxPoint[] = [];

                            // Handle track segments
                            if (trk.trkseg) {
                                const trksegs = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];

                                for (const seg of trksegs) {
                                    if (seg.trkpt) {
                                        const trkpts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

                                        points.push(
                                            ...trkpts.map((pt: { $: { lat: string; lon: string }; ele?: string; time?: string }) => ({
                                                lat: Number.parseFloat(pt.$.lat),
                                                lon: Number.parseFloat(pt.$.lon),
                                                ele: pt.ele ? Number.parseFloat(pt.ele) : undefined,
                                                time: pt.time || undefined,
                                            })),
                                        );
                                    }
                                }
                            }

                            return { name, points };
                        });
                    }

                    resolve({
                        metadata,
                        tracks,
                        rawXml: xml,
                    });
                } catch {
                    reject(new Error("Failed to parse GPX data"));
                }
            });
        });
    };

    // Load GPX from file content
    const loadGpxFromFile = async (content: string, fileName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const parsedData = await parseGpxXml(content);

            // If no name is provided in the file, use the filename
            if (!parsedData.metadata.name) {
                parsedData.metadata.name = fileName.replace(/\.gpx$/i, "");
            }

            setGpxData(parsedData);
        } catch (err) {
            console.error("Error parsing GPX file:", err);
            setError("Failed to parse GPX file. The file may be corrupted or in an unsupported format.");
            setGpxData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Update metadata
    const updateMetadata = (metadata: Partial<GpxMetadata>) => {
        if (!gpxData) return;

        setGpxData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                metadata: {
                    ...prev.metadata,
                    ...metadata,
                },
                // When we update metadata, the raw XML is no longer valid
                rawXml: undefined,
            };
        });
    };

    // Delete track points
    const deleteTrackPoints = (trackIndex: number, pointIndices: number[]) => {
        if (!gpxData || !gpxData.tracks[trackIndex]) return;

        const sortedIndices = [...pointIndices].sort((a, b) => b - a); // Sort in descending order

        setGpxData((prev) => {
            if (!prev) return prev;

            const updatedTracks = [...prev.tracks];
            const track = { ...updatedTracks[trackIndex] };
            const points = [...track.points];

            // Remove points in descending order to avoid index shifting
            for (const index of sortedIndices) {
                if (index >= 0 && index < points.length) {
                    points.splice(index, 1);
                }
            }

            track.points = points;
            updatedTracks[trackIndex] = track;

            return {
                ...prev,
                tracks: updatedTracks,
                // When we modify the track, the raw XML is no longer valid
                rawXml: undefined,
            };
        });
    };

    // Clear GPX data
    const clearGpxData = () => {
        setGpxData(null);
        setError(null);
    };

    return (
        <GpxContext.Provider
            value={ {
                gpxData,
                isLoading,
                error,
                loadGpxFromFile,
                updateMetadata,
                deleteTrackPoints,
                clearGpxData,
            } }
        >
            { children }
        </GpxContext.Provider>
    );
}
