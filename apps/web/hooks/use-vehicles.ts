"use client";

import { useState, useCallback, useEffect } from "react";
import type { FleetVehicle } from "@gis/shared";
import { VehicleService } from "@/lib/services/vehicle-service";

/**
 * Custom hook to manage vehicle data and operations
 * Provides CRUD operations and state management for fleet vehicles
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all vehicles from the API
   */
  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await VehicleService.fetchVehicles();
      setVehicles(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch vehicles";
      setError(errorMessage);
      console.error("Error fetching vehicles:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new vehicle
   */
  const addVehicle = useCallback(
    async (
      vehicle: Partial<FleetVehicle>,
    ): Promise<FleetVehicle | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        const newVehicle = await VehicleService.addVehicle(vehicle);
        setVehicles((prev) => [...prev, newVehicle]);
        return newVehicle;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add vehicle";
        setError(errorMessage);
        console.error("Error adding vehicle:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Update an existing vehicle
   */
  const updateVehicle = useCallback(
    async (
      vehicleId: string | number,
      updates: Partial<FleetVehicle>,
    ): Promise<FleetVehicle | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await VehicleService.updateVehicle(vehicleId, updates);
        if (updated) {
          setVehicles((prev) =>
            prev.map((v) => (v.id === vehicleId ? updated : v)),
          );
        }
        return updated;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update vehicle";
        setError(errorMessage);
        console.error("Error updating vehicle:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a vehicle
   */
  const deleteVehicle = useCallback(
    async (vehicleId: string | number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const success = await VehicleService.deleteVehicle(vehicleId);
        if (success) {
          setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete vehicle";
        setError(errorMessage);
        console.error("Error deleting vehicle:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get a specific vehicle by ID
   */
  const getVehicleById = useCallback(
    async (vehicleId: string | number): Promise<FleetVehicle | null> => {
      try {
        return await VehicleService.getVehicleById(vehicleId);
      } catch (err) {
        console.error(`Error fetching vehicle ${vehicleId}:`, err);
        return null;
      }
    },
    [],
  );

  /**
   * Update vehicle maintenance information
   */
  const updateMaintenance = useCallback(
    async (
      vehicleId: string | number,
      maintenanceData: {
        lastMaintenanceDate?: number;
        nextMaintenanceDate?: number;
        maintenanceHours?: number;
      },
    ): Promise<FleetVehicle | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await VehicleService.updateMaintenance(
          vehicleId,
          maintenanceData,
        );
        if (updated) {
          setVehicles((prev) =>
            prev.map((v) => (v.id === vehicleId ? updated : v)),
          );
        }
        return updated;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update maintenance";
        setError(errorMessage);
        console.error("Error updating maintenance:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    updateMaintenance,
  };
}
