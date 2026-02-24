import { z } from "zod";

// Local schema definition to avoid circular dependency
const LatLonSchema = z.tuple([z.number(), z.number()]);

// --- Fuel Management Domain Types ---

/**
 * Payment method used for fuel purchase
 */
export const FuelPaymentMethodSchema = z.enum([
    "company_card",
    "cash",
    "personal_card",
    "voucher",
    "other",
]);
export type FuelPaymentMethod = z.infer<typeof FuelPaymentMethodSchema>;

/**
 * Status of a fuel transaction after validation
 */
export const FuelTransactionStatusSchema = z.enum([
    "compliant", // Within acceptable discrepancy range
    "review", // Requires manual review
    "flagged", // Critical discrepancy or suspicious pattern
    "approved", // Manually approved after review
    "rejected", // Rejected after review
]);
export type FuelTransactionStatus = z.infer<
    typeof FuelTransactionStatusSchema
>;

/**
 * Type of discrepancy flag
 */
export const FuelDiscrepancyTypeSchema = z.enum([
    "exceeds_capacity", // Declared > tank capacity
    "high_variance", // Discrepancy > 20%
    "irregular_pattern", // Consumption pattern anomaly
    "location_mismatch", // Location far from route
    "rapid_refueling", // Multiple refuels in short time
    "missing_documentation", // No ticket after 24h
]);
export type FuelDiscrepancyType = z.infer<typeof FuelDiscrepancyTypeSchema>;

/**
 * Individual fuel transaction record
 */
export const FuelTransactionSchema = z.object({
    id: z.string(),
    driverId: z.string(),
    vehicleId: z.union([z.string(), z.number()]),
    timestamp: z.number(), // Unix timestamp
    location: z.object({
        coords: LatLonSchema,
        stationName: z.string().optional(),
        stationBrand: z.string().optional(),
        address: z.string().optional(),
    }),

    // Declared data (from driver/receipt)
    declared: z.object({
        liters: z.number(),
        pricePerLiter: z.number(),
        totalCost: z.number(),
        receiptNumber: z.string().optional(),
        receiptImageUrl: z.string().optional(), // URL to uploaded receipt
    }),

    // System-calculated data
    calculated: z.object({
        expectedLiters: z.number(), // Based on tank capacity and previous level
        tankLevelBefore: z.number().min(0).max(100).optional(), // Percentage
        tankLevelAfter: z.number().min(0).max(100).optional(), // Percentage
        kmSinceLastRefuel: z.number().optional(),
        averageConsumption: z.number().optional(), // L/100km
    }),

    // Validation results
    validation: z.object({
        discrepancyLiters: z.number(), // declared - expected
        discrepancyPercentage: z.number(), // (discrepancy / expected) * 100
        status: FuelTransactionStatusSchema,
        flags: z.array(FuelDiscrepancyTypeSchema).optional(),
        reviewedBy: z.string().optional(), // User ID who reviewed
        reviewedAt: z.number().optional(), // Unix timestamp
        reviewNotes: z.string().optional(),
    }),

    paymentMethod: FuelPaymentMethodSchema,
    createdAt: z.number(),
    updatedAt: z.number(),
});
export type FuelTransaction = z.infer<typeof FuelTransactionSchema>;

/**
 * Driver-specific fuel summary
 */
export const DriverFuelSummarySchema = z.object({
    driverId: z.string(),
    period: z.object({
        start: z.number(),
        end: z.number(),
    }),
    totals: z.object({
        declaredLiters: z.number(),
        expectedLiters: z.number(),
        discrepancyLiters: z.number(),
        discrepancyPercentage: z.number(),
        totalCost: z.number(),
        transactionCount: z.number(),
    }),
    flags: z.object({
        compliant: z.number(),
        review: z.number(),
        flagged: z.number(),
    }),
    recentTransactions: z.array(FuelTransactionSchema).optional(),
    trendData: z
        .array(
            z.object({
                date: z.string(), // ISO date
                declared: z.number(),
                expected: z.number(),
                discrepancy: z.number(),
            })
        )
        .optional(),
});
export type DriverFuelSummary = z.infer<typeof DriverFuelSummarySchema>;

/**
 * Fleet-wide fuel overview
 */
export const FleetFuelOverviewSchema = z.object({
    period: z.object({
        start: z.number(),
        end: z.number(),
    }),
    totals: z.object({
        declaredLiters: z.number(),
        expectedLiters: z.number(),
        discrepancyLiters: z.number(),
        discrepancyPercentage: z.number(),
        totalCost: z.number(),
        transactionCount: z.number(),
        estimatedLossEuro: z.number().optional(),
    }),
    statusBreakdown: z.object({
        compliant: z.number(),
        review: z.number(),
        flagged: z.number(),
    }),
    topDiscrepancies: z.array(
        z.object({
            driverId: z.string(),
            driverName: z.string(),
            discrepancyLiters: z.number(),
            discrepancyPercentage: z.number(),
            flagCount: z.number(),
        })
    ),
    trendData: z
        .array(
            z.object({
                date: z.string(), // ISO date
                declared: z.number(),
                expected: z.number(),
                discrepancy: z.number(),
            })
        )
        .optional(),
    criticalStations: z
        .array(
            z.object({
                brand: z.string(),
                locationCount: z.number(),
                totalDiscrepancyLiters: z.number(),
                avgDiscrepancyPercentage: z.number(),
            })
        )
        .optional(),
    riskFactors: z
        .array(
            z.object({
                factor: z.string(),
                occurrences: z.number(),
                impactLevel: z.enum(["low", "medium", "high"]),
            })
        )
        .optional(),
});
export type FleetFuelOverview = z.infer<typeof FleetFuelOverviewSchema>;

/**
 * Vehicle fuel capacity configuration
 */
export const VehicleFuelConfigSchema = z.object({
    vehicleId: z.union([z.string(), z.number()]),
    tankCapacityLiters: z.number(),
    fuelType: z.enum(["diesel", "gasoline", "electric", "hybrid"]),
    averageConsumptionL100km: z.number().optional(), // Historical average
});
export type VehicleFuelConfig = z.infer<typeof VehicleFuelConfigSchema>;
