import { useState, useCallback, useRef, useEffect } from "react";
import type { RouteData, VehicleRoute } from "@/lib/types";
import { VehicleMetrics, FleetVehicle, FleetJob } from "@gis/shared";

interface UseLiveTrackingProps {
  routeData: RouteData | null;
  selectedVehicleId: string | number | null;
  updateVehiclePosition: (vehicleId: string, coords: [number, number]) => void;
  updateVehicleMetrics: (vehicleId: string, metrics: VehicleMetrics) => void;
  fleetVehicles: FleetVehicle[];
  fleetJobs: FleetJob[];
  updateJobStatus: (jobId: string | number, status: FleetJob["status"], updates?: Partial<FleetJob>) => void;
  updateDriverSpeedingEvents: (vehicleId: string | number, events: any[]) => void;
}

export function useLiveTracking({
  routeData,
  selectedVehicleId,
  updateVehiclePosition,
  updateVehicleMetrics,
  fleetVehicles,
  fleetJobs,
  updateJobStatus,
  updateDriverSpeedingEvents,
}: UseLiveTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef(0);

  // Refs for stable callback
  const isTrackingRef = useRef(isTracking);
  const routeDataRef = useRef(routeData);
  const updateVehiclePositionRef = useRef(updateVehiclePosition);
  const updateVehicleMetricsRef = useRef(updateVehicleMetrics);
  const selectedVehicleIdRef = useRef(selectedVehicleId);
  const fleetVehiclesRef = useRef(fleetVehicles);
  const fleetJobsRef = useRef(fleetJobs);
  const updateJobStatusRef = useRef(updateJobStatus);
  const updateDriverSpeedingEventsRef = useRef(updateDriverSpeedingEvents);

  // Keep refs in sync
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);
  useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData]);
  useEffect(() => {
    updateVehiclePositionRef.current = updateVehiclePosition;
  }, [updateVehiclePosition]);
  useEffect(() => {
    updateVehicleMetricsRef.current = updateVehicleMetrics;
  }, [updateVehicleMetrics]);
  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId;
  }, [selectedVehicleId]);
  useEffect(() => {
    fleetVehiclesRef.current = fleetVehicles;
  }, [fleetVehicles]);
  useEffect(() => {
    fleetJobsRef.current = fleetJobs;
  }, [fleetJobs]);
  useEffect(() => {
    updateJobStatusRef.current = updateJobStatus;
  }, [updateJobStatus]);
  useEffect(() => {
    updateDriverSpeedingEventsRef.current = updateDriverSpeedingEvents;
  }, [updateDriverSpeedingEvents]);

  // Haversine distance helper
  const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
    const R = 6371e3; // metres
    const φ1 = (pos1[0] * Math.PI) / 180;
    const φ2 = (pos2[0] * Math.PI) / 180;
    const Δφ = ((pos2[0] - pos1[0]) * Math.PI) / 180;
    const Δλ = ((pos2[1] - pos1[1]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const fetchPositions = useCallback(async () => {
    const updatePos = updateVehiclePositionRef.current;
    const updateMet = updateVehicleMetricsRef.current;
    const vehicleId = selectedVehicleIdRef.current;

    try {
      const url = vehicleId
        ? `/api/gps/positions?vehicleId=${vehicleId}`
        : "/api/gps/positions";
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();

        // Ignore out-of-order or stale responses
        if (data.timestamp && data.timestamp < lastTimestampRef.current) {
          return;
        }
        lastTimestampRef.current = data.timestamp;

        // Update each vehicle's position and metrics
        if (data.positions) {
          Object.entries(data.positions).forEach(([vid, coords]) => {
            updatePos(vid, coords as [number, number]);
          });
        }

        if (data.metrics) {
          Object.entries(data.metrics).forEach(([vid, metrics]) => {
            updateMet(vid, metrics as VehicleMetrics);
          });
        }

        // Speeding Events Logic: Update driver's speeding events from recent events
        if (data.recentEvents) {
          const upSpeeding = updateDriverSpeedingEventsRef.current;
          Object.entries(data.recentEvents).forEach(([vid, events]) => {
            if ((events as any[]).length > 0) {
              upSpeeding(vid, events as any[]);
            }
          });
        }

        // Job Completion Logic: Check proximity of vehicles to their assigned jobs
        if (data.positions) {
          const currentJobs = fleetJobsRef.current;
          const upStatus = updateJobStatusRef.current;

          Object.entries(data.positions).forEach(([vid, pos]) => {
            const vehiclePos = pos as [number, number];

            // Find jobs assigned to this vehicle that are not yet completed
            const assignedJobs = currentJobs.filter(
              j => String(j.assignedVehicleId) === String(vid) && j.status !== "completed"
            );

            assignedJobs.forEach(job => {
              const dist = calculateDistance(vehiclePos, job.position);
              // If within 100 meters, mark as completed
              if (dist < 100) {
                const vehicleMetrics = data.metrics?.[vid];
                const finalDist = vehicleMetrics ? (vehicleMetrics.distanceTotal / 1000) : 0;

                console.log(`[Tracking] Vehicle ${vid} reached job ${job.id} (dist: ${Math.round(dist)}m). Marking as COMPLETED with distance ${finalDist.toFixed(1)}km.`);
                upStatus(job.id, "completed", {
                  completedAt: Date.now(),
                  distance: finalDist > 0 ? finalDist : 0
                });
              }
            });
          });
        }
      }
    } catch (err) {
      console.error("GPS poll error:", err);
    }
  }, []);

  // Immediate fetch when selected vehicle changes for snappier UI
  useEffect(() => {
    if (isTracking && selectedVehicleId) {
      fetchPositions();
    }
  }, [selectedVehicleId, isTracking, fetchPositions]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // When routeData changes while tracking is active, restart simulation with new routes
  useEffect(() => {
    if (isTracking && routeData?.vehicleRoutes) {
      const simulationData: Record<string, any> = {};
      routeData.vehicleRoutes.forEach((route: any) => {
        if (route.vehicleId && route.coordinates) {
          const v = fleetVehiclesRef.current.find(
            (fv) => String(fv.id) === String(route.vehicleId),
          );
          simulationData[route.vehicleId] = {
            coordinates: route.coordinates,
            typeId: v?.type.id || "eco",
          };
        }
      });

      fetch("/api/gps/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: simulationData, action: "update" }),
      }).catch((err) => console.error("Failed to update simulation:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, routeData]);

  // Auto-start Logic: Start tracking as soon as we have a valid route
  useEffect(() => {
    if (routeData?.vehicleRoutes && routeData.vehicleRoutes.length > 0 && !isTracking) {
      console.log("[Tracking] Auto-starting live simulation for new routes...");
      startTracking();
    }
    // We only want to auto-start when routeData transitions or tracking is off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeData]);

  const startTracking = useCallback(() => {
    const routes = routeDataRef.current;
    if (isTrackingRef.current) return;

    if (routes?.vehicleRoutes) {
      const simulationData: Record<string, any> = {};
      routes.vehicleRoutes.forEach((route: any) => {
        if (route.vehicleId && route.coordinates) {
          const v = fleetVehiclesRef.current.find(
            (fv) => String(fv.id) === String(route.vehicleId),
          );
          simulationData[route.vehicleId] = {
            coordinates: route.coordinates,
            typeId: v?.type.id || "eco",
          };
        }
      });

      fetch("/api/gps/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: simulationData, action: "start" }),
      }).catch((err) => console.error("Failed to start simulation:", err));
    }

    setIsTracking(true);
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    trackingIntervalRef.current = setInterval(fetchPositions, 4000);
    fetchPositions();
  }, [fetchPositions]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // STABLE callback - uses refs
  const toggleTracking = useCallback(() => {
    if (isTrackingRef.current) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [startTracking, stopTracking]);

  return {
    isTracking,
    toggleTracking,
    setIsTracking,
  };
}
