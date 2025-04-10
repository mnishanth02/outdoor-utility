"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateCenter } from "@/lib/gpx-utils";
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { GpxPoint } from "@/contexts/GpxContext";
import { Button } from "@/components/ui/button";

// Leaflet marker icon fix for Next.js
// This is needed because of how Next.js handles static assets
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

// Set default icon for all markers
if (typeof window !== "undefined") {
    L.Marker.prototype.options.icon = defaultIcon;
}

// Component to auto-adjust the map view to fit the route
function MapViewAdapter({
    points,
    shouldUpdate,
}: { points: Array<[number, number]>; shouldUpdate: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0 || !shouldUpdate) return;

        // If there's only one point, just center on it with a higher zoom level
        if (points.length === 1) {
            map.setView(points[0], 15, {
                animate: true,
                duration: 1,
            });
            return;
        }

        // Create a bounds object that includes all points
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [80, 80], // Increased padding for better view
            maxZoom: 18, // Higher max zoom
            animate: true,
            duration: 1, // Smoother animation
        });
    }, [map, points, shouldUpdate]);

    return null;
}

// Component that handles map events for adding new points or editing existing ones
function MapInteractionHandler({
    editMode,
    onMapClick,
}: {
    editMode: boolean;
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click: (e) => {
            if (editMode) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return null;
}

// Custom draggable marker
function DraggableMarker({
    position,
    index,
    icon,
    onDragEnd,
    onMarkerClick,
    isEditable,
}: {
    position: [number, number];
    index: number;
    icon: L.DivIcon | L.Icon;
    onDragEnd: (index: number, position: [number, number]) => void;
    onMarkerClick: (index: number) => void;
    isEditable: boolean;
}) {
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);

    useEffect(() => {
        setMarkerPosition(position);
    }, [position]);

    return (
        <Marker
            position={ markerPosition }
            icon={ icon }
            draggable={ isEditable }
            eventHandlers={ {
                dragend: (e) => {
                    const marker = e.target;
                    const position: [number, number] = [marker.getLatLng().lat, marker.getLatLng().lng];
                    setMarkerPosition(position);
                    onDragEnd(index, position);
                },
                click: () => onMarkerClick(index),
            } }
        />
    );
}

// Custom zoom control component that has access to the map
function ZoomControl({ coordinates }: { coordinates: Array<[number, number]> }) {
    const map = useMap();

    const resetMapView = () => {
        if (coordinates && coordinates.length > 0) {
            // Create a bounds object that includes all points in the route
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, {
                padding: [50, 50],  // Reduced padding for tighter fit
                maxZoom: 16,        // Default max zoom level for route overview
                animate: true,
                duration: 0.8,      // Slightly longer animation for smoother transition
            });
        } else {
            // If no coordinates, just reset to the current bounds
            const bounds = map.getBounds();
            map.fitBounds(bounds);
        }
    };

    // This function resets the map's rotation to north
    // (relevant when a user has rotated the map on touch devices)
    const orientToNorth = () => {
        map.setView(map.getCenter(), map.getZoom(), {
            animate: true,
            duration: 0.5,
        });
    };

    return (
        <div className="m-3 flex select-none flex-col gap-2">
            <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/95 font-semibold text-gray-700 text-xl shadow-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:bg-blue-100"
                title="Zoom in"
                aria-label="Zoom in"
                onClick={ (e) => {
                    e.preventDefault();
                    map.zoomIn();
                } }
            >
                +
            </button>
            <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/95 font-semibold text-gray-700 text-xl shadow-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:bg-blue-100"
                title="Zoom out"
                aria-label="Zoom out"
                onClick={ (e) => {
                    e.preventDefault();
                    map.zoomOut();
                } }
            >
                −
            </button>
            <div className="my-1 h-[1px] w-full bg-gray-200" />
            <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/95 font-semibold text-gray-700 text-sm shadow-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:bg-blue-100"
                title="Reset view to fit all points"
                aria-label="Reset view"
                onClick={ (e) => {
                    e.preventDefault();
                    resetMapView();
                } }
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                </svg>
            </button>
            <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/95 font-semibold text-gray-700 text-sm shadow-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:bg-blue-100"
                title="Reset map rotation (for touch devices)"
                aria-label="Reset map rotation"
                onClick={ (e) => {
                    e.preventDefault();
                    orientToNorth();
                } }
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2L12 22" />
                    <path d="M18 8L12 2 6 8" />
                </svg>
            </button>
        </div>
    );
}

interface LeafletMapProps {
    points: GpxPoint[];
    isEditing?: boolean;
    onPointsChange?: (updatedPoints: GpxPoint[]) => void;
    height?: string;
}

