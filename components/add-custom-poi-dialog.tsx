"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Target, Loader2 } from "lucide-react";
import { AddressSearch } from "@/components/address-search";

interface AddCustomPOIDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    coords: [number, number],
    description?: string
  ) => void;
  onStartPicking?: () => void;
  pickedCoords?: [number, number] | null;
  mapCenter?: [number, number];
  isLoading?: boolean;
}

export function AddCustomPOIDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onStartPicking,
  pickedCoords,
  mapCenter = [40.4168, -3.7038],
  isLoading = false,
}: AddCustomPOIDialogProps) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState(mapCenter[0].toString());
  const [longitude, setLongitude] = useState(mapCenter[1].toString());
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Actualizar coordenadas cuando se selecciona en el mapa
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

    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }

    if (lon < -180 || lon > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }

    onSubmit(name.trim(), [lat, lon], description.trim() || undefined);

    // Reset form
    setName("");
    setLatitude(mapCenter[0].toString());
    setLongitude(mapCenter[1].toString());
    setDescription("");
    setError(null);
  };

  const handleUseMapCenter = () => {
    setLatitude(mapCenter[0].toString());
    setLongitude(mapCenter[1].toString());
  };

  const handlePickFromMap = () => {
    if (onStartPicking) {
      onStartPicking();
    } else {
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Add Custom POI
          </DialogTitle>
          <DialogDescription>
            Create a custom point of interest like a warehouse or facility
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Geocoding Search */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Search Address</Label>
            <AddressSearch
              onSelectLocation={(coords: [number, number], address: string) => {
                setLatitude(coords[0].toFixed(6));
                setLongitude(coords[1].toFixed(6));
              }}
              placeholder="Search for a location..."
              className="w-full"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pinpoint manually</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poi-name" className="text-sm font-semibold">POI Name *</Label>
              <Input
                id="poi-name"
                placeholder="e.g., Amazon Warehouse (or leave empty for default)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  id="poi-lat"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={isLoading}
                  type="number"
                  step="any"
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  id="poi-lon"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={isLoading}
                  type="number"
                  step="any"
                  className="h-9 text-sm font-mono"
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

          <div className="space-y-2">
            <Label htmlFor="poi-description" className="text-sm font-semibold">Description (optional)</Label>
            <Textarea
              id="poi-description"
              placeholder="Add any notes about this location..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add POI"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
