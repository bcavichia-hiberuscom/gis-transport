import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService, SpeedingEvent } from '@/lib/services/driver-service';

// Mock repository
const mockLogSpeeding = vi.fn();
const mockGetDrivers = vi.fn();
const mockGetDriverById = vi.fn();
const mockAddDriver = vi.fn();
const mockUpdateDriver = vi.fn();
const mockCreateAssignment = vi.fn();

vi.mock('@/lib/db', () => ({
    repository: {
        logSpeeding: (...args: any[]) => mockLogSpeeding(...args),
        getDrivers: () => mockGetDrivers(),
        getDriverById: (id: any) => mockGetDriverById(id),
        addDriver: (data: any) => mockAddDriver(data),
        updateDriver: (id: any, data: any) => mockUpdateDriver(id, data),
        createDriverVehicleAssignment: (data: any) => mockCreateAssignment(data),
    },
}));

describe('DriverService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logSpeeding', () => {
        it('should call repository.logSpeeding with correct parameters', async () => {
            const driverId = 'driver-1';
            const event: SpeedingEvent = {
                speed: 100,
                limit: 80,
                latitude: 40,
                longitude: -3,
            };

            await DriverService.logSpeeding(driverId, event);

            expect(mockLogSpeeding).toHaveBeenCalledWith(driverId, {
                speed: 100,
                limit: 80,
                latitude: 40,
                longitude: -3,
            });
        });
    });

    describe('createDriver', () => {
        it('should not allow creating a driver with a vehicle assignment', async () => {
            const data = {
                name: 'John Doe',
                currentVehicleId: 'veh-1'
            };

            await expect(DriverService.createDriver(data)).rejects.toThrow("New drivers cannot be created with an existing vehicle assignment");
        });

        it('should call repository.addDriver when data is valid', async () => {
            const data = {
                name: 'Jane Doe',
            };
            mockAddDriver.mockResolvedValue({ id: 'd-1', ...data });

            const result = await DriverService.createDriver(data);

            expect(mockAddDriver).toHaveBeenCalledWith(data);
            expect(result).toEqual({ id: 'd-1', ...data });
        });
    });

    describe('updateDriver', () => {
        it('should validate vehicle ID format', async () => {
            const data = {
                currentVehicleId: true // Invalid type
            };
            await expect(DriverService.updateDriver('d-1', data)).rejects.toThrow("Invalid vehicle ID format");
        });

        it('should create assignment history when vehicle changes', async () => {
            const driverId = 'd-1';
            const existingDriver = {
                id: driverId,
                currentVehicleId: 'veh-old',
                updatedAt: new Date().toISOString()
            };
            const updateData = {
                currentVehicleId: 'veh-new'
            };

            mockGetDriverById.mockResolvedValue(existingDriver);
            mockUpdateDriver.mockResolvedValue({ ...existingDriver, ...updateData });

            await DriverService.updateDriver(driverId, updateData);

            expect(mockCreateAssignment).toHaveBeenCalled();
            expect(mockUpdateDriver).toHaveBeenCalledWith(driverId, updateData);
        });
    });
});
