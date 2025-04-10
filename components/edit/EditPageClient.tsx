"use client";

import { GpxEditor } from "@/components/gpx/GpxEditor";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            when: "beforeChildren",
            staggerChildren: 0.2,
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

export function EditPageClient({ id }: { id: string }) {
    return (
        <motion.div
            variants={ containerVariants }
            initial="hidden"
            animate="visible"
            className="w-full"
        >
            <motion.div variants={ itemVariants }>
                <GpxEditor id={ id } />
            </motion.div>
        </motion.div>
    );
}