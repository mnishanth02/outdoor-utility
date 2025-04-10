import { GpxEditor } from "@/components/gpx/GpxEditor";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";

export default function EditPage({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-8 text-center font-bold text-3xl">Edit GPX File</h1>
            <Suspense fallback={
                <Card className="mb-8">
                    <CardContent className="flex justify-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p>Loading GPX editor...</p>
                        </div>
                    </CardContent>
                </Card>
            }>
                <GpxEditor id={ params.id } />
            </Suspense>
        </div>
    );
}