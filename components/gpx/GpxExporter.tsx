"use client";

import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { GpxData, GpxPoint } from "@/contexts/GpxContext";

function generateGpxContent(gpxData: GpxData): string {
    if (!gpxData || !gpxData.tracks || gpxData.tracks.length === 0) {
        return "";
    }

    // If the original GPX XML was preserved, use it
    if (gpxData.rawXml) {
        return gpxData.rawXml;
    }

    // Otherwise, generate a new GPX file from the data
    const track = gpxData.tracks[0]; // For POC, we only use the first track

    const trackPoints = track.points.map((point: GpxPoint) => {
        let pointXml = `<trkpt lat="${point.lat}" lon="${point.lon}">`;
        if (point.ele !== undefined) {
            pointXml += `<ele>${point.ele}</ele>`;
        }
        if (point.time) {
            pointXml += `<time>${point.time}</time>`;
        }
        pointXml += "</trkpt>";
        return pointXml;
    }).join("\n        ");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
     version="1.1"
     creator="Outdoor Connect">
  <metadata>
    <name>${gpxData.metadata.name || "Unnamed Track"}</name>
    ${gpxData.metadata.description ? `<desc>${gpxData.metadata.description}</desc>` : ""}
    ${gpxData.metadata.time ? `<time>${gpxData.metadata.time}</time>` : ""}
  </metadata>
  <trk>
    <name>${track.name || gpxData.metadata.name || "Unnamed Track"}</name>
    <trkseg>
        ${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

    return xml;
}

export function GpxExporter() {
    const { gpxData, isLoading, error } = useGpx();

    if (isLoading || error || !gpxData || gpxData.tracks.length === 0) {
        return null;
    }

    const handleExport = () => {
        try {
            // Generate GPX content
            const gpxContent = generateGpxContent(gpxData);

            if (!gpxContent) {
                toast.error("No GPX data available to export");
                return;
            }

            // Create a blob from the content
            const blob = new Blob([gpxContent], { type: "application/gpx+xml" });

            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${gpxData.metadata.name || "track"}.gpx`;

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("GPX file exported successfully");
        } catch (error) {
            console.error("Error exporting GPX:", error);
            toast.error("Failed to export GPX file");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Export GPX</CardTitle>
                <CardDescription>Download your track as a GPX file</CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    className="w-full"
                    onClick={ handleExport }
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export GPX File
                </Button>
            </CardContent>
        </Card>
    );
}