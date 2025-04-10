"use client";

import type { GpxData } from "@/contexts/GpxContext";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FileListItemProps {
    file: GpxData;
    isSelected: boolean;
    onSelectionChange: (checked: boolean) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export function FileListItem({ file, isSelected, onSelectionChange }: FileListItemProps) {
    if (!file.id) return null;

    // Calculate total points in the file
    const totalPoints = file.tracks.reduce((sum, track) => sum + track.points.length, 0);

    return (
        <div
            className={ `flex items-center justify-between px-2 py-1 ${isSelected ? "bg-slate-100" : ""} rounded-sm hover:bg-slate-50` }
        >
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={ `file-${file.id}` }
                    checked={ isSelected }
                    onCheckedChange={ (checked) => onSelectionChange(checked as boolean) }
                    className="h-4 w-4"
                />
                <Label htmlFor={ `file-${file.id}` } className="cursor-pointer font-medium text-sm">
                    { file.metadata.name || `File ${file.id.slice(0, 8)}` }
                </Label>
            </div>

            <Badge variant="outline" className="text-xs">
                { totalPoints } points
            </Badge>
        </div>
    );
}
