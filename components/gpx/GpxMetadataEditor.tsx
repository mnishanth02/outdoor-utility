"use client";

import { useState } from "react";
import { useGpx } from "@/contexts/GpxContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Define form schema with Zod
const metadataFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
    description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

type MetadataFormValues = z.infer<typeof metadataFormSchema>;

export function GpxMetadataEditor() {
    const { gpxData, updateMetadata } = useGpx();
    const [isEditing, setIsEditing] = useState(false);


    const form = useForm<MetadataFormValues>({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            name: gpxData?.metadata.name || "",
            description: gpxData?.metadata.description || "",
        },
    });

    if (!gpxData) return null;
    const onSubmit = (values: MetadataFormValues) => {
        updateMetadata({
            name: values.name,
            description: values.description,
        });
        setIsEditing(false);
        toast.success("Metadata updated successfully");
    };

    if (!isEditing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Track Details</span>
                        <Button variant="outline" size="sm" onClick={ () => setIsEditing(true) }>
                            Edit
                        </Button>
                    </CardTitle>
                    <CardDescription>View and edit track metadata</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-medium text-sm">Name</h3>
                            <p>{ gpxData.metadata.name || "Unnamed Track" }</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-sm">Description</h3>
                            <p className="text-gray-500 text-sm">
                                { gpxData.metadata.description || "No description" }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Track Details</CardTitle>
                <CardDescription>Update track name and description</CardDescription>
            </CardHeader>
            <Form { ...form }>
                <form onSubmit={ form.handleSubmit(onSubmit) }>
                    <CardContent className="space-y-4">
                        <FormField
                            control={ form.control }
                            name="name"
                            render={ ({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Track name" { ...field } />
                                    </FormControl>
                                    <FormDescription>The name of your GPX track</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            ) }
                        />
                        <FormField
                            control={ form.control }
                            name="description"
                            render={ ({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Track description"
                                            className="resize-none"
                                            { ...field }
                                            value={ field.value || "" }
                                        />
                                    </FormControl>
                                    <FormDescription>A short description of your track</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            ) }
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={ () => setIsEditing(false) }>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
