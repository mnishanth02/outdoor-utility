import { GpxFileUploader } from "@/components/gpx/FileUploader";
import { GpxInfo } from "@/components/gpx/GpxInfo";
import { GpxMap } from "@/components/gpx/GpxMap";
import { GpxMetadataEditor } from "@/components/gpx/GpxMetadataEditor";
import { GpxPointEditor } from "@/components/gpx/GpxPointEditor";
import { GpxExporter } from "@/components/gpx/GpxExporter";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] items-start gap-8 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <h1 className="text-center font-bold text-3xl">Outdoor Connect</h1>

      <div className="mx-auto w-full max-w-4xl space-y-8">
        <GpxFileUploader />
        <GpxInfo />
        <GpxMap />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <GpxMetadataEditor />
          <div className="space-y-6">
            <GpxPointEditor />
            <GpxExporter />
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-500 text-sm">GPX Viewer & Editor</footer>
    </div>
  );
}
