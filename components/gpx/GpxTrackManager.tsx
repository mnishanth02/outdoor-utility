"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
    CheckSquare,
    Eye,
    Trash2,
    FileX,
    Edit,
    RefreshCcw,
    Download,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    MapPin,
    FileText,
    Clock,
    Ruler,
    Award,
    Merge,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
    convert,
    calculateTotalDistance,
    calculateElevation,
    calculateDuration,
    formatDuration,
    formatDistance,
} from "@/lib/gpx-utils";
import { useRouter } from "next/navigation";
import { GlowEffect } from "@/components/ui/glow-effect";

export function GpxTrackManager() {
    const router = useRouter();
    const {
        storedFiles,
        setActiveFile,
        removeStoredFile,
        gpxData,
        isLoading,
        error,
        selectedFileIds,
        toggleFileSelection,
        setSelectedFileIds,
    } = useGpx();

    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
    const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Check if we have enough files selected for merging
    const hasEnoughFilesForMerge = selectedFileIds.length >= 2;

    const handleToggleFile = (fileId: string) => {
        toggleFileSelection(fileId);
    };

    const handleSelectAll = () => {
        if (selectedFileIds.length === storedFiles.length) {
            // Deselect all
            setSelectedFileIds([]);
            return;
        }

        // Select all files that have an id
        const fileIds = storedFiles
            .filter((file) => typeof file.id === "string")
            .map((file) => file.id as string);

        setSelectedFileIds(fileIds);
    };

    const handleRemoveFile = (fileId: string) => {
        // Get file name before removing
        const fileName = storedFiles.find((file) => file.id === fileId)?.metadata.name || "File";

        removeStoredFile(fileId);

        // Show success message
        setDeleteSuccess(`"${fileName}" has been removed`);
        setTimeout(() => setDeleteSuccess(null), 3000);
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

    const handleMergeSelected = () => {
        if (selectedFileIds.length < 2) {
            return; // Button should be disabled anyway
        }

        // Navigate to merge page
        router.push("/merge");
    };

    const getTrackStatistics = (file: (typeof storedFiles)[0]) => {
        // For simplicity, we'll just use the first track in each file
        const track = file.tracks[0];
        const totalDistance = calculateTotalDistance(track);
        const { gain, loss } = calculateElevation(track);
        const duration = calculateDuration(track);

        return {
            name: file.metadata.name || "Unnamed Track",
            points: track.points.length,
            distance: totalDistance,
            formattedDistance: formatDistance(totalDistance),
            duration: duration,
            formattedDuration: duration ? formatDuration(duration) : "N/A",
            elevationGain: gain ? Math.round(gain) : 0,
            elevationLoss: loss ? Math.round(loss) : 0,
        };
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // Set new field and default to ascending
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <Card className="border-2 shadow-md">
                <CardHeader className="bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        GPX Track Manager
                    </CardTitle>
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
            <Card className="border-2 shadow-md">
                <CardHeader className="bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        GPX Track Manager
                    </CardTitle>
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
            <Card className="border-2 shadow-md">
                <CardHeader className="bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        GPX Track Manager
                    </CardTitle>
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

    // Prepare data for display with sorting
    const tracksWithStats = storedFiles.map((file) => {
        const stats = getTrackStatistics(file);
        const isActive = gpxData?.id === file.id;
        const isSelected = file.id ? selectedFileIds.includes(file.id) : false;

        return {
            id: file.id,
            fileName: file.fileName,
            name: stats.name,
            points: stats.points,
            distance: stats.distance,
            formattedDistance: stats.formattedDistance,
            duration: stats.duration,
            formattedDuration: stats.formattedDuration,
            elevationGain: stats.elevationGain,
            elevationLoss: stats.elevationLoss,
            isActive,
            isSelected,
        };
    });

    // Sort the data
    const sortedTracks = [...tracksWithStats].sort((a, b) => {
        if (sortField === "name") {
            return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }

        if (sortField === "distance") {
            return sortDirection === "asc" ? a.distance - b.distance : b.distance - a.distance;
        }

        if (sortField === "duration") {
            const aDuration = a.duration || 0;
            const bDuration = b.duration || 0;
            return sortDirection === "asc" ? aDuration - bDuration : bDuration - aDuration;
        }

        if (sortField === "points") {
            return sortDirection === "asc" ? a.points - b.points : b.points - a.points;
        }

        if (sortField === "elevation") {
            return sortDirection === "asc"
                ? a.elevationGain - b.elevationGain
                : b.elevationGain - a.elevationGain;
        }

        // Default sort by name
        return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
        return sortDirection === "asc" ? (
            <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4" />
        );
    };

    return (
        <Card className="overflow-hidden border-2 border-muted-foreground/10 shadow-md">
            <CardHeader className="bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-primary" />
                            GPX Track Manager
                        </CardTitle>
                        <CardDescription className="mt-1">
                            <span className="font-medium text-primary">{ storedFiles.length }</span> GPX file(s)
                            available for viewing, editing and merging
                        </CardDescription>
                    </div>

                    <div className="hidden md:flex md:items-center md:gap-2">
                        <Button variant="outline" size="sm" onClick={ handleSelectAll }>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            { selectedFileIds.length === storedFiles.length ? "Deselect All" : "Select All" }
                        </Button>

                        <div className="relative z-10 overflow-visible">
                            { hasEnoughFilesForMerge && (
                                <GlowEffect
                                    colors={ ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"] }
                                    mode="colorShift"
                                    blur="medium"
                                    duration={ 4 }
                                    scale={ 1.03 }
                                    className="z-0 opacity-50"
                                />
                            ) }
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={ !hasEnoughFilesForMerge }
                                onClick={ handleMergeSelected }
                                className="relative z-10 border border-primary/50 hover:bg-primary/5"
                            >
                                <Merge className="mr-2 h-4 w-4" />
                                Merge ({ selectedFileIds.length })
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="space-y-4">
                    { (deleteSuccess || downloadSuccess) && (
                        <div className="px-6 pt-6">
                            { deleteSuccess && (
                                <div className="mb-4 flex items-center rounded-md border-green-100 bg-green-50 p-3 text-green-600 text-sm">
                                    <CheckSquare className="mr-2 h-5 w-5" />
                                    <span>{ deleteSuccess }</span>
                                </div>
                            ) }

                            { downloadSuccess && (
                                <div className="mb-4 flex items-center rounded-md border-green-100 bg-green-50 p-3 text-green-600 text-sm">
                                    <Download className="mr-2 h-5 w-5" />
                                    <span>{ downloadSuccess }</span>
                                </div>
                            ) }
                        </div>
                    ) }

                    <div className="flex items-center justify-between px-6 pt-4 md:hidden">
                        <Button variant="outline" size="sm" onClick={ handleSelectAll }>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            { selectedFileIds.length === storedFiles.length ? "Deselect All" : "Select All" }
                        </Button>

                        <div className="relative z-10 overflow-visible">
                            { hasEnoughFilesForMerge && (
                                <GlowEffect
                                    colors={ ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"] }
                                    mode="colorShift"
                                    blur="medium"
                                    duration={ 4 }
                                    scale={ 1.03 }
                                    className="z-0 opacity-50"
                                />
                            ) }
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={ !hasEnoughFilesForMerge }
                                onClick={ handleMergeSelected }
                                className="relative z-10 border border-primary/50 hover:bg-primary/5"
                            >
                                <Merge className="mr-2 h-4 w-4" />
                                Merge ({ selectedFileIds.length })
                            </Button>
                        </div>
                    </div>

                    <div className="border-t">
                        <Table className="w-full">
                            <TableHeader className="bg-muted/5">
                                <TableRow className="border-b hover:bg-muted/10">
                                    <TableHead className="w-[50px] p-3" />
                                    <TableHead className="p-3">
                                        <div
                                            className="flex cursor-pointer items-center"
                                            onClick={ () => handleSort("name") }
                                        >
                                            <FileText className="mr-1 h-4 w-4 text-muted-foreground" />
                                            Name
                                            <SortIcon field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-3">
                                        <div
                                            className="flex cursor-pointer items-center"
                                            onClick={ () => handleSort("points") }
                                        >
                                            <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                                            Points
                                            <SortIcon field="points" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-3">
                                        <div
                                            className="flex cursor-pointer items-center"
                                            onClick={ () => handleSort("distance") }
                                        >
                                            <Ruler className="mr-1 h-4 w-4 text-muted-foreground" />
                                            Distance
                                            <SortIcon field="distance" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-3">
                                        <div
                                            className="flex cursor-pointer items-center"
                                            onClick={ () => handleSort("duration") }
                                        >
                                            <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                                            Duration
                                            <SortIcon field="duration" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-3">
                                        <div
                                            className="flex cursor-pointer items-center"
                                            onClick={ () => handleSort("elevation") }
                                        >
                                            <Award className="mr-1 h-4 w-4 text-muted-foreground" />
                                            Elevation
                                            <SortIcon field="elevation" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-3 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                { sortedTracks.map((track) => {
                                    if (!track.id) return null;

                                    return (
                                        <TableRow
                                            key={ track.id }
                                            className={ `
                                                ${track.isActive ? "bg-accent/20" : ""}
                                                ${track.isSelected ? "bg-primary/5" : ""}hover:bg-muted/5 cursor-pointer ` }
                                            onClick={ () => handleToggleFile(track.id || "") }
                                        >
                                            <TableCell className="p-3" onClick={ (e) => e.stopPropagation() }>
                                                <Checkbox
                                                    checked={ track.isSelected }
                                                    onCheckedChange={ () => handleToggleFile(track.id || "") }
                                                    aria-label={ `Select ${track.name}` }
                                                    className="border-primary/50"
                                                />
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <div className="font-medium">{ track.name }</div>
                                                <div className="text-muted-foreground text-xs">{ track.fileName }</div>
                                                <div className="mt-1 flex gap-1">
                                                    { track.isActive && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="w-fit bg-accent/20 text-accent-foreground"
                                                        >
                                                            Active
                                                        </Badge>
                                                    ) }
                                                    { track.isSelected && (
                                                        <Badge variant="outline" className="w-fit bg-primary/5 text-primary">
                                                            Selected
                                                        </Badge>
                                                    ) }
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-3">{ track.points }</TableCell>
                                            <TableCell className="p-3">{ track.formattedDistance }</TableCell>
                                            <TableCell className="p-3">{ track.formattedDuration }</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1 text-green-600 text-xs">
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="m18 9-6-6-6 6" />
                                                            <path d="M12 3v18" />
                                                        </svg>
                                                        { track.elevationGain }m
                                                    </span>
                                                    <span className="flex items-center gap-1 text-red-600 text-xs">
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="m6 15 6 6 6-6" />
                                                            <path d="M12 3v18" />
                                                        </svg>
                                                        { track.elevationLoss }m
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-3 text-right" onClick={ (e) => e.stopPropagation() }>
                                                <div className="flex justify-end space-x-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ () => track.id && setActiveFile(track.id) }
                                                                    disabled={ track.isActive }
                                                                    aria-label="View track"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>View track</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" asChild aria-label="Edit track">
                                                                    <Link href={ `/edit/${track.id}` }>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit track</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ (e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadFile(track.id || "");
                                                                    } }
                                                                    aria-label="Download track"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Download track</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ (e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveFile(track.id || "");
                                                                    } }
                                                                    aria-label="Delete track"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete track</p>
                                                            </TooltipContent>
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
