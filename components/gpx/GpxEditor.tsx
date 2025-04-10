"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGpx, type GpxMetadata, type GpxPoint } from "@/contexts/GpxContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Download, Save, ChevronLeft, Edit3, FileX, RefreshCcw, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { convert } from "@/lib/gpx-utils"; // Assume this exists or create it

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

export function GpxEditor({ id }: { id: string }) {
    const router = useRouter();
    const { storedFiles, updateStoredFileMetadata, updateTrackPoints, setActiveFile } = useGpx();
    const [isEditing, setIsEditing] = useState(false);
    const [editableMetadata, setEditableMetadata] = useState<GpxMetadata>({
        name: "",
        description: "",
    });
    const [file, setFile] = useState<(typeof storedFiles)[0] | null>(null);
    const [fileData, setFileData] = useState<(typeof storedFiles)[0] | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"destructive" | "default">("default");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaveSuccess, setIsSaveSuccess] = useState(false);

    // Use useRef to store the latest track points without causing re-renders
    const trackPointsRef = useRef<GpxPoint[]>([]);

    // Load the specific file
    useEffect(() => {
        setIsLoading(true);

        setTimeout(() => {
            const targetFile = storedFiles.find((f) => f.id === id);
            if (targetFile) {
                setFile(targetFile);
                setFileData(targetFile);
                if (targetFile.tracks.length > 0) {
                    trackPointsRef.current = [...targetFile.tracks[0].points];
                }
                setEditableMetadata({
                    name: targetFile.metadata.name || "",
                    description: targetFile.metadata.description || "",
                    time: targetFile.metadata.time,
                });
                setActiveFile(id);
                setAlertMessage(null);
            } else {
                setAlertMessage("File not found. It may have been deleted or is no longer available.");
                setAlertType("destructive");
            }
            setIsLoading(false);
        }, 500); // Small timeout to allow for state to be fully loaded
    }, [id, storedFiles, setActiveFile]);

    // Handle metadata changes
    const handleMetadataChange = (field: keyof GpxMetadata, value: string) => {
        setEditableMetadata((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle track point updates with debounce to reduce immediate updates
    const handlePointsUpdate = useCallback((updatedPoints: GpxPoint[]) => {
        // Store the latest points in the ref without causing a re-render
        trackPointsRef.current = updatedPoints;

        // Only update the file state for UI needs, not the actual data yet
        setFileData(prevFile => {
            if (!prevFile || prevFile.tracks.length === 0) return prevFile;

            const updatedTracks = [...prevFile.tracks];
            const updatedTrack = { ...updatedTracks[0], points: updatedPoints };
            updatedTracks[0] = updatedTrack;

            return { ...prevFile, tracks: updatedTracks };
        });
    }, []);

    // Handle save - this is where we'll actually update the context
    const handleSave = () => {
        if (file?.id) {
            // Update metadata
            updateStoredFileMetadata(file.id, editableMetadata);

            // Update track points from our ref if they've changed
            if (file.tracks.length > 0 && trackPointsRef.current.length > 0) {
                updateTrackPoints(0, trackPointsRef.current);
            }

            setIsSaveSuccess(true);
            setAlertMessage("Changes saved successfully");
            setTimeout(() => {
                setAlertMessage(null);
                setIsSaveSuccess(false);
            }, 3000);
        }
    };

    // Handle download
    const handleDownload = () => {
        if (!file) return;

        // Convert the current state to GPX XML
        const gpxContent = convert(file);

        // Create a blob and download it
        const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${file.metadata.name || "track"}.gpx`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>GPX Editor</CardTitle>
                    <CardDescription>Loading your GPX file...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p>Loading file data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!file) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>GPX Editor</CardTitle>
                    <CardDescription>Edit your GPX file</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>File Not Found</AlertTitle>
                        <AlertDescription>
                            { alertMessage || "File not found. Please select a valid GPX file." }
                        </AlertDescription>
                    </Alert>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <FileX className="mb-4 h-16 w-16" />
                        <h3 className="mb-2 font-medium text-lg">The requested GPX file could not be loaded</h3>
                        <p className="mb-6 max-w-md text-center text-sm">
                            The file may have been deleted or is no longer available in your storage. Try
                            returning to the home page and uploading the file again.
                        </p>
                    </div>
                    <div className="mt-4">
                        <Button variant="default" onClick={ () => router.push("/") } className="mt-4">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Edit GPX File</CardTitle>
                    <CardDescription>Make changes to your GPX file metadata and tracks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    { isSaveSuccess && (
                        <div className="flex items-center rounded-md border border-green-200 bg-green-50 p-3 text-green-600 text-sm">
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            <span>{ alertMessage }</span>
                        </div>
                    ) }

                    { alertMessage && !isSaveSuccess && (
                        <Alert className="mb-4" variant={ alertType }>
                            { alertType === "destructive" && <AlertTitle>Error</AlertTitle> }
                            <AlertDescription>{ alertMessage }</AlertDescription>
                        </Alert>
                    ) }

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Track Name</Label>
                            <Input
                                id="name"
                                value={ editableMetadata.name }
                                onChange={ (e) => handleMetadataChange("name", e.target.value) }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={ editableMetadata.description || "" }
                                onChange={ (e) => handleMetadataChange("description", e.target.value) }
                                rows={ 3 }
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={ () => router.push("/") }>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={ handleDownload }>
                            <Download className="mr-2 h-4 w-4" />
                            Download GPX
                        </Button>
                        <Button onClick={ handleSave }>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Interactive Map { isEditing ? "- Edit Mode" : "" }</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={ () => setIsEditing(!isEditing) }
                            className={ isEditing ? "bg-blue-100" : "" }
                        >
                            <Edit3 className="mr-1 h-4 w-4" />
                            { isEditing ? "Editing" : "Edit Route" }
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        { isEditing
                            ? "Drag points to reposition them, select a point to add or delete points"
                            : "View your GPX track on the map" }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    { fileData?.tracks?.[0]?.points ? (
                        <MapWithNoSSR
                            points={ fileData.tracks[0].points }
                            height="600px"
                            isEditing={ isEditing }
                            onPointsChange={ handlePointsUpdate }
                        />
                    ) : (
                        <div className="flex h-[600px] flex-col items-center justify-center rounded-md bg-gray-100">
                            <FileX className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="font-medium text-lg">No track data available</h3>
                            <p className="mt-1 text-muted-foreground text-sm">
                                This GPX file doesn't contain any track information
                            </p>
                        </div>
                    ) }
                </CardContent>
            </Card>
        </div>
    );
}
