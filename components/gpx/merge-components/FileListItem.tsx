"use client";

import type { GpxData } from "@/contexts/GpxContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowDown } from "lucide-react";

interface FileListItemProps {
    file: GpxData;
    isSelected: boolean;
    onSelectionChange: (checked: boolean) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export function FileListItem({
    file,
    isSelected,
    onSelectionChange,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: FileListItemProps) {
    if (!file.id) return null;

    // Calculate total points in the file
    const totalPoints = file.tracks.reduce((sum, track) => sum + track.points.length, 0);

    return (
        <div className="flex items-center justify-between space-x-2 rounded-md p-2 hover:bg-slate-50">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={ `file-${file.id}` }
                    checked={ isSelected }
                    onCheckedChange={ (checked) => onSelectionChange(checked as boolean) }
                />
                <Label htmlFor={ `file-${file.id}` } className="max-w-[200px] flex-grow truncate text-sm">
                    { file.metadata.name }
                </Label>
            </div>

            <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                    { totalPoints } points
                </Badge>

                <Button variant="ghost" size="icon" onClick={ onMoveUp } disabled={ !canMoveUp }>
                    <ArrowDown className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" onClick={ onMoveDown } disabled={ !canMoveDown }>
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
