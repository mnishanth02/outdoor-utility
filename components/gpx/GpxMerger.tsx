"use client";

import {
    useGpx,
    type GpxData,
    type MergePoint,
    type MergeConfig,
    type GpxPoint,
} from "@/contexts/GpxContext";
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
import { toast } from "sonner";
import { ChevronLeft, Save, AlertTriangle, RotateCcw, Download } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useMergeStrategies } from "./merge-strategies/useMergeStrategies";
import { FileListItem } from "./merge-components/FileListItem";
import { MergePreview } from "./merge-components/MergePreview";
import { AdvancedOptions } from "./merge-components/AdvancedOptions";
import { convert } from "@/lib/gpx-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type MergeMethod = "sequential" | "byTime" | "interpolated" | "simplified";

export type MergeOptions = {
    preserveOriginalFiles: boolean | undefined;
    outputFormat: string | undefined;
    autoSmoothTransitions: boolean;
    skipDuplicatePoints: boolean;
    simplificationTolerance: number;
    includeElevation: boolean;
    timeGapThreshold: number; // in minutes
    fileOrder: string[];
};

export type PreviewStats = {
    totalPointsOriginal: number;
    totalPointsAfterMerge: number;
    estimatedFileSize: string;
    duplicatePointsRemoved: number;
};

