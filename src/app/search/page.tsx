// This file is no longer needed for search, but is kept for routing purposes.
// The search results are now displayed inline on the main page.
import { DopamineApp } from "@/components/DopamineApp";
import { Suspense } from "react";

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
           <DopamineApp defaultView="projects" />
        </Suspense>
    )
}
