import { GpxFileUploader } from "@/components/gpx/FileUploader";
import { GpxInfo } from "@/components/gpx/GpxInfo";
import { GpxMap } from "@/components/gpx/GpxMap";
import { GpxMetadataEditor } from "@/components/gpx/GpxMetadataEditor";
import { GpxPointEditor } from "@/components/gpx/GpxPointEditor";
import { GpxExporter } from "@/components/gpx/GpxExporter";
import { GpxFilesManager } from "@/components/gpx/GpxFilesManager";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] items-start gap-6 p-4 pb-12 font-[family-name:var(--font-geist-sans)] sm:p-6 md:gap-8">
      <header className="container px-4">
        <h1 className="mb-2 text-center font-bold text-3xl">Outdoor Connect</h1>
        <p className="mb-6 text-center text-gray-500 text-sm">
          Upload, view, edit, and analyze GPX tracks
        </p>
      </header>

      <main className="container px-4">
        <div className="space-y-6">
          {/* Upload section */ }
          <section>
            <GpxFileUploader />
          </section>

          {/* Files manager */ }
          <section>
            <GpxFilesManager />
          </section>

          {/* Main GPX viewer section */ }
          <section className="space-y-6">
            {/* Primary map view */ }
            <div>
              <GpxMap />
            </div>

            {/* GPX info and editors */ }
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <GpxInfo />
              </div>
              <div className="space-y-6 md:col-span-2">
                <GpxMetadataEditor />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <GpxPointEditor />
                  <GpxExporter />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="container px-4 py-4">
        <div className="text-center text-gray-500 text-sm">
          <p>Outdoor Connect - GPX Viewer & Editor</p>
        </div>
      </footer>
    </div>
  );
}