export function GpxMerger() {
    const { storedFiles, mergeFiles, selectedFileIds } = useGpx();
    const router = useRouter();
    const [mergeMethod, setMergeMethod] = useState<MergeMethod>("sequential");
    const [selectedPoints, setSelectedPoints] = useState<MergePoint[]>([]);
    const [files, setFiles] = useState<GpxData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<GpxData[]>([]);
    const [fileSelections, setFileSelections] = useState<Record<string, boolean>>({});
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
        autoSmoothTransitions: true,
        preserveOriginalFiles: false,
        outputFormat: "single-track",
        skipDuplicatePoints: true,
        simplificationTolerance: 10, // meters
        includeElevation: true,
        timeGapThreshold: 30, // minutes
        fileOrder: [],
    });
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [previewStats, setPreviewStats] = useState<PreviewStats>({
        totalPointsOriginal: 0,
        totalPointsAfterMerge: 0,
        estimatedFileSize: "0 KB",
        duplicatePointsRemoved: 0,
    });

    // Get merge strategies from custom hook
    const {
        createSequentialMerge,
        createTimeMerge,
        createSimplifiedMerge,
        createInterpolatedMerge,
        updatePreviewStats,
    } = useMergeStrategies({
        filteredFiles,
        setSelectedPoints,
        mergeOptions,
        selectedPoints,
        setPreviewStats,
        mergeMethod,
    });

    // Initialize files from storedFiles
    useEffect(() => {
        if (storedFiles.length >= 2) {
            // Get only the files that are selected based on selectedFileIds
            const validFiles = storedFiles.filter(
                (file) => typeof file.id === "string" && selectedFileIds.includes(file.id),
            );

            if (validFiles.length < 2) {
                // If somehow we don't have enough selected files, use all available files
                const allValidFiles = storedFiles.filter((file) => typeof file.id === "string");
                setFiles(allValidFiles);
                setFilteredFiles(allValidFiles);

                // Initialize file selections for all files
                const selections: Record<string, boolean> = {};
                const order: string[] = [];
                for (const file of allValidFiles) {
                    if (file.id) {
                        selections[file.id] = true;
                        order.push(file.id);
                    }
                }
                setFileSelections(selections);
                setMergeOptions((prev) => ({ ...prev, fileOrder: order }));
            } else {
                // Use the selected files
                setFiles(validFiles);
                setFilteredFiles(validFiles);

                // Initialize file selections and order for selected files
                const selections: Record<string, boolean> = {};
                const order: string[] = [];
                for (const file of validFiles) {
                    if (file.id) {
                        selections[file.id] = true;
                        order.push(file.id);
                    }
                }
                setFileSelections(selections);
                setMergeOptions((prev) => ({ ...prev, fileOrder: order }));
            }
        } else {
            // Redirect back if not enough files
            toast.error("At least two GPX files are required for merging");
            router.push("/");
        }
    }, [storedFiles, router, selectedFileIds]);

    // Update filtered files when selections change
    useEffect(() => {
        const filtered = files.filter((file) => file.id && fileSelections[file.id]);
        setFilteredFiles(filtered);

        // Clear any previous selection error
        setSelectionError(null);

        // Show error if less than 2 files are selected
        if (filtered.length < 2 && files.length >= 2) {
            setSelectionError("Please select at least two files to merge");
        }
    }, [files, fileSelections]);

    // Sort filtered files according to fileOrder whenever order changes
    useEffect(() => {
        if (filteredFiles.length < 2) return;

        // Create a copy of the filtered files sorted according to the fileOrder
        const sortedFiles = [...filteredFiles].sort((a, b) => {
            if (a.id && b.id) {
                const indexA = mergeOptions.fileOrder.indexOf(a.id);
                const indexB = mergeOptions.fileOrder.indexOf(b.id);
                return indexA - indexB;
            }
            return 0;
        });

        // Only update if the order has actually changed
        if (
            JSON.stringify(sortedFiles.map((f) => f.id)) !==
            JSON.stringify(filteredFiles.map((f) => f.id))
        ) {
            setFilteredFiles(sortedFiles);
        }
    }, [mergeOptions.fileOrder, filteredFiles.length]);

    // Create initial merge config when files or options change
    useEffect(() => {
        if (filteredFiles.length < 2) return;

        // Use a timeout to prevent immediate state updates
        const timeoutId = setTimeout(() => {
            switch (mergeMethod) {
                case "sequential":
                    createSequentialMerge();
                    break;
                case "byTime":
                    createTimeMerge();
                    break;
                case "simplified":
                    createSimplifiedMerge();
                    break;
                case "interpolated":
                    createInterpolatedMerge();
                    break;
            }
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [
        filteredFiles,
        mergeMethod,
        mergeOptions.skipDuplicatePoints,
        mergeOptions.timeGapThreshold,
        mergeOptions.simplificationTolerance,
        mergeOptions.includeElevation,
        createSequentialMerge,
        createTimeMerge,
        createSimplifiedMerge,
        createInterpolatedMerge,
    ]);

    // Update preview stats when points change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updatePreviewStats();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [selectedPoints, updatePreviewStats]);

    // Previous move functions are replaced with these dummy functions
    // that maintain compatibility but don't do anything
    const moveFileUp = () => {
        // Function intentionally left empty as we removed the UI for it
    };

    const moveFileDown = () => {
        // Function intentionally left empty as we removed the UI for it
    };

    const toggleFileSelection = (fileId: string, checked: boolean) => {
        // Create a new selection state with the toggled file
        const newSelections = { ...fileSelections, [fileId]: checked };

        // Count how many files will be selected after this change
        const selectedCount = Object.values(newSelections).filter(Boolean).length;

        // Prevent deselecting if it would leave less than 2 files selected
        if (!checked && selectedCount < 2) {
            toast.error("You must keep at least two files selected for merging");
            return;
        }

        // Apply the selection state change
        setFileSelections(newSelections);

        // If adding a new file, also update the order
        if (checked && !fileSelections[fileId]) {
            // Add the newly selected file to the end of the order
            const newOrder = [...mergeOptions.fileOrder.filter(id => id !== fileId), fileId];
            setMergeOptions(prev => ({ ...prev, fileOrder: newOrder }));
        }
    };

    const handleMergeMethodChange = (value: string) => {
        setMergeMethod(value as MergeMethod);
    };

    const handleMergeOptionChange = <K extends keyof MergeOptions>(
        key: K,
        value: MergeOptions[K],
    ) => {
        setMergeOptions((prev) => ({ ...prev, [key]: value }));
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

    const handleDownload = () => {
        if (selectedPoints.length === 0) {
            toast.error("No points selected for downloading");
            return;
        }

        // Create a new GpxData object with the merged points
        const mergedData: GpxData = {
            metadata: {
                name: "Merged Track",
                description: `Merged from ${filteredFiles.length} files using ${mergeMethod} method`,
                time: new Date().toISOString(),
            },
            tracks: [
                {
                    name: "Merged Track",
                    points: selectedPoints
                        .map((point) => {
                            const sourceFile = filteredFiles.find((f) => f.id === point.sourceFileId);
                            if (!sourceFile || !sourceFile.tracks[point.trackIndex]) return null;
                            return sourceFile.tracks[point.trackIndex].points[point.pointIndex];
                        })
                        .filter((p): p is GpxPoint => p !== null),
                },
            ],
        };

        // Convert the merged data to GPX XML
        const gpxContent = convert(mergedData);

        // Create a blob and download it
        const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `merged_track_${new Date().toISOString().split("T")[0]}.gpx`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("GPX file downloaded successfully");
    };

    const resetOptions = () => {
        setMergeOptions({
            ...mergeOptions,
            skipDuplicatePoints: true,
            simplificationTolerance: 10,
            includeElevation: true,
            timeGapThreshold: 30,
        });
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

            {/* Top Action Bar */ }
            <div className="flex items-center justify-between border-y bg-muted/50 px-6 py-3">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={ () => router.push("/") }>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Files
                    </Button>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={ handleDownload }
                        disabled={ selectedPoints.length === 0 || filteredFiles.length < 2 }
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download GPX
                    </Button>
                    <Button
                        onClick={ handleMerge }
                        disabled={ selectedPoints.length === 0 || filteredFiles.length < 2 }
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Merge Files
                    </Button>
                </div>
            </div>

            <CardContent className="pt-6">
                <div className="space-y-6">
                    {/* Merge Overview/Preview */ }
                    <MergePreview
                        stats={ previewStats }
                        filteredFiles={ filteredFiles }
                        selectedPoints={ selectedPoints }
                    />

                    {/* Merge Method Selection */ }
                    <div className="rounded-md border">
                        <div className="border-b bg-background px-4 py-3">
                            <h3 className="font-medium text-lg">Merge Method</h3>
                            <p className="text-muted-foreground text-sm">
                                Select how you want to combine your GPX data
                            </p>
                        </div>

                        <div className="p-4">
                            <Tabs
                                defaultValue="sequential"
                                value={ mergeMethod }
                                onValueChange={ handleMergeMethodChange }
                            >
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="sequential">Sequential</TabsTrigger>
                                    <TabsTrigger value="byTime">By Time</TabsTrigger>
                                    <TabsTrigger value="simplified">Simplified</TabsTrigger>
                                    <TabsTrigger value="interpolated">Interpolated</TabsTrigger>
                                </TabsList>

                                <TabsContent value="sequential">
                                    <div className="mt-4 rounded-md border p-4">
                                        <h3 className="mb-2 font-medium text-lg">Sequential Merge</h3>
                                        <p className="mb-4 text-muted-foreground text-sm">
                                            <strong>Best for:</strong> Combining tracks in a specific order.
                                            <br />
                                            <strong>How it works:</strong> Files are merged in the order shown above - all
                                            points from the first file, followed by all points from the second, and so on.
                                            Use this when you want complete control over the track order.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="skipDuplicatePoints"
                                                    checked={ mergeOptions.skipDuplicatePoints }
                                                    onCheckedChange={ (checked) =>
                                                        handleMergeOptionChange("skipDuplicatePoints", checked)
                                                    }
                                                />
                                                <Label htmlFor="skipDuplicatePoints">Remove duplicate points</Label>
                                                <p className="ml-2 text-muted-foreground text-xs">
                                                    (Recommended) Removes points that are at the exact same location
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="byTime">
                                    <div className="mt-4 rounded-md border p-4">
                                        <h3 className="mb-2 font-medium text-lg">Time-Based Merge</h3>
                                        <p className="mb-4 text-muted-foreground text-sm">
                                            <strong>Best for:</strong> Chronological track merging.
                                            <br />
                                            <strong>How it works:</strong> Merges all points from all files based on their
                                            timestamps. Only works with GPX files that contain time data. Points will be
                                            ordered by time regardless of which file they came from.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="skipDuplicatePoints"
                                                    checked={ mergeOptions.skipDuplicatePoints }
                                                    onCheckedChange={ (checked) =>
                                                        handleMergeOptionChange("skipDuplicatePoints", checked)
                                                    }
                                                />
                                                <Label htmlFor="skipDuplicatePoints">Remove duplicate points</Label>
                                                <p className="ml-2 text-muted-foreground text-xs">
                                                    (Recommended) Removes points that are at the exact same location
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="simplified">
                                    <div className="mt-4 rounded-md border p-4">
                                        <h3 className="mb-2 font-medium text-lg">Simplified Merge</h3>
                                        <p className="mb-4 text-muted-foreground text-sm">
                                            <strong>Best for:</strong> Reducing file size while preserving track shape.
                                            <br />
                                            <strong>How it works:</strong> First merges files (by time if elevation data
                                            is included, sequentially otherwise), then reduces the number of points while
                                            maintaining the track's shape. Higher tolerance means fewer points but less
                                            precision.
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="skipDuplicatePoints"
                                                    checked={ mergeOptions.skipDuplicatePoints }
                                                    onCheckedChange={ (checked) =>
                                                        handleMergeOptionChange("skipDuplicatePoints", checked)
                                                    }
                                                />
                                                <Label htmlFor="skipDuplicatePoints">Remove duplicate points</Label>
                                                <p className="ml-2 text-muted-foreground text-xs">
                                                    (Recommended) Removes points that are at the exact same location
                                                </p>
                                            </div>

                                            <div className="flex flex-col space-y-2">
                                                <Label htmlFor="simplificationTolerance">Simplification Level</Label>
                                                <div className="flex items-center space-x-4">
                                                    <Slider
                                                        id="simplificationTolerance"
                                                        min={ 0 }
                                                        max={ 50 }
                                                        step={ 1 }
                                                        value={ [mergeOptions.simplificationTolerance] }
                                                        onValueChange={ ([value]) =>
                                                            handleMergeOptionChange("simplificationTolerance", value)
                                                        }
                                                        className="flex-grow"
                                                    />
                                                    <span className="w-12 text-right">
                                                        { mergeOptions.simplificationTolerance }m
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground text-xs">
                                                    Higher values = smaller file size but less precision. Recommended: 10-20m
                                                    for most tracks
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="includeElevation"
                                                    checked={ mergeOptions.includeElevation }
                                                    onCheckedChange={ (checked) =>
                                                        handleMergeOptionChange("includeElevation", checked)
                                                    }
                                                />
                                                <Label htmlFor="includeElevation">Preserve elevation data</Label>
                                                <p className="ml-2 text-muted-foreground text-xs">
                                                    Keep elevation data when available (uses time-based merge as base)
                                                </p>
                                            </div>
                                        </div>

                                        { selectedPoints.length > 0 && (
                                            <div className="mt-4 rounded bg-muted p-2">
                                                <p className="font-medium text-sm">
                                                    Track simplified to { selectedPoints.length } points
                                                    { previewStats.totalPointsOriginal > 0 && (
                                                        <span className="ml-1 text-muted-foreground">
                                                            (
                                                            { Math.round(
                                                                (selectedPoints.length / previewStats.totalPointsOriginal) * 100,
                                                            ) }
                                                            % of original)
                                                        </span>
                                                    ) }
                                                </p>
                                            </div>
                                        ) }
                                    </div>
                                </TabsContent>

                                <TabsContent value="interpolated">
                                    <div className="mt-4 rounded-md border p-4">
                                        <h3 className="mb-2 font-medium text-lg">Interpolated Merge</h3>
                                        <p className="mb-4 text-muted-foreground text-sm">
                                            <strong>Best for:</strong> Creating smooth transitions between tracks.
                                            <br />
                                            <strong>How it works:</strong> Similar to time-based merge, but adds extra
                                            points to create smooth transitions between track segments. Best used when you
                                            have gaps between recordings that you want to fill.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="skipDuplicatePoints"
                                                    checked={ mergeOptions.skipDuplicatePoints }
                                                    onCheckedChange={ (checked) =>
                                                        handleMergeOptionChange("skipDuplicatePoints", checked)
                                                    }
                                                />
                                                <Label htmlFor="skipDuplicatePoints">Remove duplicate points</Label>
                                                <p className="ml-2 text-muted-foreground text-xs">
                                                    (Recommended) Removes points that are at the exact same location
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Advanced Options toggler */ }
                            <div className="mt-4 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={ () => setShowAdvancedOptions(!showAdvancedOptions) }
                                    className="text-sm"
                                >
                                    { showAdvancedOptions ? "Hide" : "Show" } Advanced Options
                                </Button>
                                <Button variant="outline" onClick={ resetOptions } size="sm">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Options
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Options */ }
                    { showAdvancedOptions && (
                        <AdvancedOptions
                            showOptions={ true }
                            toggleOptions={ () => setShowAdvancedOptions(!showAdvancedOptions) }
                            options={ mergeOptions }
                            onOptionChange={ handleMergeOptionChange }
                        />
                    ) }

                    {/* File Selection */ }
                    <div className="rounded-md border">
                        <div className="border-b bg-background px-4 py-3">
                            <h3 className="font-medium text-lg">File Selection</h3>
                            <p className="text-muted-foreground text-sm">
                                Select the files to include in the merge.
                            </p>
                        </div>

                        <div className="p-3">
                            { selectionError && (
                                <Alert className="mb-3 border-amber-100 bg-amber-50">
                                    <div className="flex items-center">
                                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                        <AlertDescription className="text-amber-700">{ selectionError }</AlertDescription>
                                    </div>
                                </Alert>
                            ) }

                            <ScrollArea className="h-[150px] rounded-md border">
                                <div className="space-y-1 p-1">
                                    { files.map(
                                        (file) =>
                                            file.id && (
                                                <FileListItem
                                                    key={ file.id }
                                                    file={ file }
                                                    isSelected={ fileSelections[file.id] || false }
                                                    onSelectionChange={ (checked) =>
                                                        toggleFileSelection(file.id || "", checked)
                                                    }
                                                    onMoveUp={ moveFileUp }
                                                    onMoveDown={ moveFileDown }
                                                    canMoveUp={ false }
                                                    canMoveDown={ false }
                                                />
                                            ),
                                    ) }
                                </div>
                            </ScrollArea>

                            <div className="mt-2 text-muted-foreground text-xs">
                                { Object.values(fileSelections).filter(Boolean).length } of { files.length } files
                                selected
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-muted/50 pt-6">
                <div className="flex items-center text-muted-foreground text-sm">
                    { selectedPoints.length > 0 ? (
                        <p>
                            Ready to merge { filteredFiles.length } files with { selectedPoints.length } points (
                            { previewStats.estimatedFileSize })
                        </p>
                    ) : (
                        <p>Select files and a merge method to continue</p>
                    ) }
                </div>

                <div className="flex space-x-2">
                    <Button
                        onClick={ handleMerge }
                        disabled={ selectedPoints.length === 0 || filteredFiles.length < 2 }
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Merge Files
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
