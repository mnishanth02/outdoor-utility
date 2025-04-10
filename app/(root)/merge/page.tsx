"use client";
import { useGpx } from "@/contexts/GpxContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GpxMerger } from "@/components/gpx/GpxMerger";

export default function MergePage() {
    return <MergePageClient />;
}

function MergePageClient() {
    const { storedFiles } = useGpx();
    const hasEnoughFiles = storedFiles.length >= 2;

    return (
        <div className="container mx-auto py-8">
            { hasEnoughFiles ? (
                <GpxMerger />
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-8">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                    </div>
                    <h2 className="mb-2 font-semibold text-xl">Upload at least two GPX files to merge</h2>
                    <p className="mb-6 max-w-md text-center text-muted-foreground">
                        You need to have at least two GPX files in your collection to use the merge feature
                    </p>
                    <Button variant="default" asChild>
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </div>
            ) }
        </div>
    );
}
