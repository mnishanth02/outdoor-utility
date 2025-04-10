import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import { EditPageClient } from "@/components/edit/EditPageClient";

export default async function EditPage({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-8 text-center font-bold text-3xl">Edit GPX File</h1>
            <Suspense
                fallback={
                    <Card className="mb-8">
                        <CardContent className="flex justify-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="animate-spin">
                                    <RefreshCcw className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p>Loading GPX editor...</p>
                            </div>
                        </CardContent>
                    </Card>
                }
            >
                <EditPageClient id={ id } />
            </Suspense>
        </div>
    );
}
