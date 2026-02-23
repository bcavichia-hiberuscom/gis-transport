import { useCallback, useEffect, useRef } from "react";
import type { Driver } from "@gis/shared";

interface UseDriverManagementProps {
  fleetVehicles: any[]; // Adjust type
  drivers: Driver[];
  isLoadingVehicles: boolean;
  isLoadingDrivers: boolean;
  assignDriverToVehicle: (
    vehicleId: string | number,
    driver: Driver | null,
  ) => void;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<Driver>;
  optimisticUpdateDriver: (id: string, updates: Partial<Driver>) => void;
  fetchDrivers: () => Promise<void>;
}

export function useDriverManagement({
  fleetVehicles,
  drivers,
  isLoadingVehicles,
  isLoadingDrivers,
  assignDriverToVehicle,
  updateDriver,
  optimisticUpdateDriver,
  fetchDrivers,
}: UseDriverManagementProps) {

  // Reconciliation: Auto-release drivers assigned to non-existent vehicles
  const prevOrphanedCheckRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoadingVehicles || isLoadingDrivers || !drivers.length) return;

    const validVehicleIds = new Set(fleetVehicles.map((v) => String(v.id)));

    const orphanedDrivers = drivers.filter(
      (d) =>
        !d.isAvailable &&
        d.currentVehicleId &&
        !validVehicleIds.has(String(d.currentVehicleId)),
    );

    const currentOrphanedIds = new Set(orphanedDrivers.map((d) => d.id));

    const newOrphanedDrivers = orphanedDrivers.filter(
      (d) => !prevOrphanedCheckRef.current.has(d.id),
    );

    if (newOrphanedDrivers.length > 0) {
      newOrphanedDrivers.forEach((driver) => {
        optimisticUpdateDriver(driver.id, {
          isAvailable: true,
          currentVehicleId: undefined,
        });

        updateDriver(driver.id, {
          isAvailable: true,
          currentVehicleId: undefined,
        }).catch((err) =>
          console.error("Failed to reconcile driver:", driver.id, err),
        );
      });
    }

    prevOrphanedCheckRef.current = currentOrphanedIds;
  }, [
    fleetVehicles,
    drivers,
    isLoadingVehicles,
    isLoadingDrivers,
    optimisticUpdateDriver,
    updateDriver,
  ]);

  const handleAssignDriver = useCallback(
    async (vehicleId: string | number, newDriver: Driver | null) => {
      try {
        // Find the vehicle to get its current driver
        const vehicle = fleetVehicles.find(
          (v) => String(v.id) === String(vehicleId),
        );
        if (!vehicle) {
          console.error("Vehicle not found:", vehicleId);
          await fetchDrivers(); // Refresh to get latest state
          return;
        }

        // VALIDATION: If assigning a new driver, verify they are marked as available
        if (newDriver) {
          if (!newDriver.isAvailable) {
            console.error("Cannot assign driver: driver is not available", {
              driverId: newDriver.id,
              driverName: newDriver.name,
              isAvailable: newDriver.isAvailable,
              currentVehicleId: newDriver.currentVehicleId,
            });
            await fetchDrivers(); // Refresh to get latest state
            return;
          }
        }

        // Optimistic update: Update frontend fleet state immediately with full driver object
        assignDriverToVehicle(vehicleId, newDriver);

        // 1. Release the OLD driver (check both sources: vehicle.driver and drivers array)
        // First check vehicle.driver (the source of truth for vehicle state)
        const vehicleCurrentDriver = vehicle.driver;
        // Also check drivers array by currentVehicleId (in case of stale state)
        const driverFromArray = drivers.find(
          (d) => d.currentVehicleId === String(vehicleId),
        );

        // Determine which driver(s) need to be released
        const driversToRelease: Driver[] = [];

        if (vehicleCurrentDriver) {
          driversToRelease.push(vehicleCurrentDriver);
        }

        // Also release driver from array if different from vehicle's driver
        if (
          driverFromArray &&
          (!vehicleCurrentDriver ||
            driverFromArray.id !== vehicleCurrentDriver.id)
        ) {
          driversToRelease.push(driverFromArray);
        }

        // Release all old drivers
        for (const oldDriver of driversToRelease) {
          // Skip if this is the same as the new driver (shouldn't happen but safety check)
          if (newDriver && oldDriver.id === newDriver.id) continue;

          optimisticUpdateDriver(oldDriver.id, {
            isAvailable: true,
            currentVehicleId: undefined,
          });

          await updateDriver(oldDriver.id, {
            isAvailable: true,
            currentVehicleId: undefined,
          });
        }

        // 2. Assign the NEW driver if provided
        if (newDriver) {
          // First, update the driver in the drivers array
          optimisticUpdateDriver(newDriver.id, {
            isAvailable: false,
            currentVehicleId: String(vehicleId),
          });

          // Update driver in backend and get full updated driver record
          const updateResult = await updateDriver(newDriver.id, {
            isAvailable: false,
            currentVehicleId: String(vehicleId),
          });
          
          // Use the full updated driver from backend, or fall back to newDriver if result is incomplete
          const driverToAssign = updateResult && updateResult.id ? updateResult : newDriver;
          
          // Update the vehicle with the full driver object to ensure data consistency
          assignDriverToVehicle(vehicleId, driverToAssign);
          
          console.log("[useDriverManagement] Driver assigned to vehicle:", {
            vehicleId,
            driverId: driverToAssign.id,
            driverName: driverToAssign.name,
            isAvailable: driverToAssign.isAvailable,
            currentVehicleId: driverToAssign.currentVehicleId,
          });
        }

        console.log("[useDriverManagement] Driver assignment complete:", {
          vehicleId,
          driverId: newDriver?.id,
          driverName: newDriver?.name
        });
        
        // Trigger a background refresh of drivers to stay in sync, but don't wait for it
        // This prevents blocking the routing operation
        fetchDrivers().catch((err) =>
          console.error("Background driver refresh failed:", err),
        );
      } catch (error) {
        console.error("Error assigning driver:", error);
        // Don't block if there's an error, still try to continue
      }
    },
    [
      assignDriverToVehicle,
      updateDriver,
      drivers,
      optimisticUpdateDriver,
      fetchDrivers,
      fleetVehicles,
    ],
  );

  return { handleAssignDriver };
}
