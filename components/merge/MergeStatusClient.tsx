"use client";

import { useGpx } from "@/contexts/GpxContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { GpxMerger } from "@/components/gpx/GpxMerger";

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
};

export function MergeStatusClient() {
    const { storedFiles, selectedFileIds } = useGpx();
    const [error, setError] = useState<string | null>(null);

    // Check if we have enough files
    const hasEnoughFiles = storedFiles.length >= 2;

    // Check if we have enough selected files
    const hasEnoughSelectedFiles = selectedFileIds.length >= 2;

    // Check for selection state when the component mounts
    useEffect(() => {
        // Set error if we don't have enough selected files
        if (storedFiles.length >= 2 && selectedFileIds.length < 2) {
            setError("Please select at least two files to merge in the GPX Track Manager");
        } else {
            setError(null);
        }
    }, [storedFiles, selectedFileIds]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={ containerVariants }
        >
            { hasEnoughFiles ? (
                <>
                    { !hasEnoughSelectedFiles ? (
                        <motion.div
                            variants={ itemVariants }
                            className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-8"
                        >
                            <motion.div
                                initial={ { scale: 0.8, opacity: 0 } }
                                animate={ { scale: 1, opacity: 1 } }
                                transition={ { type: "spring", stiffness: 300, damping: 15 } }
                                className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 text-yellow-600"
                            >
                                <motion.div
                                    animate={ { rotate: [0, -10, 10, -10, 0] } }
                                    transition={ { duration: 0.8, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 } }
                                >
                                    <AlertCircle size={ 32 } />
                                </motion.div>
                            </motion.div>
                            <motion.h2 variants={ itemVariants } className="mb-2 font-semibold text-xl">
                                Selection Required
                            </motion.h2>
                            <motion.div variants={ itemVariants } className="mb-6 max-w-md">
                                <Alert>
                                    <AlertDescription>{ error }</AlertDescription>
                                </Alert>
                            </motion.div>
                            <motion.div
                                variants={ itemVariants }
                                whileHover={ { scale: 1.05 } }
                                whileTap={ { scale: 0.95 } }
                            >
                                <Button variant="default" asChild>
                                    <Link href="/" className="flex items-center gap-2">
                                        <ArrowLeft size={ 16 } />
                                        Return to GPX Track Manager
                                    </Link>
                                </Button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                            transition={ { duration: 0.5 } }
                        >
                            <GpxMerger />
                        </motion.div>
                    ) }
                </>
            ) : (
                <motion.div
                    variants={ itemVariants }
                    className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-8"
                >
                    <motion.div
                        initial={ { scale: 0.8, opacity: 0 } }
                        animate={ { scale: 1, opacity: 1 } }
                        transition={ { type: "spring", stiffness: 300, damping: 15 } }
                        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                        <motion.div
                            animate={ { rotate: 360 } }
                            transition={ {
                                duration: 20,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                            } }
                        >
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
                        </motion.div>
                    </motion.div>
                    <motion.h2 variants={ itemVariants } className="mb-2 font-semibold text-xl">
                        Upload at least two GPX files to merge
                    </motion.h2>
                    <motion.p
                        variants={ itemVariants }
                        className="mb-6 max-w-md text-center text-muted-foreground"
                    >
                        You need to have at least two GPX files in your collection to use the merge feature
                    </motion.p>
                    <motion.div
                        variants={ itemVariants }
                        whileHover={ { scale: 1.05 } }
                        whileTap={ { scale: 0.95 } }
                    >
                        <Button variant="default" asChild>
                            <Link href="/">Go to Homepage</Link>
                        </Button>
                    </motion.div>
                </motion.div>
            ) }
        </motion.div>
    );
}