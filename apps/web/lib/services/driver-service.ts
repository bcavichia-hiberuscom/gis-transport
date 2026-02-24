import { Driver } from "@gis/shared";

// ─── MOCK MODE ──────────────────────────────────────────────────────────────
// Remove this block (and lib/mock/) when the real DB is available.
import { MOCK_DRIVERS } from "@/lib/mock/mock-data";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
// ────────────────────────────────────────────────────────────────────────────

// Interface for Speeding (as before)
export interface SpeedingEvent {
    speed: number;
    limit: number;
    latitude: number;
    longitude: number;
}

export class DriverService {
    /**
     * innovative: Logs a speeding event for a driver.
     */
    static async logSpeeding(driverId: string, event: SpeedingEvent): Promise<void> {
        if (USE_MOCKS) return; // no-op in mock mode
        const { repository } = await import("@/lib/db");
        await repository.logSpeeding(driverId, {
            speed: Number(event.speed),
            limit: Number(event.limit),
            latitude: Number(event.latitude),
            longitude: Number(event.longitude),
        });
    }

    /**
     * Fetches all drivers from the repository.
     */
    static async getAllDrivers() {
        if (USE_MOCKS) return MOCK_DRIVERS;
        const { repository } = await import("@/lib/db");
        return repository.getDrivers();
    }

    /**
     * Fetches a single driver by ID.
     */
    static async getDriverById(id: string) {
        if (USE_MOCKS) return MOCK_DRIVERS.find(d => d.id === id) ?? null;
        const { repository } = await import("@/lib/db");
        return repository.getDriverById(id);
    }

    /**
     * Creates a new driver. Enforces logic that new drivers start unassigned.
     */
    static async createDriver(data: any) {
        // Business Rule: New drivers cannot be created with an existing vehicle assignment.
        if (data.currentVehicleId && data.currentVehicleId !== null) {
            throw new Error("New drivers cannot be created with an existing vehicle assignment. Drivers start available with no assignment.");
        }
        if (USE_MOCKS) {
            const newDriver: Driver = { id: `drv-mock-${Date.now()}`, name: data.name || "Conductor", isAvailable: true, onTimeDeliveryRate: 100, ...data };
            MOCK_DRIVERS.push(newDriver);
            return newDriver;
        }
        const { repository } = await import("@/lib/db");
        return repository.addDriver(data);
    }

    /**
     * Updates an existing driver. Handles vehicle assignment logic.
     */
    static async updateDriver(id: string, data: any) {
        console.log("[DriverService.updateDriver] Called with:", { id, data });
        
        // Validation: Vehicle ID format
        if (data.currentVehicleId && data.currentVehicleId !== null) {
            if (typeof data.currentVehicleId !== "string" && typeof data.currentVehicleId !== "number") {
                throw new Error("Invalid vehicle ID format. Must be string or number.");
            }
            // Business Rule: Cannot mark unavailable without a vehicle
            if (data.isAvailable === false && !data.currentVehicleId) {
                throw new Error("Cannot mark driver as unavailable without assigning to a vehicle.");
            }
        }

        if (USE_MOCKS) {
            const idx = MOCK_DRIVERS.findIndex(d => d.id === id);
            if (idx !== -1) MOCK_DRIVERS[idx] = { ...MOCK_DRIVERS[idx], ...data };
            console.log("[DriverService.updateDriver] Mock mode - updated:", MOCK_DRIVERS[idx]);
            return MOCK_DRIVERS[idx] ?? null;
        }

        const { repository } = await import("@/lib/db");

        // Assignment History Logic
        const currentDriver = await repository.getDriverById(id);
        console.log("[DriverService.updateDriver] Current driver from DB:", currentDriver);

        if (
            currentDriver &&
            data.currentVehicleId !== undefined &&
            data.currentVehicleId !== currentDriver.currentVehicleId
        ) {
            const prevVehicleId = currentDriver.currentVehicleId;

            // If there was a previous assignment, close it
            if (prevVehicleId) {
                try {
                    await repository.createDriverVehicleAssignment({
                        driverId: id,
                        vehicleId: prevVehicleId,
                        assignedAt: new Date(currentDriver.updatedAt),
                        unassignedAt: new Date(),
                    });
                    console.log("[DriverService.updateDriver] Assignment history recorded");
                } catch (historyErr) {
                    console.error("Failed to record assignment history:", historyErr);
                    // Don't fail the entire request if history fails
                }
            }
        }

        console.log("[DriverService.updateDriver] Calling repository.updateDriver with:", { id, data });
        const updatedDriver = await repository.updateDriver(id, data);
        console.log("[DriverService.updateDriver] Repository update result:", updatedDriver);
        
        return updatedDriver;
    }

    /**
     * Clears all driver assignments, setting them to available.
     */
    static async clearAssignments() {
        if (USE_MOCKS) {
            MOCK_DRIVERS.forEach(d => { d.isAvailable = true; d.currentVehicleId = undefined; });
            return [...MOCK_DRIVERS];
        }
        const { repository } = await import("@/lib/db");
        const drivers = await repository.getDrivers();
        const updates = drivers.map((driver) =>
            repository.updateDriver(driver.id, {
                isAvailable: true,
                currentVehicleId: null,
            }),
        );
        await Promise.all(updates);
        return repository.getDrivers();
    }

    /**
     * innovative: Finds the driver currently assigned to a specific vehicle.
     */
    static async getDriverByVehicleId(vehicleId: string | number) {
        if (USE_MOCKS) return MOCK_DRIVERS.find(d => String(d.currentVehicleId) === String(vehicleId));
        const { repository } = await import("@/lib/db");
        const drivers = await repository.getDrivers();
        return drivers.find(d => String(d.currentVehicleId) === String(vehicleId));
    }
}
