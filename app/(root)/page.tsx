"use client";
import { GpxInfo } from "@/components/gpx/GpxInfo";
import { GpxMap } from "@/components/gpx/GpxMap";
import { GpxMetadataEditor } from "@/components/gpx/GpxMetadataEditor";
import { GpxPointEditor } from "@/components/gpx/GpxPointEditor";
import { GpxExporter } from "@/components/gpx/GpxExporter";
import { CollapsibleFileUploader } from "@/components/gpx/CollapsibleFileUploader";
import { GpxTrackManager } from "@/components/gpx/GpxTrackManager";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Merge } from "lucide-react";
import { GlowEffect } from "@/components/ui/glow-effect";

export default function Home() {
  // We need to make this component a client component to access the GpxContext
  return <HomeClientComponent />;
}

// Client component that can use the GpxContext hook
function HomeClientComponent() {
  const { gpxData, storedFiles, selectedFileIds } = useGpx();
  const hasFiles = storedFiles.length > 0;
  const hasActiveFile = gpxData !== null;
  const hasMultipleFiles = storedFiles.length >= 2;
  const hasEnoughSelectedFiles = selectedFileIds.length >= 2;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] items-start gap-8 bg-background p-4 pb-12 font-sans sm:p-6 md:gap-8">
      <header className="container mx-auto px-4 py-6">
        <h1 className="mb-3 text-center font-bold text-3xl text-foreground">Outdoor Connect</h1>
        <p className="mb-4 text-center text-muted-foreground">
          Upload, view, edit, and analyze GPX tracks
        </p>
      </header>

      <main className="container mx-auto px-4">
        <div className="space-y-8">
          {/* Upload section - always at the top */ }
          <section>
            <CollapsibleFileUploader />
          </section>

          {/* Unified GPX Track Manager - moved to top */ }
          <section>
            <GpxTrackManager />
          </section>

          {/* Merge Highlight Section - show when multiple files are available */ }
          { hasMultipleFiles && (
            <section>
              <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5 shadow-md">
                <CardHeader className="bg-primary/10 pt-2 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Merge className="h-5 w-5" />
                    Merge GPX Tracks
                  </CardTitle>
                  <CardDescription className="text-base">
                    Combine two or more GPX tracks to create custom routes and experiences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Selected for merging:</span>{ " " }
                        { selectedFileIds.length } of { storedFiles.length } files
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Select at least two files in the track manager above to enable merging
                      </p>
                    </div>
                    <div className="relative z-10 overflow-visible">
                      { hasEnoughSelectedFiles && (
                        <GlowEffect
                          colors={ ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"] }
                          mode="colorShift"
                          blur="medium"
                          duration={ 4 }
                          scale={ 1.03 }
                          className="z-0 opacity-50"
                        />
                      ) }
                      <Button
                        size="lg"
                        disabled={ !hasEnoughSelectedFiles }
                        className="relative z-10 border border-primary/50 bg-card text-primary hover:bg-primary/5"
                        asChild
                      >
                        <Link href="/merge" className="flex items-center gap-2">
                          <Merge className="h-5 w-5" />
                          { hasEnoughSelectedFiles
                            ? "Merge Selected Tracks"
                            : "Select Files to Merge" }
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) }

          {/* Active file summary - show when a file is selected */ }
          { hasActiveFile && (
            <section>
              <div className="sticky top-4 z-10">
                <GpxInfo />
              </div>
            </section>
          ) }

          {/* Main GPX viewer section - only show when there's an active file */ }
          { hasActiveFile && (
            <section className="space-y-8">
              {/* Primary map view */ }
              <div>
                <GpxMap />
              </div>

              {/* GPX editors */ }
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <GpxMetadataEditor />
                <div className="grid grid-cols-1 gap-8">
                  <GpxPointEditor />
                  <GpxExporter />
                </div>
              </div>
            </section>
          ) }

          {/* Show a message when no active file is selected but files exist */ }
          { !hasActiveFile && hasFiles && (
            <section className="my-12 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 p-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
              </div>
              <h2 className="mb-3 font-semibold text-2xl">Select a file to view and edit</h2>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
                Click on a file in the track manager above to start working with it
              </p>
            </section>
          ) }

          {/* Show a getting started message when no files exist at all */ }
          { !hasFiles && (
            <section className="my-12 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 p-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
              </div>
              <h2 className="mb-3 font-semibold text-2xl">Get Started</h2>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
                Upload a GPX file using the uploader above to start viewing and editing your tracks
              </p>
            </section>
          ) }
        </div>
      </main>

      <footer className="container mx-auto mt-4 border-border border-t px-4 py-6">
        <div className="text-center text-muted-foreground text-sm">
          <p>Outdoor Connect - GPX Viewer & Editor</p>
        </div>
      </footer>
    </div>
  );
}
