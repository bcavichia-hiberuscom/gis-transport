"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Car,
  Plus,
  Trash2,
  X,
  MapPinned,
  Package,
} from "lucide-react";
import type { LayerVisibility, VehicleType } from "@/lib/types";
import { VEHICLE_TYPES } from "@/lib/types";

interface FleetJob {
  id: string;
  coords: [number, number];
  label: string;
}

interface FleetVehicle {
  id: string;
  coords: [number, number];
  type: VehicleType;
}

interface SidebarProps {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  selectedVehicle: VehicleType;
  setSelectedVehicle: (vehicle: VehicleType) => void;
  fleetMode: boolean;
  setFleetMode: (value: boolean) => void;
  clearFleet: () => void;
  fleetVehicles: FleetVehicle[];
  fleetJobs: FleetJob[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  addVehicle: () => void;
  addJob: () => void;
  removeVehicle: (vehicleId: string) => void;
  removeJob: (jobId: string) => void;
  addMode: "vehicle" | "job" | null;
  cancelAddMode: () => void;
}

export function Sidebar({
  layers,
  toggleLayer,
  selectedVehicle,
  setSelectedVehicle,
  fleetMode,
  setFleetMode,
  clearFleet,
  fleetVehicles,
  fleetJobs,
  selectedVehicleId,
  setSelectedVehicleId,
  addVehicle,
  addJob,
  removeVehicle,
  removeJob,
  addMode,
  cancelAddMode,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`relative z-10 flex h-full flex-col border-r border-border bg-card transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-20 h-6 w-6 rounded-full border border-border bg-card shadow-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {!isCollapsed && (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              Fleet Manager Demo
            </h1>
          </div>

          <Separator />

          {/* Fleet Mode Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fleet Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fleet-mode" className="text-sm">
                  Activate Fleet Mode
                </Label>
                <Switch
                  id="fleet-mode"
                  checked={fleetMode}
                  onCheckedChange={setFleetMode}
                />
              </div>

              {fleetMode && (
                <div className="mt-4 space-y-3">
                  {/* Add Mode Indicator */}
                  {addMode && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {addMode === "vehicle"
                              ? "Adding Vehicle"
                              : "Adding Job"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={cancelAddMode}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Click on the map to place{" "}
                        {addMode === "vehicle" ? "a new vehicle" : "a new job"}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addVehicle}
                      disabled={!!addMode}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Vehicle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addJob}
                      disabled={!!addMode}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Job
                    </Button>
                  </div>

                  {/* Fleet Summary */}
                  <div className="p-2 bg-muted rounded-lg text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total Vehicles:</span>
                      <span className="font-medium">
                        {fleetVehicles.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Jobs:</span>
                      <span className="font-medium">{fleetJobs.length}</span>
                    </div>
                  </div>

                  {/* Vehicle Type Selector */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Vehicle Type for New Vehicles
                    </Label>
                    <select
                      value={selectedVehicle.id}
                      onChange={(e) => {
                        const vehicle = VEHICLE_TYPES.find(
                          (v) => v.id === e.target.value
                        );
                        if (vehicle) setSelectedVehicle(vehicle);
                      }}
                      className="w-full p-2 text-sm border rounded-lg bg-background"
                    >
                      {VEHICLE_TYPES.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Separator />

                  {/* Vehicles List */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Vehicles ({fleetVehicles.length})
                    </Label>

                    {fleetVehicles.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground bg-muted/50 rounded-lg">
                        No vehicles. Click "Add Vehicle".
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {fleetVehicles.map((vehicle) => (
                          <Card
                            key={vehicle.id}
                            className={`cursor-pointer transition-all ${
                              selectedVehicleId === vehicle.id
                                ? "ring-2 ring-primary"
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => setSelectedVehicleId(vehicle.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-primary" />
                                <div>
                                  <span className="font-medium text-sm">
                                    {vehicle.type.label}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {vehicle.coords[0].toFixed(4)},{" "}
                                    {vehicle.coords[1].toFixed(4)}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVehicle(vehicle.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Jobs List */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Jobs ({fleetJobs.length})
                    </Label>

                    {fleetJobs.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground bg-muted/50 rounded-lg">
                        No jobs. Click "Add Job".
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {fleetJobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3 text-purple-600" />
                              <div>
                                <span className="text-sm font-medium">
                                  {job.label}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {job.coords[0].toFixed(4)},{" "}
                                  {job.coords[1].toFixed(4)}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeJob(job.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={clearFleet}
                    disabled={
                      fleetVehicles.length === 0 && fleetJobs.length === 0
                    }
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Layer Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(layers).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{key}</Label>
                  <Switch
                    checked={value}
                    onCheckedChange={() =>
                      toggleLayer(key as keyof LayerVisibility)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
