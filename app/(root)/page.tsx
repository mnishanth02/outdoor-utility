"use client";
import { GpxInfo } from "@/components/gpx/GpxInfo";
import { GpxMap } from "@/components/gpx/GpxMap";
import { GpxMetadataEditor } from "@/components/gpx/GpxMetadataEditor";
import { GpxPointEditor } from "@/components/gpx/GpxPointEditor";
import { GpxExporter } from "@/components/gpx/GpxExporter";
import { CollapsibleFileUploader } from "@/components/gpx/CollapsibleFileUploader";
import { GpxTrackManager } from "@/components/gpx/GpxTrackManager";
import { useGpx } from "@/contexts/GpxContext";

export default function Home() {
  // We need to make this component a client component to access the GpxContext
  return <HomeClientComponent />;
}

// Client component that can use the GpxContext hook
function HomeClientComponent() {
  const { gpxData, storedFiles } = useGpx();
  const hasFiles = storedFiles.length > 0;
  const hasActiveFile = gpxData !== null;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] items-start gap-6 p-4 pb-12 font-[family-name:var(--font-geist-sans)] sm:p-6 md:gap-8">
      <header className="container px-4">
        <h1 className="mb-2 text-center font-bold text-3xl">Outdoor Connect</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Upload, view, edit, and analyze GPX tracks
        </p>
      </header>

      <main className="container px-4">
        <div className="space-y-6">
          {/* Upload section - always at the top, collapsible */ }
          <section className="mb-4">
            <CollapsibleFileUploader />
          </section>

          {/* Active file summary - show when a file is selected */ }
          { hasActiveFile && (
            <section className="mb-4">
              <div className="sticky top-4 z-10">
                <GpxInfo />
              </div>
            </section>
          ) }

          {/* Unified GPX Track Manager */ }
          <section className="mb-4">
            <GpxTrackManager />
          </section>

          {/* Main GPX viewer section - only show when there's an active file */ }
          { hasActiveFile && (
            <section className="space-y-6">
              {/* Primary map view */ }
              <div>
                <GpxMap />
              </div>

              {/* GPX editors */ }
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <GpxMetadataEditor />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-1">
                  <GpxPointEditor />
                  <GpxExporter />
                </div>
              </div>
            </section>
          ) }

          {/* Show a message when no active file is selected but files exist */ }
          { !hasActiveFile && hasFiles && (
            <section className="my-8 flex flex-col items-center justify-center rounded-lg bg-muted/30 p-8">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
              </div>
              <h2 className="mb-2 font-semibold text-xl">Select a file to view and edit</h2>
              <p className="mb-4 max-w-md text-center text-muted-foreground">
                Click on a file in the track manager above to start working with it
              </p>
            </section>
          ) }

          {/* Show a getting started message when no files exist at all */ }
          { !hasFiles && (
            <section className="my-8 flex flex-col items-center justify-center rounded-lg bg-muted/30 p-8">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
              </div>
              <h2 className="mb-2 font-semibold text-xl">Get Started</h2>
              <p className="mb-4 max-w-md text-center text-muted-foreground">
                Upload a GPX file using the uploader above to start viewing and editing your tracks
              </p>
            </section>
          ) }
        </div>
      </main>

      <footer className="container px-4 py-4">
        <div className="text-center text-muted-foreground text-sm">
          <p>Outdoor Connect - GPX Viewer & Editor</p>
        </div>
      </footer>
    </div>
  );
}