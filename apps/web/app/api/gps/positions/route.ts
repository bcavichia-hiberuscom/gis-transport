// app/api/gps/positions/route.ts
//
// GPS Position API - Returns current vehicle positions
//
// ARCHITECTURE NOTE:
// This endpoint is designed to be the ONLY place that needs modification
// when switching from mock data to real GPS devices.

import { NextResponse } from "next/server";
import { RoadService } from "@/lib/services/road-service";
import { VehicleTrackingService } from "@/lib/services/vehicle-tracking-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selectedVehicleId = searchParams.get("vehicleId");

  if (!VehicleTrackingService.isRunning()) {
    return NextResponse.json({
      positions: {},
      metrics: {},
      timestamp: Date.now(),
    });
  }

  const positions: Record<string, [number, number]> = {};
  const metrics: Record<string, any> = {};

  const allPositions = VehicleTrackingService.getAllPositions();
  const allTelemetry = VehicleTrackingService.getAllTelemetry();
  const completedJobs = VehicleTrackingService.getCompletedJobs();
  const recentEvents = VehicleTrackingService.getRecentEvents();

  // Process read-only snapshot
  const updates = Object.entries(allPositions).map(
    async ([vehicleId, data]) => {
      const tel = allTelemetry[vehicleId];

      if (tel) {
        positions[vehicleId] = data.coords;

        // Use deterministic speed from telemetry
        const speed = tel.speed || 0;

        // Fetch road info ONLY for the selected vehicle AND if it's moving
        let roadInfo: any = {};
        if (String(vehicleId) === String(selectedVehicleId) && speed > 0) {
          try {
            roadInfo = await RoadService.getMaxSpeed(
              data.coords[0],
              data.coords[1],
            );
          } catch {
            // Silently continue — RoadService handles its own backoff
          }
        }

        metrics[vehicleId] = {
          speed,
          ...(roadInfo.maxSpeed !== undefined && {
            maxSpeed: roadInfo.maxSpeed,
          }),
          address: roadInfo.roadName || undefined,
          fuelLevel: tel.isElectric ? undefined : Math.round(tel.fuel || 0),
          batteryLevel: tel.isElectric
            ? Math.round(tel.battery || 0)
            : undefined,
          distanceTotal: Math.round(tel.distance * 1000), // in meters
          health: 100,
          status: speed > 0 ? "active" : "idle",
          movementState: speed > 0 ? "on_route" : "stopped",
          updatedAt: Date.now(),
        };
      }
    },
  );

  await Promise.all(updates);

  return NextResponse.json({
    positions,
    metrics,
    completedJobs: Array.from(completedJobs),
    recentEvents,
    timestamp: Date.now(),
  });
}
