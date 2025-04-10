"use client";
import { GpxInfo } from "@/components/gpx/GpxInfo";
import { GpxMap } from "@/components/gpx/GpxMap";
import { GpxMetadataEditor } from "@/components/gpx/GpxMetadataEditor";
import { GpxPointEditor } from "@/components/gpx/GpxPointEditor";
import { GpxExporter } from "@/components/gpx/GpxExporter";
import { CollapsibleFileUploader } from "@/components/gpx/CollapsibleFileUploader";
import { GpxTrackManager } from "@/components/gpx/GpxTrackManager";
import { useGpx } from "@/contexts/GpxContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Merge } from "lucide-react";
import { GlowEffect } from "@/components/ui/glow-effect";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  // We need to make this component a client component to access the GpxContext
  return <HomeClientComponent />;
}

// Animation variants for staggered animations
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

// Card hover animation
const cardHoverVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

// Client component that can use the GpxContext hook
function HomeClientComponent() {
  const { gpxData, storedFiles, selectedFileIds } = useGpx();
  const hasFiles = storedFiles.length > 0;
  const hasActiveFile = gpxData !== null;
  const hasEnoughSelectedFiles = selectedFileIds.length >= 2;

  // Animation refs for scroll animations
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  const mergeRef = useRef(null);

  const emptyStateRef = useRef(null);
  const isEmptyStateInView = useInView(emptyStateRef, { once: true });

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] items-start gap-6 bg-background p-4 pb-12 font-sans sm:p-6 md:gap-6">
      <motion.header
        ref={ headerRef }
        initial={ { opacity: 0, y: -20 } }
        animate={ { opacity: isHeaderInView ? 1 : 0, y: isHeaderInView ? 0 : -20 } }
        transition={ { duration: 0.5 } }
        className="container mx-auto px-4 py-6"
      >
        <motion.h1
          initial={ { scale: 0.9 } }
          animate={ { scale: 1 } }
          transition={ { type: "spring", stiffness: 400, damping: 10 } }
          className="mb-3 text-center font-bold text-3xl text-foreground"
        >
          Outdoor Connect
        </motion.h1>
        <motion.p
          initial={ { opacity: 0 } }
          animate={ { opacity: 1 } }
          transition={ { delay: 0.2 } }
          className="mb-4 text-center text-muted-foreground"
        >
          Upload, view, edit, and analyze GPX tracks
        </motion.p>
      </motion.header>

      <main className="container mx-auto px-4">
        <motion.div
          variants={ containerVariants }
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Upload section - always at the top */ }
          <motion.section variants={ itemVariants } className="mb-4">
            <CollapsibleFileUploader />
          </motion.section>

          {/* Unified GPX Track Manager - moved to top */ }
          <motion.section variants={ itemVariants } className="mb-6">
            <GpxTrackManager />
          </motion.section>

          {/* Merge Highlight Section - show only when multiple files are selected */ }
          <AnimatePresence>
            { hasEnoughSelectedFiles && (
              <motion.section
                ref={ mergeRef }
                initial={ { opacity: 0, y: 40 } }
                animate={ { opacity: 1, y: 0 } }
                exit={ { opacity: 0, y: -20 } }
                transition={ { type: "spring", stiffness: 300, damping: 25 } }
                className="mt-8 mb-8"
              >
                <motion.div variants={ cardHoverVariants } initial="initial" whileHover="hover">
                  <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5 shadow-md">
                    <CardHeader className="bg-primary/10 pt-2 pb-6">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <motion.div
                          animate={ { rotate: [0, 10, -10, 10, 0] } }
                          transition={ {
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatDelay: 3,
                          } }
                        >
                          <Merge className="h-5 w-5" />
                        </motion.div>
                        Merge GPX Tracks
                      </CardTitle>
                      <CardDescription className="text-base">
                        Combine two or more GPX tracks to create custom routes and experiences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Selected for merging:</span>{ " " }
                            { selectedFileIds.length } of { storedFiles.length } files
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Select at least two files in the track manager above to enable merging
                          </p>
                        </div>
                        <div className="relative z-10 overflow-visible">
                          { hasEnoughSelectedFiles && (
                            <GlowEffect
                              colors={ ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"] }
                              mode="colorShift"
                              blur="medium"
                              duration={ 4 }
                              scale={ 1.03 }
                              className="z-0 opacity-50"
                            />
                          ) }
                          <motion.div whileTap={ { scale: 0.97 } }>
                            <Button
                              size="lg"
                              disabled={ !hasEnoughSelectedFiles }
                              className="relative z-10 border border-primary/50 bg-card text-primary hover:bg-primary/5"
                              asChild
                            >
                              <Link href="/merge" className="flex items-center gap-2">
                                <Merge className="h-5 w-5" />
                                { hasEnoughSelectedFiles
                                  ? "Merge Selected Tracks"
                                  : "Select Files to Merge" }
                              </Link>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.section>
            ) }
          </AnimatePresence>

          {/* Active file summary - show when a file is selected */ }
          <AnimatePresence>
            { hasActiveFile && (
              <motion.section
                variants={ itemVariants }
                initial={ { opacity: 0, height: 0 } }
                animate={ { opacity: 1, height: "auto" } }
                exit={ { opacity: 0, height: 0 } }
                transition={ { type: "spring", stiffness: 300, damping: 25 } }
                className="mt-4 mb-6"
              >
                <div className="sticky top-4 z-10">
                  <GpxInfo />
                </div>
              </motion.section>
            ) }
          </AnimatePresence>

          {/* Main GPX viewer section - only show when there's an active file */ }
          <AnimatePresence>
            { hasActiveFile && (
              <motion.section
                variants={ itemVariants }
                initial={ { opacity: 0 } }
                animate={ { opacity: 1 } }
                exit={ { opacity: 0 } }
                transition={ { duration: 0.4 } }
                className="mt-2 mb-8 space-y-6"
              >
                {/* Primary map view */ }
                <motion.div
                  initial={ { scale: 0.98, opacity: 0 } }
                  animate={ { scale: 1, opacity: 1 } }
                  transition={ { type: "spring", stiffness: 300, damping: 25, delay: 0.2 } }
                  className="mb-6"
                >
                  <GpxMap />
                </motion.div>

                {/* GPX editors */ }
                <motion.div
                  variants={ containerVariants }
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <motion.div variants={ itemVariants }>
                    <GpxMetadataEditor />
                  </motion.div>
                  <motion.div variants={ containerVariants } className="grid grid-cols-1 gap-6">
                    <motion.div variants={ itemVariants }>
                      <GpxPointEditor />
                    </motion.div>
                    <motion.div variants={ itemVariants }>
                      <GpxExporter />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.section>
            ) }
          </AnimatePresence>

          {/* Show a message when no active file is selected but files exist */ }
          <AnimatePresence>
            { !hasActiveFile && hasFiles && (
              <motion.section
                variants={ itemVariants }
                initial={ { opacity: 0, y: 30 } }
                animate={ { opacity: 1, y: 0 } }
                exit={ { opacity: 0, y: -30 } }
                transition={ { type: "spring", stiffness: 300, damping: 25 } }
                className="my-8 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 p-8"
              >
                <motion.div
                  initial={ { scale: 0.6, opacity: 0 } }
                  animate={ { scale: 1, opacity: 1 } }
                  transition={ { type: "spring", stiffness: 400, damping: 10, delay: 0.2 } }
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M12 18v-6" />
                    <path d="M9 15h6" />
                  </svg>
                </motion.div>
                <motion.h2
                  initial={ { y: 20, opacity: 0 } }
                  animate={ { y: 0, opacity: 1 } }
                  transition={ { delay: 0.3 } }
                  className="mb-3 font-semibold text-2xl"
                >
                  Select a file to view and edit
                </motion.h2>
                <motion.p
                  initial={ { y: 20, opacity: 0 } }
                  animate={ { y: 0, opacity: 1 } }
                  transition={ { delay: 0.4 } }
                  className="mb-6 max-w-md text-center text-muted-foreground"
                >
                  Click on a file in the track manager above to start working with it
                </motion.p>
              </motion.section>
            ) }
          </AnimatePresence>

          {/* Show a getting started message when no files exist at all */ }
          <AnimatePresence>
            { !hasFiles && (
              <motion.section
                ref={ emptyStateRef }
                initial={ { opacity: 0, y: 50 } }
                animate={ {
                  opacity: isEmptyStateInView ? 1 : 0,
                  y: isEmptyStateInView ? 0 : 50,
                } }
                transition={ { type: "spring", stiffness: 300, damping: 25 } }
                className="my-8 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 p-8"
              >
                <motion.div
                  animate={ { y: [0, -10, 0] } }
                  transition={ {
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2,
                    duration: 1.5,
                    ease: "easeInOut",
                  } }
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
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
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m8 17 4 4 4-4" />
                  </svg>
                </motion.div>
                <motion.h2
                  initial={ { y: 20, opacity: 0 } }
                  animate={ { y: 0, opacity: 1 } }
                  transition={ { delay: 0.3 } }
                  className="mb-3 font-semibold text-2xl"
                >
                  Get Started
                </motion.h2>
                <motion.p
                  initial={ { y: 20, opacity: 0 } }
                  animate={ { y: 0, opacity: 1 } }
                  transition={ { delay: 0.4 } }
                  className="mb-6 max-w-md text-center text-muted-foreground"
                >
                  Upload a GPX file using the uploader above to start viewing and editing your
                  tracks
                </motion.p>
              </motion.section>
            ) }
          </AnimatePresence>
        </motion.div>
      </main>

      <motion.footer
        initial={ { opacity: 0 } }
        animate={ { opacity: 1 } }
        transition={ { delay: 0.6 } }
        className="container mx-auto mt-6 border-border border-t px-4 py-4"
      >
        <div className="text-center text-muted-foreground text-sm">
          <p>Outdoor Connect - GPX Viewer & Editor</p>
          <p>Made with ❤️ by <Link href="https://outdoor.zealer.in" className="underline">Nishanth Murugan</Link></p>
        </div>
      </motion.footer>
    </div>
  );
}
