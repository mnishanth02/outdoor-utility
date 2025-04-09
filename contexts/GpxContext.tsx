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
    id?: string; // Unique identifier for stored files
    fileName?: string; // Original filename
};

export type MergePoint = {
    sourceFileId: string;
    trackIndex: number;
    pointIndex: number;
};

export type MergeConfig = {
    sourcePoints: MergePoint[];
};

// Context type
type GpxContextType = {
    gpxData: GpxData | null;
    storedFiles: GpxData[];
    isLoading: boolean;
    error: string | null;
    loadGpxFromFile: (content: string, fileName: string) => Promise<void>;
    loadGpxFilesToStore: (contents: { content: string; fileName: string }[]) => Promise<void>;
    updateMetadata: (metadata: Partial<GpxMetadata>) => void;
    deleteTrackPoints: (trackIndex: number, pointIndices: number[]) => void;
    clearGpxData: () => void;
    removeStoredFile: (fileId: string) => void;
    setActiveFile: (fileId: string) => void;
    mergeFiles: (mergeConfig: MergeConfig) => void;
    updateStoredFileMetadata: (fileId: string, metadata: Partial<GpxMetadata>) => void;
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

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Provider component
export function GpxProvider({ children }: { children: ReactNode }) {
    const [gpxData, setGpxData] = useState<GpxData | null>(null);
    const [storedFiles, setStoredFiles] = useState<GpxData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Parse GPX XML to structured data
    const parseGpxXml = async (xml: string, fileName?: string): Promise<GpxData> => {
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
                        id: generateId(),
                        fileName
                    });
                } catch {
                    reject(new Error("Failed to parse GPX data"));
                }
            });
        });
    };

    // Load GPX from file content to active data
    const loadGpxFromFile = async (content: string, fileName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const parsedData = await parseGpxXml(content, fileName);

            // If no name is provided in the file, use the filename
            if (!parsedData.metadata.name) {
                parsedData.metadata.name = fileName.replace(/\.gpx$/i, "");
            }

            setGpxData(parsedData);

            // Also add to stored files if not already there
            setStoredFiles(prev => {
                if (!prev.some(file => file.fileName === fileName)) {
                    return [...prev, parsedData];
                }
                return prev;
            });
        } catch (err) {
            console.error("Error parsing GPX file:", err);
            setError("Failed to parse GPX file. The file may be corrupted or in an unsupported format.");
            setGpxData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Load multiple GPX files into storage only (not active)
    const loadGpxFilesToStore = async (files: { content: string; fileName: string }[]) => {
        setIsLoading(true);
        setError(null);

        try {
            const parsedFiles = await Promise.all(
                files.map(async file => {
                    try {
                        const parsed = await parseGpxXml(file.content, file.fileName);

                        // If no name is provided, use the filename
                        if (!parsed.metadata.name) {
                            parsed.metadata.name = file.fileName.replace(/\.gpx$/i, "");
                        }

                        return parsed;
                    } catch (err) {
                        console.error(`Error parsing GPX file ${file.fileName}:`, err);
                        return null;
                    }
                })
            );

            // Filter out any files that failed to parse
            const validFiles = parsedFiles.filter(file => file !== null) as GpxData[];

            setStoredFiles(prev => {
                // Combine existing and new files, preventing duplicates by filename
                const existingFileNames = new Set(prev.map(file => file.fileName));
                const newFiles = validFiles.filter(file => !existingFileNames.has(file.fileName));
                return [...prev, ...newFiles];
            });

            // If no active file and we have valid files, set the first one as active
            if (!gpxData && validFiles.length > 0) {
                setGpxData(validFiles[0]);
            }
        } catch (err) {
            console.error("Error loading GPX files:", err);
            setError("Failed to load some GPX files. They may be corrupted or in an unsupported format.");
        } finally {
            setIsLoading(false);
        }
    };

    // Update metadata for active file
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

        // Also update in stored files
        if (gpxData.id) {
            updateStoredFileMetadata(gpxData.id, metadata);
        }
    };

    // Update metadata for a stored file
    const updateStoredFileMetadata = (fileId: string, metadata: Partial<GpxMetadata>) => {
        setStoredFiles(prev =>
            prev.map(file =>
                file.id === fileId
                    ? {
                        ...file,
                        metadata: {
                            ...file.metadata,
                            ...metadata
                        },
                        rawXml: undefined
                    }
                    : file
            )
        );
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

        // Also update in stored files
        if (gpxData.id) {
            setStoredFiles(prev =>
                prev.map(file => {
                    if (file.id !== gpxData?.id) return file;

                    const updatedTracks = [...file.tracks];
                    if (!updatedTracks[trackIndex]) return file;

                    const track = { ...updatedTracks[trackIndex] };
                    const points = [...track.points];

                    for (const index of sortedIndices) {
                        if (index >= 0 && index < points.length) {
                            points.splice(index, 1);
                        }
                    }

                    track.points = points;
                    updatedTracks[trackIndex] = track;

                    return {
                        ...file,
                        tracks: updatedTracks,
                        rawXml: undefined
                    };
                })
            );
        }
    };

    // Clear active GPX data
    const clearGpxData = () => {
        setGpxData(null);
        setError(null);
    };

    // Remove a file from stored files
    const removeStoredFile = (fileId: string) => {
        setStoredFiles(prev => prev.filter(file => file.id !== fileId));

        // If the active file is being removed, clear it
        if (gpxData?.id === fileId) {
            clearGpxData();
        }
    };

    // Set a stored file as the active file
    const setActiveFile = (fileId: string) => {
        const fileToActivate = storedFiles.find(file => file.id === fileId);
        if (fileToActivate) {
            setGpxData(fileToActivate);
        }
    };

    // Merge files based on merge configuration
    const mergeFiles = (mergeConfig: MergeConfig) => {
        if (!mergeConfig.sourcePoints || mergeConfig.sourcePoints.length === 0) return;

        // Create a new track with the merged points
        const mergedPoints: GpxPoint[] = [];
        const sourceFileIds = new Set<string>();

        // Process each source point in the merge config
        for (const sourcePoint of mergeConfig.sourcePoints) {
            const sourceFile = storedFiles.find(file => file.id === sourcePoint.sourceFileId);
            if (!sourceFile) continue;

            sourceFileIds.add(sourcePoint.sourceFileId);

            const track = sourceFile.tracks[sourcePoint.trackIndex];
            if (!track) continue;

            const point = track.points[sourcePoint.pointIndex];
            if (point) {
                mergedPoints.push({ ...point });
            }
        }

        if (mergedPoints.length === 0) return;

        // Create a merged file name from the source files
        const sourceFiles = storedFiles.filter(file => sourceFileIds.has(file.id ?? ''));
        const mergedName = sourceFiles.map(file => file.metadata.name).join(' + ');

        // Create a new GPX data object with the merged track
        const mergedGpx: GpxData = {
            metadata: {
                name: `Merged: ${mergedName}`,
                description: `Merged from ${sourceFiles.length} files`,
                time: new Date().toISOString()
            },
            tracks: [{
                name: "Merged Track",
                points: mergedPoints
            }],
            id: generateId(),
            fileName: `merged_${Date.now()}.gpx`
        };

        // Set as active file and add to stored files
        setGpxData(mergedGpx);
        setStoredFiles(prev => [...prev, mergedGpx]);
    };

    return (
        <GpxContext.Provider
            value={ {
                gpxData,
                storedFiles,
                isLoading,
                error,
                loadGpxFromFile,
                loadGpxFilesToStore,
                updateMetadata,
                deleteTrackPoints,
                clearGpxData,
                removeStoredFile,
                setActiveFile,
                mergeFiles,
                updateStoredFileMetadata
            } }
        >
            { children }
        </GpxContext.Provider>
    );
}
