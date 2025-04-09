import { GpxMerger } from "@/components/gpx/GpxMerger";

export default function MergePage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-8 text-center font-bold text-3xl">Merge GPX Files</h1>
            <GpxMerger />
        </div>
    );
}
