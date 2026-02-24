import { useState, useCallback, useRef, useEffect } from "react";
import {
  VehicleType,
  FleetJob,
  FleetVehicle,
  VehicleMetrics,
  Driver,
  VehicleGroup,
  SpeedingEvent,
} from "@gis/shared";

const EMPTY_VEHICLES: FleetVehicle[] = [];
const EMPTY_JOBS: FleetJob[] = [];
const EMPTY_GROUPS: VehicleGroup[] = [];

const generateId = (prefix = "id"): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${time}-${random}`;
};

/**
 * Custom hook to manage fleet state and operations
 * @param initialVehicles - Optional initial vehicles
 * @param initialJobs - Optional initial jobs
 * @returns Object with state and functions to manipulate the fleet
 */
export function useFleet(
  initialVehicles: FleetVehicle[] = EMPTY_VEHICLES,
  initialJobs: FleetJob[] = EMPTY_JOBS,
) {
  // Hook states
  const [fleetVehicles, setFleetVehicles] =
    useState<FleetVehicle[]>(initialVehicles);
  const [fleetJobs, setFleetJobs] = useState<FleetJob[]>(initialJobs);
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>(EMPTY_GROUPS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Ref to stabilize fetchVehicles callback
  const initialVehiclesRef = useRef(initialVehicles);
  useEffect(() => {
    initialVehiclesRef.current = initialVehicles;
  }, [initialVehicles]);

  // Effect to load groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/vehicle-groups");
        const json = await res.json();
        if (json.success) {
          setVehicleGroups(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch vehicle groups:", err);
      }
    };
    fetchGroups();
  }, []);

  // Function to clear all fleet data
  const clearFleet = useCallback(() => {
    setFleetVehicles([]);
    setFleetJobs([]);
    setSelectedVehicleId(null);
  }, []);

  // Simulate vehicle fetching from a physical device - STABLE callback
  const fetchVehicles = useCallback(async () => {
    const initVehicles = initialVehiclesRef.current;
    setIsLoadingVehicles(true);
    try {
      // Simulating network/device delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockVehicles: FleetVehicle[] = [
        {
          id: `phys-${Date.now()}-1`,
          position: initVehicles[0]?.position || [40.4233, -3.7121],
          label: "Phys Vehicle 1",
          type: initVehicles[0]?.type || {
            id: "zero",
            label: "Zero Emission Vehicle",
            tags: ["0", "eco"],
            description: "Full electric",
            vroomType: "car",
          },
          metrics: {
            speed: 85,
            batteryLevel: 15,
            distanceTotal: 12450,
            status: "active",
            movementState: "moving",
            health: 45,
            updatedAt: Date.now(),
          } as VehicleMetrics,
        },
        {
          id: `phys-${Date.now()}-2`,
          position: initVehicles[0]?.position || [40.415, -3.702],
          label: "Phys Vehicle 2",
          type: initVehicles[0]?.type || {
            id: "eco",
            label: "ECO Vehicle",
            tags: ["eco"],
            description: "Hybrid",
            vroomType: "car",
          },
          metrics: {
            speed: 75,
            fuelLevel: 8,
            distanceTotal: 45120,
            status: "active",
            movementState: "moving",
            health: 88,
            updatedAt: Date.now(),
          } as VehicleMetrics,
        },
      ];

      setFleetVehicles((prev) => [...prev, ...mockVehicles]);
    } catch (error) {
      console.error("Failed to fetch vehicles from device:", error);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []); // Empty deps = stable reference

  // Function to add a vehicle at specific coordinates
  const addVehicleAt = useCallback(
    (position: [number, number], type: VehicleType) => {
      const id = generateId("vehicle");
      const label = `Vehicle ${fleetVehicles.length + 1}`;
      const newVehicle: FleetVehicle = { id, position, type, label };
      setFleetVehicles((prev) => {
        const next = [...prev, newVehicle];
        // Automatically select the new vehicle
        setSelectedVehicleId(String(newVehicle.id));
        return next;
      });
    },
    [fleetVehicles.length],
  );

  // Function to add a job at specific coordinates
  const addJobAt = useCallback(
    (
      position: [number, number],
      label?: string,
      vehicleId?: string | number,
      eta?: string,
    ) => {
      const id = generateId("job");
      setFleetJobs((prev) => {
        const next: FleetJob[] = [
          ...prev,
          {
            id,
            position,
            label: label || `Job ${prev.length + 1}`,
            status: "pending",
            type: "standard",
            eta,
            ...(vehicleId && { assignedVehicleId: vehicleId }),
          },
        ];
        return next;
      });
    },
    [],
  );

  // Function to add a stop (pinned job) to a specific vehicle
  const addStopToVehicle = useCallback(
    (
      vehicleId: string | number,
      position: [number, number],
      label?: string,
      eta?: string,
    ) => {
      const id = generateId("stop");
      setFleetJobs((prev) => {
        const next: FleetJob[] = [
          ...prev,
          {
            id,
            position,
            label: label || `Parada personalizada`,
            assignedVehicleId: vehicleId,
            status: "pending",
            type: "custom",
            eta,
          },
        ];
        return next;
      });
    },
    [],
  );

  // Function to remove a vehicle by ID
  const removeVehicle = useCallback((vehicleId: string | number) => {
    setFleetVehicles((prev) => {
      const remaining = prev.filter((v) => v.id !== vehicleId);
      // If the selected vehicle is removed, select the first available one
      setSelectedVehicleId((curr) =>
        curr === vehicleId
          ? remaining[0]?.id
            ? String(remaining[0].id)
            : null
          : curr,
      );
      return remaining;
    });
  }, []);

  // Function to remove a job by ID
  const removeJob = useCallback((jobId: string | number) => {
    setFleetJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  /**
   * Vehicle Groups Management (Persisted)
   */
  const addVehicleGroup = useCallback(async (name: string, vehicleIds: (string | number)[] = []) => {
    try {
      const res = await fetch("/api/vehicle-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, vehicleIds }),
      });
      const json = await res.json();
      if (json.success) {
        setVehicleGroups((prev) => [json.data, ...prev]);
        return json.data.id;
      }
    } catch (err) {
      console.error("Failed to add vehicle group:", err);
    }
    return null;
  }, []);

  const removeVehicleGroup = useCallback(async (groupId: string | number) => {
    try {
      const res = await fetch(`/api/vehicle-groups/${groupId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setVehicleGroups((prev) => prev.filter((g) => String(g.id) !== String(groupId)));
        // Also clear assignedGroupId from jobs that were assigned to this group
        setFleetJobs((prev) =>
          prev.map((j) => (String(j.assignedGroupId) === String(groupId) ? { ...j, assignedGroupId: undefined } : j)),
        );
      }
    } catch (err) {
      console.error("Failed to remove vehicle group:", err);
    }
  }, []);

  const toggleVehicleInGroup = useCallback(async (groupId: string | number, vehicleId: string | number) => {
    const group = vehicleGroups.find(g => String(g.id) === String(groupId));
    if (!group) return;

    const newVehicleIds = group.vehicleIds.map(String).includes(String(vehicleId))
      ? group.vehicleIds.filter((id) => String(id) !== String(vehicleId))
      : [...group.vehicleIds, vehicleId];

    try {
      const res = await fetch(`/api/vehicle-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleIds: newVehicleIds }),
      });
      const json = await res.json();
      if (json.success) {
        setVehicleGroups((prev) =>
          prev.map((g) => (String(g.id) === String(groupId) ? json.data : g))
        );
      }
    } catch (err) {
      console.error("Failed to toggle vehicle in group:", err);
    }
  }, [vehicleGroups]);

  const updateVehicleGroupName = useCallback(async (groupId: string | number, name: string) => {
    try {
      const res = await fetch(`/api/vehicle-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) {
        setVehicleGroups((prev) =>
          prev.map((g) => (String(g.id) === String(groupId) ? json.data : g))
        );
      }
    } catch (err) {
      console.error("Failed to update vehicle group name:", err);
    }
  }, []);

  /**
   * Update a vehicle's position (used for live GPS tracking)
   */
  const updateVehiclePosition = useCallback(
    (vehicleId: string | number, newPosition: [number, number]) => {
      setFleetVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(vehicleId) ? { ...v, position: newPosition } : v,
        ),
      );
    },
    [],
  );

  /**
   * Update a vehicle's telemetry metrics
   */
  const updateVehicleMetrics = useCallback(
    (vehicleId: string | number, metrics: VehicleMetrics) => {
      setFleetVehicles((prev) =>
        prev.map((v) => {
          if (String(v.id) !== String(vehicleId)) return v;
          // Preserve maxSpeed from previous poll when current poll doesn't include it.
          // Address is always sent fresh by the API, so we don't preserve it.
          const merged = {
            ...v.metrics,
            ...metrics,
            maxSpeed: metrics.maxSpeed ?? v.metrics?.maxSpeed,
          };
          return { ...v, metrics: merged };
        }),
      );
    },
    [],
  );

  /**
   * Update a vehicle's type (label/tag)
   */
  const updateVehicleType = useCallback(
    (vehicleId: string | number, newType: VehicleType) => {
      setFleetVehicles((prev) =>
        prev.map((v) => (String(v.id) === String(vehicleId) ? { ...v, type: newType } : v)),
      );
    },
    [],
  );

  /**
   * Update a vehicle's label (alias)
   */
  const updateVehicleLabel = useCallback(
    (vehicleId: string | number, newLabel: string) => {
      setFleetVehicles((prev) =>
        prev.map((v) => (String(v.id) === String(vehicleId) ? { ...v, label: newLabel } : v)),
      );
    },
    [],
  );

  /**
   * Update a vehicle's license plate
   */
  const updateVehicleLicensePlate = useCallback(
    (vehicleId: string | number, newLicensePlate: string) => {
      setFleetVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(vehicleId) ? { ...v, licensePlate: newLicensePlate } : v,
        ),
      );
    },
    [],
  );

  /**
   * Assign a driver to a vehicle (or unassign with null)
   */
  const assignDriverToVehicle = useCallback(
    (vehicleId: string | number, driver: Driver | null) => {
      setFleetVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(vehicleId) ? { ...v, driver: driver || undefined } : v,
        ),
      );
    },
    [],
  );

  /**
   * Update a driver's speeding events
   */
  const updateDriverSpeedingEvents = useCallback(
    (vehicleId: string | number, events: SpeedingEvent[]) => {
      setFleetVehicles((prev) =>
        prev.map((v) => {
          if (String(v.id) !== String(vehicleId)) return v;
          if (!v.driver) return v;
          return {
            ...v,
            driver: {
              ...v.driver,
              speedingEvents: events,
            },
          };
        }),
      );
    },
    [],
  );

  /**
   * Bulk update job assignments (e.g., after routing optimization)
   */
  const setJobAssignments = useCallback(
    (assignments: { jobId: string | number; vehicleId?: string | number, groupId?: string | number }[]) => {
      setFleetJobs((prev) => {
        const next = [...prev];
        assignments.forEach(({ jobId, vehicleId, groupId }) => {
          const index = next.findIndex((j) => String(j.id) === String(jobId));
          if (index !== -1) {
            next[index] = {
              ...next[index],
              assignedVehicleId: vehicleId !== undefined ? vehicleId : next[index].assignedVehicleId,
              assignedGroupId: groupId !== undefined ? groupId : (vehicleId !== undefined ? undefined : next[index].assignedGroupId),
            };
          }
        });
        return next;
      });
    },
    [],
  );

  /**
   * Update a specific job's status
   */
  const updateJobStatus = useCallback(
    (jobId: string | number, status: FleetJob["status"], updates?: Partial<FleetJob>) => {
      setFleetJobs((prev) =>
        prev.map((j) => (String(j.id) === String(jobId) ? { ...j, status, ...updates } : j)),
      );
    },
    [],
  );

  // Return state and functions that other components can use
  return {
    // State
    fleetVehicles,
    fleetJobs,
    selectedVehicleId,
    isLoadingVehicles,

    // Direct setters
    setSelectedVehicleId,
    setFleetVehicles,

    // Manipulation functions
    clearFleet,
    fetchVehicles,
    addVehicleAt,
    addJobAt,
    addStopToVehicle,
    removeVehicle,
    removeJob,
    updateVehiclePosition,
    updateVehicleMetrics,
    updateVehicleType,
    updateVehicleLabel,
    updateVehicleLicensePlate,
    assignDriverToVehicle,
    updateDriverSpeedingEvents,
    setJobAssignments,
    updateJobStatus,
    vehicleGroups,
    addVehicleGroup,
    removeVehicleGroup,
    toggleVehicleInGroup,
    updateVehicleGroupName,
  };
}
