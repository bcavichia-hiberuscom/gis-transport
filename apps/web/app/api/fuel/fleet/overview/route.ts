import { NextRequest, NextResponse } from "next/server";
import {
    FleetFuelOverview,
    FleetFuelOverviewSchema,
} from "@gis/shared";
import { DriverService } from "@/lib/services/driver-service";

/**
 * GET /api/fuel/fleet/overview
 * Returns fleet-wide fuel consumption overview and discrepancy analysis
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = parseInt(searchParams.get("startDate") || "0");
        const endDate = parseInt(searchParams.get("endDate") || "0");

        if (!startDate || !endDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_PARAMS",
                        message: "startDate and endDate are required",
                    },
                },
                { status: 400 }
            );
        }

        // Fetch real drivers to make IDs match and clicks work
        const realDrivers = await DriverService.getAllDrivers();
        const getDriverId = (index: number, fallback: string) => {
            return realDrivers[index]?.id || fallback;
        };
        const getDriverName = (index: number, fallback: string) => {
            return realDrivers[index]?.name || fallback;
        };

        // For now, return mock data structure with realistic scenarios
        const overview: FleetFuelOverview = {
            period: {
                start: startDate,
                end: endDate,
            },
            totals: {
                declaredLiters: 12450,
                expectedLiters: 11890,
                discrepancyLiters: 560,
                discrepancyPercentage: 4.7,
                totalCost: 18675.5,
                transactionCount: 156,
                estimatedLossEuro: 840,
            },
            statusBreakdown: {
                compliant: 142,
                review: 11,
                flagged: 3,
            },
            topDiscrepancies: [
                {
                    driverId: getDriverId(0, "DRV-00234"),
                    driverName: getDriverName(0, "Juan Pérez"),
                    discrepancyLiters: 85,
                    discrepancyPercentage: 12.3,
                    flagCount: 2,
                },
                {
                    driverId: getDriverId(1, "DRV-00189"),
                    driverName: getDriverName(1, "María González"),
                    discrepancyLiters: 62,
                    discrepancyPercentage: 9.8,
                    flagCount: 1,
                },
                {
                    driverId: getDriverId(2, "DRV-00421"),
                    driverName: getDriverName(2, "Carlos Martínez"),
                    discrepancyLiters: 48,
                    discrepancyPercentage: 7.2,
                    flagCount: 1,
                },
                {
                    driverId: getDriverId(3, "DRV-00512"),
                    driverName: getDriverName(3, "Ana López"),
                    discrepancyLiters: 35,
                    discrepancyPercentage: 5.8,
                    flagCount: 1,
                },
                {
                    driverId: getDriverId(4, "DRV-00678"),
                    driverName: getDriverName(4, "Pedro Sánchez"),
                    discrepancyLiters: 28,
                    discrepancyPercentage: 4.9,
                    flagCount: 0,
                },
            ],
            trendData: Array.from({ length: 12 }).map((_, i) => {
                const date = new Date(Date.now() - (11 - i) * 86400000 * 7);
                const base = 2000 + Math.random() * 500;
                const disc = i % 4 === 0 ? 150 + Math.random() * 100 : 20 + Math.random() * 30;
                return {
                    date: date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
                    declared: base + disc,
                    expected: base,
                    discrepancy: disc,
                };
            }),
            criticalStations: [
                {
                    brand: "Repsoil",
                    locationCount: 12,
                    totalDiscrepancyLiters: 185,
                    avgDiscrepancyPercentage: 8.2,
                },
                {
                    brand: "BP",
                    locationCount: 8,
                    totalDiscrepancyLiters: 92,
                    avgDiscrepancyPercentage: 5.4,
                },
                {
                    brand: "Cepsa",
                    locationCount: 15,
                    totalDiscrepancyLiters: 45,
                    avgDiscrepancyPercentage: 1.8,
                },
            ],
            riskFactors: [
                {
                    factor: "Declaraciones sobre capacidad",
                    occurrences: 8,
                    impactLevel: "high",
                },
                {
                    factor: "Repostajes rápidos",
                    occurrences: 14,
                    impactLevel: "medium",
                },
                {
                    factor: "Desvío de ruta",
                    occurrences: 5,
                    impactLevel: "low",
                },
            ],
        };

        // Validate response structure
        const validated = FleetFuelOverviewSchema.parse(overview);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: validated,
        });
    } catch (error) {
        console.error("Error fetching fleet fuel overview:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch fleet fuel overview",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
            },
            { status: 500 }
        );
    }
}
