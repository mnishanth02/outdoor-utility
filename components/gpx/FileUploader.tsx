"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadGpxFile, uploadMultipleGpxFiles } from "@/app/actions/gpx";
import type { UploadResult } from "@/app/actions/gpx";
import { toast } from "sonner";
import { useGpx } from "@/contexts/GpxContext";

export function GpxFileUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const { loadGpxFromFile, loadGpxFilesToStore } = useGpx();

    const handleFileUpload = async (formData: FormData) => {
        try {
            setIsUploading(true);
            const file = formData.get("gpxFile") as File;

            // Basic client-side validation
            if (!file) {
                toast.error("Please select a file to upload");
                return;
            }

            if (!file.name.toLowerCase().endsWith(".gpx")) {
                toast.error("Only GPX files are allowed");
                return;
            }

            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                toast.error("File size exceeds maximum limit of 10MB");
                return;
            }

            // Upload the file using the server action
            const result = await uploadGpxFile(formData);

            if (result.success && result.fileContent) {
                // Load the GPX data into our context
                await loadGpxFromFile(result.fileContent, result.fileName || file.name);
                toast.success("GPX file uploaded successfully");
            } else {
                toast.error(result.error || "Failed to upload GPX file");
            }
        } catch (error) {
            console.error("Error uploading GPX file:", error);
            toast.error("An error occurred while uploading the file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMultipleFileUpload = async (formData: FormData) => {
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

            // Upload files using the server action
            const results = await uploadMultipleGpxFiles(formData);

            if (results.success && results.files && results.files.length > 0) {
                // Load the GPX data into our context
                await loadGpxFilesToStore(
                    results.files.map((result: UploadResult) => ({
                        content: result.fileContent ?? "",
                        fileName: result.fileName ?? `file_${Date.now()}.gpx`
                    }))
                );
                toast.success(`${results.files.length} GPX file(s) uploaded successfully`);
            } else {
                toast.error(results.error || "Failed to upload GPX files");
            }
        } catch (error) {
            console.error("Error uploading GPX files:", error);
            toast.error("An error occurred while uploading the files");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle>Upload GPX File(s)</CardTitle>
                <CardDescription>
                    Upload GPX files to view, edit, merge, and analyze your routes
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <h3 className="mb-2 font-medium text-sm">Upload Single File</h3>
                        <form action={ handleFileUpload }>
                            <div className="grid w-full items-center gap-4">
                                <Input
                                    id="gpxFile"
                                    name="gpxFile"
                                    type="file"
                                    accept=".gpx"
                                    disabled={ isUploading }
                                    required
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="submit" disabled={ isUploading }>
                                    { isUploading ? "Uploading..." : "Upload GPX File" }
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="mb-2 font-medium text-sm">Upload Multiple Files</h3>
                        <form action={ handleMultipleFileUpload }>
                            <div className="grid w-full items-center gap-4">
                                <Input
                                    id="gpxFiles"
                                    name="gpxFiles"
                                    type="file"
                                    accept=".gpx"
                                    multiple
                                    disabled={ isUploading }
                                    required
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="submit" disabled={ isUploading }>
                                    { isUploading ? "Uploading..." : "Upload Multiple Files" }
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
