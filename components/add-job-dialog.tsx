"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Package, Target, MapPin, Loader2 } from "lucide-react";
import { AddressSearch } from "@/components/address-search";

interface AddJobDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (coords: [number, number], label: string) => void;
    onStartPicking?: () => void;
    pickedCoords?: [number, number] | null;
    mapCenter?: [number, number];
    isLoading?: boolean;
}

export function AddJobDialog({
    isOpen,
    onOpenChange,
    onSubmit,
    onStartPicking,
    pickedCoords,
    mapCenter = [40.4168, -3.7038],
    isLoading = false,
}: AddJobDialogProps) {
    const [label, setLabel] = useState("");
    const [latitude, setLatitude] = useState(mapCenter[0].toString());
    const [longitude, setLongitude] = useState(mapCenter[1].toString());
    const [error, setError] = useState<string | null>(null);

    // Sync coords when picked from map
    useEffect(() => {
        if (pickedCoords) {
            setLatitude(pickedCoords[0].toFixed(6));
            setLongitude(pickedCoords[1].toFixed(6));
        }
    }, [pickedCoords]);

    const handleSubmit = () => {
        setError(null);

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
            setError("Please enter valid coordinates");
            return;
        }

        onSubmit([lat, lon], label.trim());

        // Reset
        setLabel("");
        setLatitude(mapCenter[0].toString());
        setLongitude(mapCenter[1].toString());
        setError(null);
    };

    const handlePickFromMap = () => {
        if (onStartPicking) {
            onStartPicking();
        }
    };

    const handleAddressSelect = (coords: [number, number], address: string) => {
        setLatitude(coords[0].toFixed(6));
        setLongitude(coords[1].toFixed(6));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        Add New Job
                    </DialogTitle>
                    <DialogDescription>
                        Search for an address or pick a precise location on the map.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Address Search Integrated */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Search Address</Label>
                        <AddressSearch
                            onSelectLocation={handleAddressSelect}
                            placeholder="Start typing an address..."
                            className="w-full"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or pinpoint location</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="job-label" className="text-sm font-semibold">Job Label *</Label>
                            <Input
                                id="job-label"
                                placeholder="e.g., Delivery to Client A (or leave empty)"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Latitude</Label>
                                <Input
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    type="number"
                                    step="any"
                                    className="h-9 text-sm font-mono"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Longitude</Label>
                                <Input
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    type="number"
                                    step="any"
                                    className="h-9 text-sm font-mono"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 border-dashed"
                            onClick={handlePickFromMap}
                            disabled={isLoading}
                        >
                            <Target className="h-4 w-4 mr-2" />
                            Pick Exact Point on Map
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none"
                        >
                            {isLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                            ) : (
                                "Add Job"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
