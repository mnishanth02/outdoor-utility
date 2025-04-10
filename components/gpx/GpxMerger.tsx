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
import { toast } from "sonner";
import { ChevronLeft, Save, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useMergeStrategies } from "./merge-strategies/useMergeStrategies";
import { FileListItem } from "./merge-components/FileListItem";
import { MergePreview } from "./merge-components/MergePreview";
import { AdvancedOptions } from "./merge-components/AdvancedOptions";

export type MergeMethod = "sequential" | "byTime" | "interpolated" | "simplified";

export type MergeOptions = {
    skipDuplicatePoints: boolean;
    autoSmoothTransitions: boolean;
    simplificationTolerance: number;
    includeElevation: boolean;
    timeGapThreshold: number; // in minutes
    preserveOriginalFiles: boolean;
    outputFormat: "single-track";
    fileOrder: string[];
};

export type PreviewStats = {
    totalPointsOriginal: number;
    totalPointsAfterMerge: number;
    estimatedFileSize: string;
    duplicatePointsRemoved: number;
};

export function GpxMerger() {
    const { storedFiles, mergeFiles } = useGpx();
    const router = useRouter();
    const [mergeMethod, setMergeMethod] = useState<MergeMethod>("sequential");
    const [selectedPoints, setSelectedPoints] = useState<MergePoint[]>([]);
    const [files, setFiles] = useState<GpxData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<GpxData[]>([]);
    const [fileSelections, setFileSelections] = useState<Record<string, boolean>>({});
    const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
        skipDuplicatePoints: true,
        autoSmoothTransitions: false,
        simplificationTolerance: 10, // meters
        includeElevation: true,
        timeGapThreshold: 30, // minutes
        preserveOriginalFiles: true,
        outputFormat: "single-track",
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
            const validFiles = storedFiles.filter((file) => typeof file.id === "string");
            setFiles(validFiles);
            setFilteredFiles(validFiles);

            // Initialize file selections and order
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
        } else {
            // Redirect back if not enough files
            toast.error("At least two GPX files are required for merging");
            router.push("/");
        }
    }, [storedFiles, router]);

    // Update filtered files when selections change
    useEffect(() => {
        const filtered = files.filter((file) => file.id && fileSelections[file.id]);
        setFilteredFiles(filtered);
    }, [files, fileSelections]);

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

    const moveFileUp = (fileId: string) => {
        const currentOrder = [...mergeOptions.fileOrder];
        const index = currentOrder.indexOf(fileId);

        if (index > 0) {
            const newOrder = [...currentOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setMergeOptions((prev) => ({ ...prev, fileOrder: newOrder }));
        }
    };

    const moveFileDown = (fileId: string) => {
        const currentOrder = [...mergeOptions.fileOrder];
        const index = currentOrder.indexOf(fileId);

        if (index < currentOrder.length - 1) {
            const newOrder = [...currentOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setMergeOptions((prev) => ({ ...prev, fileOrder: newOrder }));
        }
    };

    const toggleFileSelection = (fileId: string, checked: boolean) => {
        setFileSelections((prev) => ({ ...prev, [fileId]: checked }));
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

    const resetOptions = () => {
        setMergeOptions({
            ...mergeOptions,
            skipDuplicatePoints: true,
            autoSmoothTransitions: false,
            simplificationTolerance: 10,
            includeElevation: true,
            timeGapThreshold: 30,
            preserveOriginalFiles: true,
            outputFormat: "single-track",
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
            <CardContent>
                <div className="space-y-6">
                    {/* File Selection */ }
                    <div className="rounded-md border p-4">
                        <h3 className="mb-2 font-medium text-lg">File Selection</h3>
                        <p className="mb-4 text-muted-foreground text-sm">
                            Select the files to include in the merge and arrange them in the desired order.
                        </p>

                        <ScrollArea className="h-[200px] rounded-md border">
                            <div className="space-y-2 p-2">
                                { files.map(
                                    (file) =>
                                        file.id && (
                                            <FileListItem
                                                key={ file.id }
                                                file={ file }
                                                isSelected={ fileSelections[file.id] || false }
                                                onSelectionChange={ (checked) => toggleFileSelection(file.id || "", checked) }
                                                onMoveUp={ () => moveFileUp(file.id || "") }
                                                onMoveDown={ () => moveFileDown(file.id || "") }
                                                canMoveUp={
                                                    fileSelections[file.id] && mergeOptions.fileOrder.indexOf(file.id) > 0
                                                }
                                                canMoveDown={
                                                    fileSelections[file.id] &&
                                                    mergeOptions.fileOrder.indexOf(file.id) <
                                                    mergeOptions.fileOrder.length - 1
                                                }
                                            />
                                        ),
                                ) }
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Merge Method Selection */ }
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
                                    Files will be merged in the order shown above. All points from the first file,
                                    followed by all points from the second, and so on.
                                </p>
                                <div className="flex space-x-2 overflow-x-auto rounded bg-muted p-2">
                                    { filteredFiles.map(
                                        (file, index) =>
                                            file.id && (
                                                <div key={ file.id } className="flex flex-shrink-0 items-center">
                                                    <span className="font-medium text-sm">{ file.metadata.name }</span>
                                                    { index < filteredFiles.length - 1 && (
                                                        <ChevronLeft className="mx-1 h-4 w-4 rotate-180 text-muted-foreground" />
                                                    ) }
                                                </div>
                                            ),
                                    ) }
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

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-grow flex-col space-y-2">
                                            <Label htmlFor="timeGapThreshold">Time Gap Threshold (minutes)</Label>
                                            <div className="flex items-center space-x-4">
                                                <Slider
                                                    id="timeGapThreshold"
                                                    min={ 0 }
                                                    max={ 120 }
                                                    step={ 5 }
                                                    value={ [mergeOptions.timeGapThreshold] }
                                                    onValueChange={ ([value]) =>
                                                        handleMergeOptionChange("timeGapThreshold", value)
                                                    }
                                                    className="flex-grow"
                                                />
                                                <span className="w-12 text-right">{ mergeOptions.timeGapThreshold }</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs">
                                                Create new track segments when time gaps exceed this threshold
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                { selectedPoints.length > 0 ? (
                                    <div className="mt-4 rounded bg-muted p-2">
                                        <p className="font-medium text-sm">
                                            { selectedPoints.length } points will be merged chronologically
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex items-center rounded bg-yellow-100 p-2 text-yellow-800">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        <p className="text-sm">No points with timestamps found in the selected files</p>
                                    </div>
                                ) }
                            </div>
                        </TabsContent>

                        <TabsContent value="simplified">
                            <div className="mt-4 rounded-md border p-4">
                                <h3 className="mb-2 font-medium text-lg">Simplified Merge</h3>
                                <p className="mb-4 text-muted-foreground text-sm">
                                    Files will be merged and then simplified to reduce the number of points while
                                    preserving the overall shape of the track.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-grow flex-col space-y-2">
                                            <Label htmlFor="simplificationTolerance">
                                                Simplification Tolerance (meters)
                                            </Label>
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
                                                Higher values produce fewer points but less accurate tracks
                                            </p>
                                        </div>
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
                                    Files will be merged chronologically with smooth transitions between track
                                    segments. Useful for creating continuous tracks from separate recordings.
                                </p>

                                <div className="mb-4 flex items-center space-x-4">
                                    <Switch
                                        id="autoSmoothTransitions"
                                        checked={ mergeOptions.autoSmoothTransitions }
                                        onCheckedChange={ (checked) =>
                                            handleMergeOptionChange("autoSmoothTransitions", checked)
                                        }
                                    />
                                    <Label htmlFor="autoSmoothTransitions">
                                        Auto-smooth transitions between tracks
                                    </Label>
                                </div>

                                <div className="mb-4 flex items-center space-x-4">
                                    <div className="flex flex-grow flex-col space-y-2">
                                        <Label htmlFor="timeGapInterpolated">Time Gap Threshold (minutes)</Label>
                                        <div className="flex items-center space-x-4">
                                            <Slider
                                                id="timeGapInterpolated"
                                                min={ 0 }
                                                max={ 120 }
                                                step={ 5 }
                                                value={ [mergeOptions.timeGapThreshold] }
                                                onValueChange={ ([value]) =>
                                                    handleMergeOptionChange("timeGapThreshold", value)
                                                }
                                                className="flex-grow"
                                            />
                                            <span className="w-12 text-right">{ mergeOptions.timeGapThreshold }</span>
                                        </div>
                                    </div>
                                </div>

                                { selectedPoints.length > 0 ? (
                                    <div className="rounded bg-muted p-2">
                                        <p className="font-medium text-sm">
                                            { selectedPoints.length } points in interpolated track
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center rounded bg-yellow-100 p-2 text-yellow-800">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        <p className="text-sm">No points with timestamps found</p>
                                    </div>
                                ) }
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="hidden">
                            {/* This tab is now hidden/removed */ }
                        </TabsContent>
                    </Tabs>

                    {/* Advanced Options */ }
                    <AdvancedOptions
                        showOptions={ showAdvancedOptions }
                        toggleOptions={ () => setShowAdvancedOptions(!showAdvancedOptions) }
                        options={ mergeOptions }
                        onOptionChange={ handleMergeOptionChange }
                    />

                    {/* Merge Preview */ }
                    <MergePreview
                        stats={ previewStats }
                        filteredFiles={ filteredFiles }
                        selectedPoints={ selectedPoints }
                    />
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>

                <div className="flex space-x-2">
                    <Button variant="outline" onClick={ resetOptions }>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Options
                    </Button>
                    <Button onClick={ handleMerge } disabled={ selectedPoints.length === 0 }>
                        <Save className="mr-2 h-4 w-4" />
                        Merge Files
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
