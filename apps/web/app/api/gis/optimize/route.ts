// app/api/v1/optimize/route.ts
import { NextResponse } from "next/server";
import { RoutingService } from "@/lib/services/routing-service";
import { GisDataService } from "@/lib/services/gis-data-service";
import {
  FleetVehicle,
  FleetJob,
  RouteData,
  VehicleRoute,
  RouteWeather,
  WeatherAlert,
  Zone,
  IGisResponse,
  GisDashboardData,
  OptimizeOptions,
} from "@gis/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vehicles, jobs, startTime, zones, preference, traffic, isSimulation, avoidPoorSmoothness } = body as {
      vehicles: FleetVehicle[];
      jobs: FleetJob[];
      isSimulation?: boolean;
    } & OptimizeOptions;

    if (!vehicles || !jobs) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Missing vehicles or jobs" },
        } as IGisResponse,
        { status: 400 },
      );
    }

    if (!isSimulation) {
      // Backend validation: Only vehicles that will be routed need an assigned driver
      // This allows users to manage their fleet individually without requiring all vehicles to have drivers
      console.log("[route.ts] Vehicles received:", vehicles.map((v: any) => ({
        id: v.id,
        label: v.label,
        hasDriver: !!v.driver,
        driverId: v.driver?.id,
        driverName: v.driver?.name,
        hasDriverId: !!v.driverId,
        hasAssignedDriverId: !!v.assignedDriverId,
      })));

      const vehiclesWithoutDriver = vehicles.filter((v: any) => {
        // Check multiple ways a driver might be assigned:
        // 1. driver object exists and has an id
        // 2. driverId property exists
        // 3. assignedDriverId property exists
        const hasDriverObject = v.driver && (v.driver.id || v.driver.name);
        const hasDriverId = v.driverId || v.assignedDriverId;

        return !hasDriverObject && !hasDriverId;
      });

      if (vehiclesWithoutDriver.length > 0) {
        console.error("[route.ts] Vehicles without driver:", vehiclesWithoutDriver.map((v: any) => ({
          id: v.id,
          label: v.label,
          driver: v.driver,
          driverId: v.driverId,
          assignedDriverId: v.assignedDriverId,
        })));

        // Build a more helpful error message
        const vehicleLabels = vehiclesWithoutDriver.map((v: any) => v.label).join(", ");

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: `Por favor, asigna un conductor a los siguientes vehículos antes de optimizar: ${vehicleLabels}`
            },
          } as IGisResponse,
          { status: 400 },
        );
      }
    }

    const routeData: RouteData = await RoutingService.optimize(vehicles, jobs, {
      startTime,
      zones,
      preference,
      traffic,
      // Health route ALWAYS avoids poor smoothness areas - it's the whole point!
      avoidPoorSmoothness: preference === "health" ? true : avoidPoorSmoothness,
    });

    const vehicleRoutes: VehicleRoute[] = routeData.vehicleRoutes || [];
    const weatherRoutes: RouteWeather[] = routeData.weatherRoutes || [];

    // 2. Build context for persistence
    const context: GisDashboardData = {
      meta: {
        generatedAt: new Date().toISOString(),
      },
      fleet: {
        totalVehicles: vehicles.length,
        activeVehicles: vehicleRoutes.length,
        vehiclesByType: vehicles.reduce(
          (acc: Record<string, number>, v: FleetVehicle) => ({
            ...acc,
            [v.type.id]: (acc[v.type.id] || 0) + 1,
          }),
          {},
        ),
        vehicles: vehicles.map((v: FleetVehicle) => ({
          id: v.id,
          type: v.type.id,
          label: v.label, // Use v.label now
          position: v.position, // Use v.position now
        })),
      },
      optimization: {
        status: "optimized",
        totalJobs: jobs.length,
        assignedJobs: vehicleRoutes.reduce(
          (acc: number, r: VehicleRoute) => acc + (r.jobsAssigned || 0),
          0,
        ),
        unassignedJobs:
          jobs.length -
          vehicleRoutes.reduce(
            (acc: number, r: VehicleRoute) => acc + (r.jobsAssigned || 0),
            0,
          ),
        routes: vehicleRoutes.map((r: VehicleRoute) => ({
          vehicleId: r.vehicleId,
          jobsAssigned: r.jobsAssigned,
          distanceFormatted: `${(r.distance / 1000).toFixed(1)} km`,
          durationFormatted: `${Math.floor(r.duration / 3600)}h ${Math.floor(
            (r.duration % 3600) / 60,
          )}m`,
          startPoint: r.coordinates[0],
          endPoint: r.coordinates[r.coordinates.length - 1],
        })),
        totals: {
          distanceFormatted: `${(routeData.distance / 1000).toFixed(1)} km`,
          durationFormatted: `${Math.floor(
            routeData.duration / 3600,
          )}h ${Math.floor((routeData.duration % 3600) / 60)}m`,
        },
      },
      weather: {
        overallRisk: weatherRoutes.some(
          (r: RouteWeather) => r.riskLevel === "HIGH",
        )
          ? "HIGH"
          : weatherRoutes.some((r: RouteWeather) => r.riskLevel === "MEDIUM")
            ? "MEDIUM"
            : "LOW",
        alertCount: weatherRoutes.reduce(
          (acc: number, r: RouteWeather) => acc + (r.alerts?.length || 0),
          0,
        ),
        alertsByType: {},
        affectedRoutes: weatherRoutes.filter(
          (r: RouteWeather) => r.alerts?.length > 0,
        ).length,
        alerts: weatherRoutes.flatMap((r: RouteWeather) =>
          r.alerts.map((a: WeatherAlert) => ({
            vehicleId: r.vehicle,
            event: a.event,
            severity: a.severity,
            location: [a.lat, a.lon] as [number, number],
            message: a.message,
            timeWindow: a.timeWindow || new Date().toISOString(),
          })),
        ),
      },
    };

    // 3. Persist background snapshot ONLY on real assignment launch (not simulation)
    if (!isSimulation) {
      GisDataService.saveSnapshot(context).catch((err: unknown) =>
        console.error("Failed to save background snapshot in orchestrator", err),
      );
    }

    return NextResponse.json({
      success: true,
      data: routeData,
    } as IGisResponse<RouteData>);
  } catch (error) {
    console.error("Orchestrator error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: (error as Error).message,
        },
      } as IGisResponse,
      { status: 500 },
    );
  }
}