export default function LeafletMap({
    points,
    isEditing = false,
    onPointsChange,
    height = "400px",
}: LeafletMapProps) {
    const [editMode, setEditMode] = useState<boolean>(isEditing);
    const [editedPoints, setEditedPoints] = useState<GpxPoint[]>(points);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [shouldUpdateView, setShouldUpdateView] = useState<boolean>(true);
    // Add history state for undo functionality
    const [history, setHistory] = useState<GpxPoint[][]>([]);

    // Set up keyboard event handlers
    useEffect(() => {
        if (!editMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete key for deleting selected point
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIndex !== null) {
                if (canDeletePoint(selectedPointIndex)) {
                    handleDeletePoint();
                }
            }

            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z') {
                handleUndo();
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editMode, selectedPointIndex, history]);

    // Update internal editMode when the isEditing prop changes
    useEffect(() => {
        setEditMode(isEditing);
    }, [isEditing]);

    // Transform points for Leaflet - [lat, lon] format
    const coordinates: Array<[number, number]> = useMemo(
        () => editedPoints.map((point) => [point.lat, point.lon]),
        [editedPoints],
    );

    // Get start and end points
    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];

    // Calculate center point for initial map view
    const center = useMemo(() => calculateCenter(editedPoints), [editedPoints]);

    // Update local state when points prop changes
    useEffect(() => {
        setEditedPoints(points);
        setHistory([]); // Reset history when points change
        // Only update the view when points are loaded initially or when editing mode changes
        setShouldUpdateView(true);
    }, [points]);

    // Save current state to history before making changes
    const saveToHistory = (currentPoints: GpxPoint[]) => {
        setHistory(prev => [...prev, [...currentPoints]]);
    };

    // Handle undo action
    const handleUndo = () => {
        if (history.length === 0) return;

        const previousState = history[history.length - 1];
        setEditedPoints(previousState);
        setHistory(prev => prev.slice(0, -1));

        // Notify parent component if callback is provided
        if (onPointsChange) {
            onPointsChange(previousState);
        }
    };

    // Handle marker drag end
    const handleMarkerDragEnd = (index: number, position: [number, number]) => {
        // Save current state before making changes
        saveToHistory([...editedPoints]);

        const [lat, lon] = position;
        const newPoints = [...editedPoints];
        newPoints[index] = { ...newPoints[index], lat, lon };
        setEditedPoints(newPoints);
        setShouldUpdateView(false); // Don't adjust view when dragging

        // Notify parent component if callback is provided
        if (onPointsChange) {
            onPointsChange(newPoints);
        }
    };

    // Handle point selection
    const handlePointClick = (index: number) => {
        setSelectedPointIndex(index === selectedPointIndex ? null : index);
    };

    // Handle map click for adding new points
    const handleMapClick = (lat: number, lng: number) => {
        // Add point between selected point and the next one
        if (selectedPointIndex !== null && selectedPointIndex < editedPoints.length - 1) {
            // Save current state before making changes
            saveToHistory([...editedPoints]);

            const newPoint: GpxPoint = { lat, lon: lng };
            const newPoints = [...editedPoints];
            newPoints.splice(selectedPointIndex + 1, 0, newPoint);
            setEditedPoints(newPoints);
            setSelectedPointIndex(selectedPointIndex + 1);
            setShouldUpdateView(false); // Don't adjust view when adding points

            // Notify parent component
            if (onPointsChange) {
                onPointsChange(newPoints);
            }
        }
    };

    // Check if point can be deleted
    const canDeletePoint = (index: number): boolean => {
        return index !== null &&
            index !== 0 &&
            index !== editedPoints.length - 1 &&
            editedPoints.length > 2;
    };

    // Handle deleting a point
    const handleDeletePoint = () => {
        if (selectedPointIndex === null || editedPoints.length <= 2) return;

        // Don't delete start or end point
        if (selectedPointIndex === 0 || selectedPointIndex === editedPoints.length - 1) return;

        // Save current state before making changes
        saveToHistory([...editedPoints]);

        const newPoints = [...editedPoints];
        newPoints.splice(selectedPointIndex, 1);
        setEditedPoints(newPoints);
        setSelectedPointIndex(null);
        setShouldUpdateView(false); // Don't adjust view when deleting points

        // Notify parent component
        if (onPointsChange) {
            onPointsChange(newPoints);
        }
    };

    // Save changes
    const handleSaveChanges = () => {
        if (onPointsChange) {
            onPointsChange(editedPoints);
        }
        setEditMode(false);
        setShouldUpdateView(true); // Update view when saving changes
        setHistory([]); // Clear history when saving
    };

    return (
        <Card className="w-full overflow-hidden rounded-xl border-2 border-muted/20 shadow-md transition-duration-200 hover:border-muted-foreground/30">
            <CardContent className="p-0">
                <div className="relative w-full" style={ { height } }>
                    <MapContainer
                        center={ [center.lat, center.lon] }
                        zoom={ editMode ? 17 : 15 } // Higher zoom level when in edit mode
                        style={ { height: "100%", width: "100%" } }
                        attributionControl={ false }
                        zoomControl={ false } // Using custom zoom control
                    >
                        {/* Higher quality map tiles */ }
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Enhanced track styling */ }
                        <Polyline
                            positions={ coordinates }
                            color="#3b82f6"
                            weight={ 5 } // Thicker line
                            opacity={ 0.9 } // More opaque
                            smoothFactor={ 1.5 } // Smoother curves
                            className="drop-shadow-md"
                        />

                        {/* Render markers for all points in edit mode, or just start/end in view mode */ }
                        { editMode
                            ? editedPoints.map((_, index) => (
                                <DraggableMarker
                                    key={ `marker-${index}` }
                                    position={ coordinates[index] }
                                    index={ index }
                                    isEditable={ true }
                                    icon={
                                        index === 0
                                            ? L.divIcon({
                                                className:
                                                    "bg-green-500 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                                                iconSize: [20, 20],
                                                iconAnchor: [10, 10],
                                            })
                                            : index === editedPoints.length - 1
                                                ? L.divIcon({
                                                    className:
                                                        "bg-red-500 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                                                    iconSize: [20, 20],
                                                    iconAnchor: [10, 10],
                                                })
                                                : index === selectedPointIndex
                                                    ? L.divIcon({
                                                        className:
                                                            "bg-yellow-500 h-5 w-5 rounded-full border-2 border-white shadow-lg animate-pulse",
                                                        iconSize: [20, 20],
                                                        iconAnchor: [10, 10],
                                                    })
                                                    : L.divIcon({
                                                        className:
                                                            "bg-blue-500 h-4 w-4 rounded-full border-2 border-white shadow-md",
                                                        iconSize: [16, 16],
                                                        iconAnchor: [8, 8],
                                                    })
                                    }
                                    onDragEnd={ handleMarkerDragEnd }
                                    onMarkerClick={ handlePointClick }
                                />
                            ))
                            : [
                                <DraggableMarker
                                    key="start-marker"
                                    position={ startPoint }
                                    index={ 0 }
                                    isEditable={ false }
                                    icon={ L.divIcon({
                                        className:
                                            "bg-green-500 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                                        iconSize: [20, 20],
                                        iconAnchor: [10, 10],
                                    }) }
                                    onDragEnd={ handleMarkerDragEnd }
                                    onMarkerClick={ handlePointClick }
                                />,
                                <DraggableMarker
                                    key="end-marker"
                                    position={ endPoint }
                                    index={ editedPoints.length - 1 }
                                    isEditable={ false }
                                    icon={ L.divIcon({
                                        className: "bg-red-500 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                                        iconSize: [20, 20],
                                        iconAnchor: [10, 10],
                                    }) }
                                    onDragEnd={ handleMarkerDragEnd }
                                    onMarkerClick={ handlePointClick }
                                />,
                            ] }

                        {/* Map interaction handler for adding/editing points */ }
                        { editMode && <MapInteractionHandler editMode={ editMode } onMapClick={ handleMapClick } /> }

                        {/* Auto-fit the map to the track */ }
                        <MapViewAdapter points={ coordinates } shouldUpdate={ shouldUpdateView } />

                        {/* Add custom zoom control in top-left position */ }
                        <div className="leaflet-control-container">
                            <div className="leaflet-top leaflet-left">
                                <div className="leaflet-control">
                                    <ZoomControl coordinates={ coordinates } />
                                </div>
                            </div>
                        </div>
                    </MapContainer>

                    {/* Map controls with improved styling */ }
                    { isEditing && (
                        <div className="absolute right-4 bottom-4 z-[1000] flex gap-2">
                            { editMode ? (
                                <>
                                    { selectedPointIndex !== null &&
                                        canDeletePoint(selectedPointIndex) && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={ handleDeletePoint }
                                                className="bg-white font-medium text-red-500 shadow-lg transition-all duration-200 hover:bg-red-50"
                                            >
                                                Delete Point
                                            </Button>
                                        ) }
                                    { history.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={ handleUndo }
                                            className="border-blue-200 bg-white/95 font-medium shadow-lg transition-all duration-200 hover:bg-blue-50"
                                            title="Undo last change (Ctrl+Z)"
                                        >
                                            Undo
                                        </Button>
                                    ) }
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={ handleSaveChanges }
                                        className="border-blue-200 bg-white/95 font-medium shadow-lg transition-all duration-200 hover:bg-blue-50"
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={ () => setEditMode(true) }
                                    className="border-blue-200 bg-white/95 font-medium shadow-lg transition-all duration-200 hover:bg-blue-50"
                                >
                                    Edit Route
                                </Button>
                            ) }
                        </div>
                    ) }

                    {/* Instructions with improved styling */ }
                    { editMode && (
                        <div className="absolute top-4 left-4 z-[1000] max-w-xs rounded-md border border-blue-100 bg-white/95 p-3 text-xs shadow-lg">
                            <p className="mb-2 font-bold text-blue-700">Editing instructions:</p>
                            <ul className="list-disc space-y-1.5 pl-4 text-gray-700">
                                <li>Drag any point to adjust the route</li>
                                <li>
                                    Select a point (click on it) and click on the map to add a new point after it
                                </li>
                                <li>Select a middle point and press Delete key or use the Delete button</li>
                                <li>Press Ctrl+Z to undo your last change</li>
                                <li>Start and end points cannot be deleted</li>
                            </ul>
                        </div>
                    ) }
                </div>
            </CardContent>
        </Card>
    );
}
