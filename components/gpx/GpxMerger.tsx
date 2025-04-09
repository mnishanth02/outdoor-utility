"use client";

import { useGpx, type GpxData, type MergePoint, type MergeConfig } from "@/contexts/GpxContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ChevronLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";

type MergeMethod = "sequential" | "manual" | "byTime";

export function GpxMerger() {
    const { storedFiles, mergeFiles } = useGpx();
    const router = useRouter();
    const [mergeMethod, setMergeMethod] = useState<MergeMethod>("sequential");
    const [selectedPoints, setSelectedPoints] = useState<MergePoint[]>([]);
    const [files, setFiles] = useState<GpxData[]>([]);

    // Initialize files from storedFiles
    useEffect(() => {
        if (storedFiles.length >= 2) {
            setFiles(storedFiles.filter((file) => typeof file.id === "string"));
        } else {
            // Redirect back if not enough files
            toast.error("At least two GPX files are required for merging");
            router.push("/");
        }
    }, [storedFiles, router]);

    // Create initial sequential merge config when files load
    useEffect(() => {
        if (files.length >= 2 && mergeMethod === "sequential") {
            createSequentialMerge();
        }
    }, [files, mergeMethod]);

    const createSequentialMerge = () => {
        const newMergePoints: MergePoint[] = [];

        // Add all points from all files in sequence
        for (const file of files) {
            if (!file.id) continue;

            for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                const track = file.tracks[trackIndex];

                for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                    newMergePoints.push({
                        sourceFileId: file.id,
                        trackIndex,
                        pointIndex,
                    });
                }
            }
        }

        setSelectedPoints(newMergePoints);
    };

    const createTimeMerge = () => {
        const newMergePoints: MergePoint[] = [];
        const allPoints: Array<MergePoint & { time: Date }> = [];

        // Collect all points with timestamps
        for (const file of files) {
            if (!file.id) continue;

            for (let trackIndex = 0; trackIndex < file.tracks.length; trackIndex++) {
                const track = file.tracks[trackIndex];

                for (let pointIndex = 0; pointIndex < track.points.length; pointIndex++) {
                    const point = track.points[pointIndex];

                    if (point.time) {
                        try {
                            const timestamp = new Date(point.time);

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

        // Convert to merge points
        newMergePoints.push(
            ...allPoints.map(({ sourceFileId, trackIndex, pointIndex }) => ({
                sourceFileId,
                trackIndex,
                pointIndex,
            })),
        );

        setSelectedPoints(newMergePoints);

        if (newMergePoints.length === 0) {
            toast.error("None of the selected files have points with timestamps");
        } else {
            toast.success(`Merged ${newMergePoints.length} points by timestamp`);
        }
    };

    const handleMergeMethodChange = (value: string) => {
        const method = value as MergeMethod;
        setMergeMethod(method);

        if (method === "sequential") {
            createSequentialMerge();
        } else if (method === "byTime") {
            createTimeMerge();
        } else {
            // For manual method, start with no points selected
            setSelectedPoints([]);
        }
    };

    const handleMerge = () => {
        if (selectedPoints.length === 0) {
            toast.error("No points selected for merging");
            return;
        }

        const mergeConfig: MergeConfig = {
            sourcePoints: selectedPoints,
        };

        mergeFiles(mergeConfig);
        toast.success("Files merged successfully");
        router.push("/");
    };

    // If no files available yet
    if (files.length < 2) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Merge GPX Files</CardTitle>
                    <CardDescription>Loading available files...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-12">
                    <div className="text-center">
                        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                        <p className="font-medium text-lg">At least two GPX files are required for merging</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Return to GPX Manager</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Merge GPX Files</CardTitle>
                <CardDescription>Select how to merge { files.length } GPX files</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <Tabs
                        defaultValue="sequential"
                        value={ mergeMethod }
                        onValueChange={ handleMergeMethodChange }
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="sequential">Sequential Merge</TabsTrigger>
                            <TabsTrigger value="byTime">Merge by Timestamp</TabsTrigger>
                            <TabsTrigger value="manual">Manual Selection</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sequential">
                            <div className="mt-4 rounded-md border p-4">
                                <h3 className="mb-2 font-medium text-lg">Sequential Merge</h3>
                                <p className="mb-4 text-muted-foreground text-sm">
                                    Files will be merged in sequence, one after the other. All points from the first
                                    file, followed by all points from the second, and so on.
                                </p>
                                <div className="flex space-x-2 rounded bg-muted p-2">
                                    { files.map((file, index) => (
                                        <div key={ file.id } className="flex items-center">
                                            <span className="font-medium text-sm">{ file.metadata.name }</span>
                                            { index < files.length - 1 && (
                                                <ChevronLeft className="mx-1 h-4 w-4 rotate-180 text-muted-foreground" />
                                            ) }
                                        </div>
                                    )) }
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="byTime">
                            <div className="mt-4 rounded-md border p-4">
                                <h3 className="mb-2 font-medium text-lg">Merge by Timestamp</h3>
                                <p className="mb-4 text-muted-foreground text-sm">
                                    Points from all files will be sorted based on their timestamps, resulting in a
                                    chronologically correct sequence. Points without timestamps will be excluded.
                                </p>

                                { selectedPoints.length > 0 ? (
                                    <div className="rounded bg-muted p-2">
                                        <p className="font-medium text-sm">
                                            { selectedPoints.length } points will be merged chronologically
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center rounded bg-yellow-100 p-2 text-yellow-800">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        <p className="text-sm">No points with timestamps found in the selected files</p>
                                    </div>
                                ) }
                            </div>
                        </TabsContent>

                        <TabsContent value="manual">
                            <div className="mt-4 rounded-md border p-4">
                                <h3 className="mb-2 font-medium text-lg">Manual Selection</h3>
                                <p className="mb-4 text-muted-foreground text-sm">
                                    This advanced option lets you manually select which points to include and in what
                                    order. Click on points from each file to build a custom merged track.
                                </p>

                                <div className="space-y-4">
                                    {/* This would be a more complex UI for selecting points manually */ }
                                    <div className="flex items-center rounded bg-yellow-100 p-2 text-yellow-800">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        <p className="text-sm">
                                            Manual selection is not fully implemented in this POC.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="rounded-md border p-4">
                        <h3 className="mb-2 font-medium text-lg">Merge Summary</h3>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            <div className="space-y-4">
                                { files.map((file) => {
                                    // Count how many points are selected from this file
                                    const filePoints = selectedPoints.filter(
                                        (point) => point.sourceFileId === file.id,
                                    );

                                    if (filePoints.length === 0) return null;

                                    return (
                                        <div key={ file.id } className="space-y-2">
                                            <h4 className="font-medium text-sm">
                                                { file.metadata.name } ({ filePoints.length } points)
                                            </h4>
                                            <Separator />
                                        </div>
                                    );
                                }) }

                                { selectedPoints.length === 0 && (
                                    <div className="p-4 text-center text-muted-foreground text-sm italic">
                                        No points selected for merging
                                    </div>
                                ) }
                            </div>
                        </ScrollArea>

                        <div className="mt-4 font-medium text-sm">Total: { selectedPoints.length } points</div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>

                <Button onClick={ handleMerge } disabled={ selectedPoints.length === 0 }>
                    <Save className="mr-2 h-4 w-4" />
                    Merge Files
                </Button>
            </CardFooter>
        </Card>
    );
}
