"use client";

import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CheckSquare, Eye, Trash2, FileX, Edit, RefreshCcw, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { calculateDistance, convert } from "@/lib/gpx-utils";

export function GpxFilesManager() {
    const { storedFiles, setActiveFile, removeStoredFile, gpxData, isLoading, error } = useGpx();
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
    const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

    const handleToggleFile = (fileId: string) => {
        setSelectedFiles((prev) =>
            prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
        );
    };

    const handleSelectAll = () => {
        if (selectedFiles.length === storedFiles.length) {
            // Deselect all
            setSelectedFiles([]);
            return;
        }

        // Select all files that have an id
        const fileIds = storedFiles
            .filter((file) => typeof file.id === "string")
            .map((file) => file.id as string);

        setSelectedFiles(fileIds);
    };

    const handleRemoveFile = (fileId: string) => {
        // Get file name before removing
        const fileName = storedFiles.find((file) => file.id === fileId)?.metadata.name || "File";

        removeStoredFile(fileId);

        // Show success message
        setDeleteSuccess(`"${fileName}" has been removed`);
        setTimeout(() => setDeleteSuccess(null), 3000);

        // Remove from selected files if needed
        if (selectedFiles.includes(fileId)) {
            setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
        }
    };

    const handleDownloadFile = (fileId: string) => {
        const file = storedFiles.find((f) => f.id === fileId);
        if (!file) return;

        // Convert the file to GPX XML
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

        // Show success message
        setDownloadSuccess(`"${file.metadata.name}" has been downloaded`);
        setTimeout(() => setDownloadSuccess(null), 3000);
    };

    const getTrackStatistics = (file: (typeof storedFiles)[0]) => {
        let totalPoints = 0;
        let totalDistance = 0;

        for (const track of file.tracks) {
            totalPoints += track.points.length;

            if (track.points.length > 1) {
                for (let i = 1; i < track.points.length; i++) {
                    const prevPoint = track.points[i - 1];
                    const currentPoint = track.points[i];

                    const distance = calculateDistance(prevPoint, currentPoint);
                    totalDistance += distance;
                }
            }
        }

        return {
            points: totalPoints,
            distance: (totalDistance / 1000).toFixed(2), // Convert to km and format
        };
    };

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Manage GPX Files</CardTitle>
                    <CardDescription>Loading your GPX files...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p>Loading files...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Manage GPX Files</CardTitle>
                    <CardDescription>There was an error loading your files</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{ error }</AlertDescription>
                    </Alert>
                    <div className="mt-6 flex justify-center">
                        <Button variant="secondary" onClick={ () => window.location.reload() }>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reload page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // No files to display
    if (!storedFiles || storedFiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Manage GPX Files</CardTitle>
                    <CardDescription>No GPX files available</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileX className="mb-4 h-16 w-16" />
                        <h3 className="mb-2 font-medium text-lg">No GPX files uploaded yet</h3>
                        <p className="mb-6 max-w-md text-center text-sm">
                            Upload a GPX file to view, edit and manage your outdoor tracks
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage GPX Files</CardTitle>
                <CardDescription>
                    { storedFiles.length } GPX file(s) available for editing and merging
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    { deleteSuccess && (
                        <div className="mb-4 flex items-center rounded-md border border-green-200 bg-green-50 p-3 text-green-600 text-sm">
                            <CheckSquare className="mr-2 h-5 w-5" />
                            <span>{ deleteSuccess }</span>
                        </div>
                    ) }

                    { downloadSuccess && (
                        <div className="mb-4 flex items-center rounded-md border border-green-200 bg-green-50 p-3 text-green-600 text-sm">
                            <Download className="mr-2 h-5 w-5" />
                            <span>{ downloadSuccess }</span>
                        </div>
                    ) }

                    <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={ handleSelectAll }>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            { selectedFiles.length === storedFiles.length ? "Deselect All" : "Select All" }
                        </Button>

                        <Button variant="default" size="sm" disabled={ selectedFiles.length < 2 } asChild>
                            <Link href="/merge">Merge Selected Files ({ selectedFiles.length })</Link>
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]" />
                                    <TableHead>Name</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Distance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                { storedFiles.map((file) => {
                                    if (!file.id) return null;

                                    const isActive = gpxData?.id === file.id;
                                    const stats = getTrackStatistics(file);

                                    return (
                                        <TableRow key={ file.id } className={ isActive ? "bg-accent/30" : "" }>
                                            <TableCell>
                                                <Checkbox
                                                    checked={ selectedFiles.includes(file.id) }
                                                    onCheckedChange={ () => handleToggleFile(file.id || "") }
                                                    aria-label={ `Select ${file.metadata.name}` }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{ file.metadata.name }</div>
                                                <div className="text-muted-foreground text-xs">{ file.fileName }</div>
                                            </TableCell>
                                            <TableCell>{ stats.points } pts</TableCell>
                                            <TableCell>{ stats.distance } km</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={ isActive }
                                                                    onClick={ () => setActiveFile(file.id || "") }
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                { isActive ? "Currently active" : "Set as active" }
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" asChild>
                                                                    <Link href={ `/edit/${file.id}` }>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit file</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ () => handleDownloadFile(file.id || "") }
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Download GPX</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ () => handleRemoveFile(file.id || "") }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Remove file</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) }
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
