"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadGpxFile } from "@/app/actions/gpx";
import { toast } from "sonner";
import { useGpx } from "@/contexts/GpxContext";

export function GpxFileUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const { loadGpxFromFile } = useGpx();

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

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle>Upload GPX File</CardTitle>
                <CardDescription>Upload a GPX file to view, edit, and analyze your routes</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <CardFooter className="flex justify-end px-0 pt-4">
                        <Button type="submit" disabled={ isUploading }>
                            { isUploading ? "Uploading..." : "Upload GPX File" }
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}
