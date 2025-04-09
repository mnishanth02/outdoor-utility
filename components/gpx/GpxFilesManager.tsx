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
import { CheckSquare, Eye, Trash2, FileX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { calculateDistance } from "@/lib/gpx-utils";

export function GpxFilesManager() {
    const { storedFiles, setActiveFile, removeStoredFile, gpxData } = useGpx();
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    // No files to display
    if (!storedFiles || storedFiles.length === 0) {
        return null;
    }

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
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={ () => removeStoredFile(file.id || "") }
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

                                { storedFiles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={ 5 } className="py-6 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <FileX className="mb-2 h-8 w-8" />
                                                <p>No GPX files uploaded yet</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) }
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
