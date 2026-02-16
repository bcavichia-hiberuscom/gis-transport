export interface TelemetryData {
    fuel?: number;
    battery?: number;
    distance: number;
    isElectric: boolean;
}

export interface VehiclePosition {
    coords: [number, number];
    routeIndex: number;
}

export interface SimulationState {
    routes: Record<string, any>;
    jobs: any[];
    completedJobs: Set<string>;
    positions: Record<string, VehiclePosition>;
    telemetry: Record<string, TelemetryData>;
    isRunning: boolean;
    intervalId?: NodeJS.Timeout;
}

declare global {
    // eslint-disable-next-line no-var
    var gpsSimulation: SimulationState | undefined;
}

if (!global.gpsSimulation) {
    global.gpsSimulation = {
        routes: {},
        jobs: [],
        completedJobs: new Set(),
        positions: {},
        telemetry: {},
        isRunning: false,
    };
}

export class VehicleTrackingService {
    /**
     * Returns the current global simulation state.
     * In a real application, this would fetch from a database or Redis.
     */
    private static getState(): SimulationState {
        if (!global.gpsSimulation) {
            throw new Error("GPS Simulation not initialized");
        }
        return global.gpsSimulation;
    }

    static getAllPositions() {
        return this.getState().positions;
    }

    static getAllTelemetry() {
        return this.getState().telemetry;
    }

    static getCompletedJobs() {
        return this.getState().completedJobs;
    }

    static isRunning() {
        return this.getState().isRunning;
    }

    /**
     * Starts the simulation with provided routes and jobs.
     */
    static startSimulation(routes: Record<string, any>, jobs: any[] = []) {
        const state = this.getState();
        state.routes = routes;
        state.jobs = jobs;
        state.completedJobs = new Set();
        state.isRunning = true;

        // Initialize positions and telemetry
        Object.entries(routes).forEach(([vehicleId, data]) => {
            const route = Array.isArray(data) ? data : data.coordinates;
            const typeId = Array.isArray(data) ? null : data.typeId;

            const isElectric = typeId
                ? typeId === "zero" || typeId.toLowerCase().includes("electric")
                : vehicleId.includes("phys")
                    ? parseInt(vehicleId.split("-").pop() || "0") % 2 === 1
                    : vehicleId.includes("eco") || vehicleId.includes("zero");

            if (route && route.length > 0) {
                state.positions[vehicleId] = {
                    coords: route[0],
                    routeIndex: 0,
                };
            }

            state.telemetry[vehicleId] = {
                fuel: isElectric ? undefined : 80 + Math.random() * 20,
                battery: isElectric ? 80 + Math.random() * 20 : undefined,
                distance: 10000 + Math.floor(Math.random() * 50000),
                isElectric,
            };
        });

        // Start loop if not running
        if (!state.intervalId) {
            state.intervalId = setInterval(() => this.tick(), 2000);
        }

        return Object.keys(routes).length;
    }

    /**
     * Stops the simulation.
     */
    static stopSimulation() {
        const state = this.getState();
        state.isRunning = false;
        if (state.intervalId) {
            clearInterval(state.intervalId);
            state.intervalId = undefined;
        }
    }

    /**
     * Updates routes dynamically.
     */
    static updateRoutes(routes: Record<string, any>, jobs?: any[]) {
        const state = this.getState();
        state.routes = routes;
        if (jobs) state.jobs = jobs;

        Object.entries(routes).forEach(([vehicleId, data]) => {
            const route = Array.isArray(data) ? data : data.coordinates;
            // Logic to reset or keep position could be refined, currently resets index if exists or inits
            if (route && route.length > 0) {
                if (!state.positions[vehicleId]) {
                    state.positions[vehicleId] = {
                        coords: route[0],
                        routeIndex: 0,
                    };
                }
                // If exists, we might want to keep it or find nearest point on new route.
                // For simplicity/parity with original, we reset index if explicit update implies it,
                // OR strictly speaking the original code reset index to 0.
                state.positions[vehicleId].routeIndex = 0;
            }

            // Ensure telemetry
            if (!state.telemetry[vehicleId]) {
                // ... init telemetry ...
                const typeId = Array.isArray(data) ? null : data.typeId;
                const isElectric = typeId
                    ? typeId === "zero" || typeId.toLowerCase().includes("electric")
                    : vehicleId.includes("phys")
                        ? parseInt(vehicleId.split("-").pop() || "0") % 2 === 1
                        : vehicleId.includes("eco") || vehicleId.includes("zero");

                state.telemetry[vehicleId] = {
                    fuel: isElectric ? undefined : 80 + Math.random() * 20,
                    battery: isElectric ? 80 + Math.random() * 20 : undefined,
                    distance: 10000 + Math.floor(Math.random() * 50000),
                    isElectric,
                };
            }
        });

        return Object.keys(routes).length;
    }

    /**
     * Internal tick function to update positions.
     */
    private static tick() {
        const state = this.getState();
        if (!state.isRunning) return;

        Object.entries(state.positions).forEach(([vehicleId, data]) => {
            const rawRoute = state.routes[vehicleId];
            const route = Array.isArray(rawRoute) ? rawRoute : rawRoute?.coordinates;
            const tel = state.telemetry[vehicleId];

            if (route && route.length > 0 && tel) {
                const step = Math.max(1, Math.floor(route.length / 100));
                const nextIndex = Math.min(data.routeIndex + step, route.length - 1);
                const isMoving = nextIndex > data.routeIndex; // Actually moving forward

                const dLat = route[nextIndex][0] - data.coords[0];
                const dLon = route[nextIndex][1] - data.coords[1];
                const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 111;

                // Update position
                state.positions[vehicleId] = {
                    coords: route[nextIndex],
                    routeIndex: nextIndex,
                };

                // Job validation logic...
                const activeJobs = state.jobs || [];
                const segmentStart = data.routeIndex;
                const segmentEnd = nextIndex;

                activeJobs.forEach((job: any) => {
                    const jobKey = String(job.id);
                    if (String(job.assignedVehicleId) === String(vehicleId) && !state.completedJobs.has(jobKey)) {
                        for (let i = segmentStart; i <= segmentEnd; i++) {
                            const point = route[i];
                            const dist = this.getDistance(point, job.position);
                            if (dist <= 0.5) {
                                state.completedJobs.add(jobKey);
                                break;
                            }
                        }
                    }
                });

                if (isMoving) {
                    tel.distance += distKm;
                    if (tel.isElectric && tel.battery) {
                        tel.battery = Math.max(5, tel.battery - distKm * 0.2);
                    } else if (tel.fuel) {
                        tel.fuel = Math.max(5, tel.fuel - distKm * 0.1);
                    }
                }
            }
        });
    }

    private static getDistance(p1: [number, number], p2: [number, number]) {
        const R = 6371; // km
        const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
        const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((p1[0] * Math.PI) / 180) *
            Math.cos((p2[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
