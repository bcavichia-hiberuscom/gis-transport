import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VehicleTrackingService } from '@/lib/services/vehicle-tracking-service';

describe('VehicleTrackingService', () => {
    beforeEach(() => {
        // Reset global state
        global.gpsSimulation = {
            routes: {},
            jobs: [],
            completedJobs: new Set(),
            positions: {},
            telemetry: {},
            isRunning: false,
        };
        // Mock timers for ticking
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('startSimulation', () => {
        it('should initialize state and start running', () => {
            const routes = {
                'veh-1': { coordinates: [[0, 0], [1, 1]] }
            };

            VehicleTrackingService.startSimulation(routes);

            expect(VehicleTrackingService.isRunning()).toBe(true);
            const positions = VehicleTrackingService.getAllPositions();
            expect(positions['veh-1']).toBeDefined();
            expect(positions['veh-1'].coords).toEqual([0, 0]);
        });

        it('should correctly identify electric vehicles types', () => {
            const routes = {
                'ev-1': { typeId: 'zero', coordinates: [[0, 0]] },
                'gas-1': { typeId: 'diesel', coordinates: [[0, 0]] }
            };

            VehicleTrackingService.startSimulation(routes);
            const telemetry = VehicleTrackingService.getAllTelemetry();

            expect(telemetry['ev-1'].isElectric).toBe(true);
            expect(telemetry['gas-1'].isElectric).toBe(false);
            expect(telemetry['ev-1'].battery).toBeDefined();
            expect(telemetry['gas-1'].fuel).toBeDefined();
        });
    });

    describe('tick', () => {
        it('should move vehicles along routes', () => {
            const routes = {
                'veh-1': { coordinates: [[0, 0], [0.1, 0.1], [0.2, 0.2]] } // Short route
            };

            VehicleTrackingService.startSimulation(routes);
            const initialPos = VehicleTrackingService.getAllPositions()['veh-1'];

            // Fast forward time
            vi.advanceTimersByTime(2000); // 1 tick

            const newPos = VehicleTrackingService.getAllPositions()['veh-1'];
            expect(newPos.routeIndex).toBeGreaterThan(initialPos.routeIndex);
            expect(newPos.coords).not.toEqual(initialPos.coords);
        });

        it('should stop moving when simulation is stopped', () => {
            const routes = {
                'veh-1': { coordinates: [[0, 0], [1, 1]] }
            };
            VehicleTrackingService.startSimulation(routes);
            VehicleTrackingService.stopSimulation();

            const initialPos = VehicleTrackingService.getAllPositions()['veh-1'];
            vi.advanceTimersByTime(5000);
            const newPos = VehicleTrackingService.getAllPositions()['veh-1'];

            expect(initialPos).toEqual(newPos);
            expect(VehicleTrackingService.isRunning()).toBe(false);
        });
    });
});
