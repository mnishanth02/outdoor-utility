"use client";

import type { GpxData, MergePoint } from "@/contexts/GpxContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { PreviewStats } from "../GpxMerger";

interface MergePreviewProps {
    stats: PreviewStats;
    filteredFiles: GpxData[];
    selectedPoints: MergePoint[];
}

export function MergePreview({ stats, filteredFiles, selectedPoints }: MergePreviewProps) {
    return (
        <div className="rounded-md border p-4">
            <h3 className="mb-2 font-medium text-lg">Merge Preview</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-1 text-slate-500 text-sm">Total Points (Selected Files)</p>
                        <p className="font-medium">{ stats.totalPointsOriginal } points</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-1 text-slate-500 text-sm">After Merge</p>
                        <p className="font-medium">{ stats.totalPointsAfterMerge } points</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-1 text-slate-500 text-sm">Estimated File Size</p>
                        <p className="font-medium">{ stats.estimatedFileSize }</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-1 text-slate-500 text-sm">Duplicates Removed</p>
                        <p className="font-medium">{ stats.duplicatePointsRemoved } points</p>
                    </div>
                </div>

                <ScrollArea className="h-[100px] rounded-md border p-2">
                    <div className="space-y-2">
                        { filteredFiles.map((file) => {
                            if (!file.id) return null;

                            // Count how many points are selected from this file
                            const filePoints = selectedPoints.filter((point) => point.sourceFileId === file.id);

                            if (filePoints.length === 0) return null;

                            return (
                                <div key={ file.id } className="flex items-center justify-between">
                                    <span className="max-w-[200px] truncate text-sm">{ file.metadata.name }</span>
                                    <Badge variant="secondary">{ filePoints.length } points</Badge>
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
            </div>
        </div>
    );
}
