// app/api/gps/simulate/route.ts
//
// GPS Simulation Control API
//
// This endpoint manages the simulation of vehicle movement along routes.
// When real GPS devices are integrated, this endpoint can be removed
// or repurposed for testing.

import { NextResponse } from "next/server";
import { VehicleTrackingService } from "@/lib/services/vehicle-tracking-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { routes, jobs, action } = body;

    if (action === "start" && routes) {
      const count = VehicleTrackingService.startSimulation(routes, jobs);
      return NextResponse.json({
        success: true,
        message: "Simulation started",
        vehicles: count,
      });
    }

    if (action === "stop") {
      VehicleTrackingService.stopSimulation();
      return NextResponse.json({
        success: true,
        message: "Simulation stopped",
      });
    }

    if (action === "update" && routes) {
      const count = VehicleTrackingService.updateRoutes(routes, jobs);
      return NextResponse.json({
        success: true,
        message: "Simulation routes updated",
        vehicles: count,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("GPS Simulation error:", err);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
