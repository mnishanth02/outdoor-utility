"use server";

import { revalidatePath } from "next/cache";

export type UploadResult = {
    success: boolean;
    error?: string;
    fileContent?: string;
    fileName?: string;
};

export type MultipleUploadResult = {
    success: boolean;
    error?: string;
    files?: UploadResult[];
};

export async function uploadGpxFile(formData: FormData): Promise<UploadResult> {
    try {
        const file = formData.get("gpxFile") as File;

        if (!file) {
            return {
                success: false,
                error: "No file provided"
            };
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith(".gpx")) {
            return {
                success: false,
                error: "Only GPX files are allowed"
            };
        }

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return {
                success: false,
                error: "File size exceeds maximum limit of 10MB"
            };
        }

        // Read the file content as text
        const fileContent = await file.text();

        // Verify it's a valid XML file with GPX structure
        // This is a basic check - in a production app, you might want more sophisticated validation
        if (!fileContent.includes("<gpx") || !fileContent.includes("</gpx>")) {
            return {
                success: false,
                error: "Invalid GPX file format"
            };
        }

        // Return success with the file content for client-side parsing
        revalidatePath("/");
        return {
            success: true,
            fileContent,
            fileName: file.name
        };
    } catch (error) {
        console.error("Error processing GPX file:", error);
        return {
            success: false,
            error: "An error occurred while processing the file"
        };
    }
}

export async function uploadMultipleGpxFiles(formData: FormData): Promise<MultipleUploadResult> {
    try {
        const files = formData.getAll("gpxFiles") as File[];

        if (!files || files.length === 0) {
            return {
                success: false,
                error: "No files provided"
            };
        }

        const uploadResults: UploadResult[] = [];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Process each file sequentially
        for (const file of files) {
            try {
                // Validate file type
                if (!file.name.toLowerCase().endsWith(".gpx")) {
                    continue; // Skip non-GPX files
                }

                // Validate file size
                if (file.size > maxSize) {
                    continue; // Skip files that are too large
                }

                // Read the file content
                const fileContent = await file.text();

                // Basic validation
                if (!fileContent.includes("<gpx") || !fileContent.includes("</gpx>")) {
                    continue; // Skip invalid GPX files
                }

                // Add to results
                uploadResults.push({
                    success: true,
                    fileContent,
                    fileName: file.name
                });
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                // Continue with next file
            }
        }

        if (uploadResults.length === 0) {
            return {
                success: false,
                error: "No valid GPX files were provided"
            };
        }

        revalidatePath("/");
        return {
            success: true,
            files: uploadResults
        };
    } catch (error) {
        console.error("Error processing multiple GPX files:", error);
        return {
            success: false,
            error: "An error occurred while processing the files"
        };
    }
}