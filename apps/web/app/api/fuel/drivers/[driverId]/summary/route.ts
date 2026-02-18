import { NextRequest, NextResponse } from "next/server";
import {
    DriverFuelSummary,
    DriverFuelSummarySchema,
    FuelTransaction,
} from "@gis/shared";

/**
 * GET /api/fuel/drivers/[driverId]/summary
 * Returns fuel consumption summary for a specific driver
 * 
 * Query params:
 * - startDate: Unix timestamp (required)
 * - endDate: Unix timestamp (required)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { driverId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = parseInt(searchParams.get("startDate") || "0");
        const endDate = parseInt(searchParams.get("endDate") || "0");
        const paramsResolved = await params;
        const { driverId } = paramsResolved;

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

        // Fetch real drivers to see if this ID matches our "discrepancy" mock list
        const { DriverService } = await import("@/lib/services/driver-service");
        const realDrivers = await DriverService.getAllDrivers();
        const flaggedDriverIds = realDrivers.slice(0, 4).map(d => d.id);
        const isFlaggedDriver = flaggedDriverIds.includes(driverId) || driverId === "DRV-00234";

        const baseTransactions: FuelTransaction[] = [];

        // Generate different scenarios based on driver ID
        if (isFlaggedDriver) {
            // Juan Pérez - Has flagged transactions
            baseTransactions.push(
                {
                    id: "TXN-001234",
                    driverId,
                    vehicleId: "VEH-7741-KLP",
                    timestamp: Date.now() - 86400000, // 1 day ago
                    location: {
                        coords: [40.4168, -3.7038],
                        stationName: "Shell Atocha",
                        stationBrand: "Shell",
                        address: "Calle Atocha 123, Madrid",
                    },
                    declared: {
                        liters: 80,
                        pricePerLiter: 1.45,
                        totalCost: 116,
                        receiptNumber: "TK-2024-001234",
                    },
                    calculated: {
                        expectedLiters: 75,
                        tankLevelBefore: 20,
                        tankLevelAfter: 60,
                        kmSinceLastRefuel: 450,
                        averageConsumption: 16.7,
                    },
                    validation: {
                        discrepancyLiters: 5,
                        discrepancyPercentage: 6.7,
                        status: "compliant",
                    },
                    paymentMethod: "company_card",
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now() - 86400000,
                },
                {
                    id: "TXN-001198",
                    driverId,
                    vehicleId: "VEH-7741-KLP",
                    timestamp: Date.now() - 172800000, // 2 days ago
                    location: {
                        coords: [39.4699, -0.3763],
                        stationName: "Repsol Norte",
                        stationBrand: "Repsol",
                        address: "Av. del Puerto 45, Valencia",
                    },
                    declared: {
                        liters: 120,
                        pricePerLiter: 1.42,
                        totalCost: 171.60,
                        receiptNumber: "TK-2024-001198",
                    },
                    calculated: {
                        expectedLiters: 120, // We expected what was declared for this comparison
                        tankLevelBefore: 40,
                        tankLevelAfter: 75,
                        kmSinceLastRefuel: 520,
                        averageConsumption: 16.3,
                    },
                    validation: {
                        discrepancyLiters: 60, // (40 + 120) - 100 = 60 over capacity
                        discrepancyPercentage: 60,
                        status: "flagged",
                        flags: ["exceeds_capacity", "high_variance"],
                    },
                    paymentMethod: "company_card",
                    createdAt: Date.now() - 172800000,
                    updatedAt: Date.now() - 172800000,
                }
            );
        } else {
            // Other drivers - compliant transactions
            baseTransactions.push(
                {
                    id: `TXN-${driverId}-001`,
                    driverId,
                    vehicleId: "VEH-1234-ABC",
                    timestamp: Date.now() - 86400000,
                    location: {
                        coords: [40.4168, -3.7038],
                        stationName: "Cepsa Centro",
                        stationBrand: "Cepsa",
                        address: "Gran Vía 100, Madrid",
                    },
                    declared: {
                        liters: 75,
                        pricePerLiter: 1.43,
                        totalCost: 107.25,
                        receiptNumber: `TK-2024-${driverId}`,
                    },
                    calculated: {
                        expectedLiters: 73,
                        tankLevelBefore: 25,
                        tankLevelAfter: 65,
                        kmSinceLastRefuel: 420,
                        averageConsumption: 17.4,
                    },
                    validation: {
                        discrepancyLiters: 2,
                        discrepancyPercentage: 2.7,
                        status: "compliant",
                    },
                    paymentMethod: "company_card",
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now() - 86400000,
                }
            );
        }

        const summary: DriverFuelSummary = {
            driverId,
            period: {
                start: startDate,
                end: endDate,
            },
            totals: {
                declaredLiters: isFlaggedDriver ? 1240 : 980,
                expectedLiters: isFlaggedDriver ? 1190 : 965,
                discrepancyLiters: isFlaggedDriver ? 50 : 15,
                discrepancyPercentage: isFlaggedDriver ? 4.2 : 1.6,
                totalCost: isFlaggedDriver ? 1856.5 : 1467.2,
                transactionCount: isFlaggedDriver ? 12 : 10,
            },
            flags: {
                compliant: isFlaggedDriver ? 9 : 10,
                review: isFlaggedDriver ? 2 : 0,
                flagged: isFlaggedDriver ? 1 : 0,
            },
            recentTransactions: baseTransactions,
            trendData: Array.from({ length: 15 }).map((_, i) => {
                const date = new Date(Date.now() - (14 - i) * 86400000 * 2);
                const isAnomaly = isFlaggedDriver && i === 12;
                const base = 60 + Math.random() * 20;
                const disc = isAnomaly ? 60 : 2 + Math.random() * 8;
                return {
                    date: date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
                    declared: base + disc,
                    expected: base,
                    discrepancy: disc,
                };
            }),
        };

        // Validate response structure
        const validated = DriverFuelSummarySchema.parse(summary);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: validated,
        });
    } catch (error) {
        console.error("Error fetching driver fuel summary:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch driver fuel summary",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
            },
            { status: 500 }
        );
    }
}
