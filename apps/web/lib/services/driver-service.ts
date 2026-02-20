import { repository } from "@/lib/db";
import { Driver } from "@gis/shared"; // Assuming types exist, or I can use existing types from code

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
        return repository.getDrivers();
    }

    /**
     * Fetches a single driver by ID.
     */
    static async getDriverById(id: string) {
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
        return repository.addDriver(data);
    }

    /**
     * Updates an existing driver. Handles vehicle assignment logic.
     */
    static async updateDriver(id: string, data: any) {
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

        // Assignment History Logic
        const currentDriver = await repository.getDriverById(id);

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
                } catch (historyErr) {
                    console.error("Failed to record assignment history:", historyErr);
                    // Don't fail the entire request if history fails
                }
            }
        }

        return repository.updateDriver(id, data);
    }

    /**
     * Clears all driver assignments, setting them to available.
     */
    static async clearAssignments() {
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
        const drivers = await repository.getDrivers();
        return drivers.find(d => String(d.currentVehicleId) === String(vehicleId));
    }
}
