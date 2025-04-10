"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadGpxFile, uploadMultipleGpxFiles } from "@/app/actions/gpx";
import type { UploadResult } from "@/app/actions/gpx";
import { toast } from "sonner";
import { useGpx } from "@/contexts/GpxContext";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function CollapsibleFileUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const { loadGpxFromFile, loadGpxFilesToStore, storedFiles } = useGpx();

    // Auto-collapse uploader when files exist
    useEffect(() => {
        if (storedFiles.length > 0) {
            setIsOpen(false);
        }
    }, [storedFiles.length]);

    const handleFileUpload = async (formData: FormData) => {
        try {
            setIsUploading(true);
            const files = formData.getAll("gpxFiles") as File[];

            // Basic client-side validation
            if (!files || files.length === 0) {
                toast.error("Please select at least one file to upload");
                return;
            }

            // Validate file types and sizes
            const maxSize = 10 * 1024 * 1024; // 10MB
            const invalidFiles = files.filter((file) => !file.name.toLowerCase().endsWith(".gpx"));
            const oversizeFiles = files.filter((file) => file.size > maxSize);

            if (invalidFiles.length > 0) {
                toast.error(`${invalidFiles.length} file(s) are not GPX format and will be skipped`);
            }

            if (oversizeFiles.length > 0) {
                toast.error(`${oversizeFiles.length} file(s) exceed the 10MB limit and will be skipped`);
            }

            // Filter valid files
            const validFiles = files.filter(
                (file) => file.name.toLowerCase().endsWith(".gpx") && file.size <= maxSize,
            );

            if (validFiles.length === 0) {
                toast.error("No valid GPX files to upload");
                return;
            }

            // Handle single file upload differently for better user experience
            if (validFiles.length === 1) {
                const file = validFiles[0];
                const singleFormData = new FormData();
                singleFormData.append("gpxFile", file);

                const result = await uploadGpxFile(singleFormData);

                if (result.success && result.fileContent) {
                    await loadGpxFromFile(result.fileContent, result.fileName || file.name);
                    toast.success("GPX file uploaded successfully");
                    setIsOpen(false); // Collapse after successful upload
                } else {
                    toast.error(result.error || "Failed to upload GPX file");
                }
            } else {
                // Upload multiple files
                const results = await uploadMultipleGpxFiles(formData);

                if (results.success && results.files && results.files.length > 0) {
                    await loadGpxFilesToStore(
                        results.files.map((result: UploadResult) => ({
                            content: result.fileContent ?? "",
                            fileName: result.fileName ?? `file_${Date.now()}.gpx`,
                        })),
                    );
                    toast.success(`${results.files.length} GPX file(s) uploaded successfully`);
                    setIsOpen(false); // Collapse after successful upload
                } else {
                    toast.error(results.error || "Failed to upload GPX files");
                }
            }
        } catch (error) {
            console.error("Error uploading GPX files:", error);
            toast.error("An error occurred while uploading the files");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="shadow-sm">
            <Collapsible open={ isOpen } onOpenChange={ setIsOpen }>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Upload GPX File(s)</CardTitle>
                            <CardDescription>
                                Upload GPX files to view, edit, merge, and analyze your routes
                            </CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                { isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" /> }
                                <span className="sr-only">{ isOpen ? "Close" : "Open" }</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <form action={ handleFileUpload }>
                            <div className="flex flex-col items-center rounded-lg border-2 border-dashed bg-muted/30 p-6 transition-colors hover:bg-muted/50">
                                <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                                <p className="mb-4 "> Click to browse files</p>

                                <Input
                                    id="gpxFiles"
                                    name="gpxFiles"
                                    type="file"
                                    accept=".gpx"
                                    multiple
                                    disabled={ isUploading }
                                    required
                                    className="max-w-xs"
                                />

                                <Button type="submit" disabled={ isUploading } className="mt-4">
                                    { isUploading ? "Uploading..." : "Upload GPX Files" }
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </CollapsibleContent>
                { !isOpen && storedFiles.length > 0 && (
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-center py-2">
                            <p className="text-muted-foreground text-sm">{ storedFiles.length } file(s) uploaded</p>
                        </div>
                    </CardContent>
                ) }
            </Collapsible>
        </Card>
    );
}