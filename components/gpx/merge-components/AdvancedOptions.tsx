"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MergeOptions } from "../GpxMerger";

interface AdvancedOptionsProps {
  showOptions: boolean;
  toggleOptions: () => void;
  options: MergeOptions;
  onOptionChange: <K extends keyof MergeOptions>(key: K, value: MergeOptions[K]) => void;
}

export function AdvancedOptions({
  showOptions,
  toggleOptions,
  options,
  onOptionChange,
}: AdvancedOptionsProps) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex cursor-pointer items-center justify-between" onClick={ toggleOptions }>
        <h3 className="font-medium text-lg">Advanced Options</h3>
        <Button variant="ghost" size="sm">
          { showOptions ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" /> }
        </Button>
      </div>

      { showOptions && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-4">
            <Switch
              id="skipDuplicatePoints"
              checked={ options.skipDuplicatePoints }
              onCheckedChange={ (checked) => onOptionChange("skipDuplicatePoints", checked) }
            />
            <Label htmlFor="skipDuplicatePoints">Skip duplicate points</Label>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              id="includeElevation"
              checked={ options.includeElevation }
              onCheckedChange={ (checked) => onOptionChange("includeElevation", checked) }
            />
            <Label htmlFor="includeElevation">Include elevation data</Label>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              id="preserveOriginalFiles"
              checked={ options.preserveOriginalFiles }
              onCheckedChange={ (checked) => onOptionChange("preserveOriginalFiles", checked) }
            />
            <Label htmlFor="preserveOriginalFiles">Preserve original files</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <Select
              value={ options.outputFormat }
              onValueChange={ (value) =>
                onOptionChange("outputFormat", value as "single-track")
              }
            >
              <SelectTrigger id="outputFormat">
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-track">Single Track</SelectItem>
                <SelectItem value="multi-track">Multiple Tracks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Single track combines all points into one track. Multiple tracks preserves the
              original track structure.
            </p>
          </div>
        </div>
      ) }
    </div>
  );
}
