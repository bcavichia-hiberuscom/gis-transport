// lib/hooks/use-fleet.ts
import { useState, useCallback } from "react";
import type { VehicleType } from "@/lib/types";

// Interfaces que usa el hook
export interface FleetJob {
  id: string;
  coords: [number, number];
  label: string;
}

export interface FleetVehicle {
  id: string;
  coords: [number, number];
  type: VehicleType;
}

/**
 * Hook personalizado para manejar el estado y operaciones de la flota
 * @param initialVehicles - Vehículos iniciales (opcional)
 * @param initialJobs - Trabajos iniciales (opcional)
 * @returns Objeto con estado y funciones para manipular la flota
 */
export function useFleet(
  initialVehicles: FleetVehicle[] = [],
  initialJobs: FleetJob[] = []
) {
  // Estados del hook
  const [fleetVehicles, setFleetVehicles] =
    useState<FleetVehicle[]>(initialVehicles);
  const [fleetJobs, setFleetJobs] = useState<FleetJob[]>(initialJobs);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [addMode, setAddMode] = useState<"vehicle" | "job" | null>(null);

  // Función para limpiar toda la flota
  const clearFleet = useCallback(() => {
    setFleetVehicles([]);
    setFleetJobs([]);
    setSelectedVehicleId(null);
    setAddMode(null);
  }, []);

  // Función para añadir un vehículo en coordenadas específicas
  const addVehicleAt = useCallback(
    (coords: [number, number], type: VehicleType) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? (crypto as any).randomUUID()
          : `vehicle-${Date.now()}`;
      const newVehicle: FleetVehicle = { id, coords, type };
      setFleetVehicles((prev) => {
        const next = [...prev, newVehicle];
        // Seleccionar automáticamente el nuevo vehículo
        setSelectedVehicleId(newVehicle.id);
        return next;
      });
      setAddMode(null);
    },
    []
  );

  // Función para añadir un trabajo en coordenadas específicas
  const addJobAt = useCallback((coords: [number, number]) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `job-${Date.now()}`;
    setFleetJobs((prev) => {
      const next = [...prev, { id, coords, label: `Job ${prev.length + 1}` }];
      return next;
    });
    setAddMode(null);
  }, []);

  // Función para eliminar un vehículo por ID
  const removeVehicle = useCallback((vehicleId: string) => {
    setFleetVehicles((prev) => {
      const remaining = prev.filter((v) => v.id !== vehicleId);
      // Si se elimina el vehículo seleccionado, seleccionar el primero disponible
      setSelectedVehicleId((curr) =>
        curr === vehicleId ? remaining[0]?.id ?? null : curr
      );
      return remaining;
    });
  }, []);

  // Función para eliminar un trabajo por ID
  const removeJob = useCallback((jobId: string) => {
    setFleetJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  // Retornar el estado y las funciones que otros componentes pueden usar
  return {
    // Estado
    fleetVehicles,
    fleetJobs,
    selectedVehicleId,
    addMode,

    // Setters directos
    setAddMode,
    setSelectedVehicleId,

    // Funciones de manipulación
    clearFleet,
    addVehicleAt,
    addJobAt,
    removeVehicle,
    removeJob,
  };
}
