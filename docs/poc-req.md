# 1. Refined Requirements for the POC

This focuses on proving the core mechanics are feasible without getting bogged down in production-level details.

**Goal:** Demonstrate the ability to upload, visualize, map, perform basic edits/merges, and export GPX files within a Next.js application using client-side logic primarily, leveraging Server Actions for file uploads.

**Core Functionality:**

1.  **GPX File Upload:**
    * Allow users to upload a *single* GPX file using a standard file input.
    * Use a Next.js Server Action to receive the file upload.
    * Validate the uploaded file (basic check for `.gpx` extension and perhaps size limit).
    * *POC Limitation:* Initially focus on handling one file at a time for viewing/editing. Merging will handle multiple files sequentially.
2.  **GPX Data Parsing:**
    * Parse the uploaded GPX file content (XML) on the client-side after the Server Action makes it available (e.g., returns the content or a temporary URL).
    * Use a JavaScript/TypeScript library (e.g., `xml2js`) to extract key information:
        * Metadata (name, description, time).
        * Track points (latitude, longitude, elevation, timestamp for each point).
3.  **Data Visualization:**
    * Display key metadata extracted from the GPX file (name, description).
    * Show calculated statistics (Total Distance, Duration, Average Speed, Elevation Gain/Loss). Calculate these client-side from the parsed track points.
    * Present this information using Shadcn UI components (e.g., `Card`, `Table`).
4.  **Map Visualization:**
    * Integrate a mapping library react-leaflet into a React component.
    * Draw the GPX track as a polyline on the map based on the parsed coordinates.
    * Ensure the map automatically adjusts zoom/center to fit the entire route.
5.  **Map Interactivity:**
    * Standard map controls (zoom, pan) and other default and madate functionality.
    * *POC Stretch Goal:* Highlight a point on the map when hovering over corresponding data elsewhere, or vice-versa (though this might add complexity). Keep it simple initially.
6.  **GPX Data Modification:**
    * **Metadata Editing:** Allow users to edit the GPX metadata (e.g., track name, description) using input fields (React Hook Form + Zod for validation).
    * **Route Editing (Basic):** Implement a simple way to modify the route. *Suggestion for POC:* Allow users to select and *delete* individual track points. Display points perhaps in a list or allow clicking on the map (simpler: list). Full drag-and-drop editing is likely too complex for the initial POC.
7.  **GPX File Merging:**
    * Provide a mechanism to load a *second* GPX file while one is already loaded.
    * Implement logic to combine the track points from both files into a single track sequence. Consider how to handle timestamps and potential overlaps/gaps (for POC, simple concatenation might suffice, perhaps sorting by timestamp if available).
    * Allow editing (metadata update, point deletion) *after* the merge.
    * The merged data should replace the currently loaded data in the UI and on the map.
8.  **GPX File Export:**
    * Generate a valid GPX XML string from the current state of the data (either the originally uploaded but modified data, or the merged and modified data).
    * Allow the user to download this generated content as a `.gpx` file.

**Technical Stack Implementation:**

* **Frontend:** Next.js (App Router), React, TypeScript.
* **UI:** Shadcn UI components.
* **Forms:** React Hook Form for editing metadata, with Zod for schema validation.
* **Server Logic:** Next.js Server Actions primarily for handling the initial file upload securely.
* **State Management:** Client-side React state (`useState`, `useReducer`, or Context API) to hold the parsed and potentially modified GPX data. *No database.* Data will be lost on browser refresh.
* **Mapping Library:** Leaflet (recommended for simplicity/open-source) or Mapbox GL JS.
* **GPX Parsing/Generation:** A suitable JavaScript library.

---