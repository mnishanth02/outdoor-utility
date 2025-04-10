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
function MapViewAdapter({ points, shouldUpdate }: { points: Array<[number, number]>; shouldUpdate: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0 || !shouldUpdate) return;

        // If there's only one point, just center on it
        if (points.length === 1) {
            map.setView(points[0], 13);
            return;
        }

        // Create a bounds object that includes all points
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
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
        // Only update the view when points are loaded initially or when editing mode changes
        setShouldUpdateView(true);
    }, [points]);

    // Handle marker drag end
    const handleMarkerDragEnd = (index: number, position: [number, number]) => {
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

    // Handle deleting a point
    const handleDeletePoint = () => {
        if (selectedPointIndex === null || editedPoints.length <= 2) return;

        // Don't delete start or end point
        if (selectedPointIndex === 0 || selectedPointIndex === editedPoints.length - 1) return;

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
    };

    return (
        <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
                <div className={ "relative w-full" } style={ { height } }>
                    <MapContainer
                        center={ [center.lat, center.lon] }
                        zoom={ 13 }
                        style={ { height: "100%", width: "100%" } }
                        attributionControl={ false }
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Draw the track as a polyline */ }
                        <Polyline positions={ coordinates } color="#3b82f6" weight={ 4 } opacity={ 0.8 } />

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
                                                className: "bg-green-500 h-4 w-4 rounded-full border-2 border-white",
                                                iconSize: [16, 16],
                                                iconAnchor: [8, 8],
                                            })
                                            : index === editedPoints.length - 1
                                                ? L.divIcon({
                                                    className: "bg-red-500 h-4 w-4 rounded-full border-2 border-white",
                                                    iconSize: [16, 16],
                                                    iconAnchor: [8, 8],
                                                })
                                                : index === selectedPointIndex
                                                    ? L.divIcon({
                                                        className:
                                                            "bg-yellow-500 h-4 w-4 rounded-full border-2 border-white",
                                                        iconSize: [16, 16],
                                                        iconAnchor: [8, 8],
                                                    })
                                                    : L.divIcon({
                                                        className: "bg-blue-500 h-3 w-3 rounded-full border-2 border-white",
                                                        iconSize: [12, 12],
                                                        iconAnchor: [6, 6],
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
                                        className: "bg-green-500 h-4 w-4 rounded-full border-2 border-white",
                                        iconSize: [16, 16],
                                        iconAnchor: [8, 8],
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
                                        className: "bg-red-500 h-4 w-4 rounded-full border-2 border-white",
                                        iconSize: [16, 16],
                                        iconAnchor: [8, 8],
                                    }) }
                                    onDragEnd={ handleMarkerDragEnd }
                                    onMarkerClick={ handlePointClick }
                                />,
                            ] }

                        {/* Map interaction handler for adding/editing points */ }
                        { editMode && (
                            <MapInteractionHandler
                                editMode={ editMode }
                                onMapClick={ handleMapClick }
                            />
                        ) }

                        {/* Auto-fit the map to the track */ }
                        <MapViewAdapter points={ coordinates } shouldUpdate={ shouldUpdateView } />
                    </MapContainer>

                    {/* Map controls */ }
                    { isEditing && (
                        <div className="absolute right-4 bottom-4 z-[1000] flex gap-2">
                            { editMode ? (
                                <>
                                    { selectedPointIndex !== null &&
                                        selectedPointIndex !== 0 &&
                                        selectedPointIndex !== editedPoints.length - 1 && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={ handleDeletePoint }
                                                className="bg-white text-red-500 hover:bg-red-50"
                                            >
                                                Delete Point
                                            </Button>
                                        ) }
                                    <Button size="sm" variant="outline" onClick={ handleSaveChanges }>
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" onClick={ () => setEditMode(true) }>
                                    Edit Route
                                </Button>
                            ) }
                        </div>
                    ) }

                    {/* Instructions */ }
                    { editMode && (
                        <div className="absolute top-4 left-4 z-[1000] max-w-xs rounded-md bg-white bg-opacity-90 p-2 text-xs shadow-md">
                            <p className="mb-1 font-bold">Editing instructions:</p>
                            <ul className="list-disc space-y-1 pl-4">
                                <li>Drag start, end, or intermediate points to adjust the route</li>
                                <li>Select a point and click on the map to add a new point after it</li>
                                <li>Select an intermediate point and press the Delete button to remove it</li>
                                <li>Start and end points cannot be deleted</li>
                            </ul>
                        </div>
                    ) }
                </div>
            </CardContent>
        </Card>
    );
}
