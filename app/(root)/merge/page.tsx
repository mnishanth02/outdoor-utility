import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import { MergeStatusClient } from "@/components/merge/MergeStatusClient";

// This is now a server component
export default function MergePage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-8 text-center font-bold text-3xl">Merge GPX Files</h1>
            <Suspense
                fallback={
                    <Card className="mb-8">
                        <CardContent className="flex justify-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="animate-spin">
                                    <RefreshCcw className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p>Loading merger...</p>
                            </div>
                        </CardContent>
                    </Card>
                }
            >
                <MergeStatusClient />
            </Suspense>
        </div>
    );
}
