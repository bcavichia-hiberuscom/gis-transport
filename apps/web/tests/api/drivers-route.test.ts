import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/drivers/route';
import { DriverService } from '@/lib/services/driver-service';

// Mock the service layer
vi.mock('@/lib/services/driver-service', () => ({
    DriverService: {
        getAllDrivers: vi.fn(),
        createDriver: vi.fn(),
        clearAssignments: vi.fn(),
    }
}));

describe('API Route: /api/drivers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should return a list of drivers with 200 OK', async () => {
            const mockDrivers = [{ id: '1', name: 'John' }];
            (DriverService.getAllDrivers as any).mockResolvedValue(mockDrivers);

            // Create a mock Request object
            const res = await GET();

            expect(res.status).toBe(200);
            const json = await res.json();

            // The API wraps the response in { success: true, data: ... }
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockDrivers);
            expect(DriverService.getAllDrivers).toHaveBeenCalled();
        });

        it('should handle service errors with 500', async () => {
            (DriverService.getAllDrivers as any).mockRejectedValue(new Error('DB Error'));

            const res = await GET();

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.error).toBe('DB Error');
        });
    });

    describe('POST', () => {
        it('should handle "clear-assignments" action', async () => {
            const mockData = [{ id: '1', currentVehicleId: null }];
            (DriverService.clearAssignments as any).mockResolvedValue(mockData);

            const body = { action: 'clear-assignments' };
            const req = new Request('http://localhost/api/drivers', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            const res = await POST(req as any);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.message).toBe('All driver assignments cleared');
            expect(json.data).toEqual(mockData);
            expect(DriverService.clearAssignments).toHaveBeenCalled();
        });

        it('should create a new driver when action is standard', async () => {
            const newDriverInput = { name: 'New Driver' };
            const createdDriver = { id: '2', ...newDriverInput };
            (DriverService.createDriver as any).mockResolvedValue(createdDriver);

            const req = new Request('http://localhost/api/drivers', {
                method: 'POST',
                body: JSON.stringify(newDriverInput),
            });
            const res = await POST(req as any);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(createdDriver);
            expect(DriverService.createDriver).toHaveBeenCalledWith(newDriverInput);
        });

        it('should handle validation errors with 400', async () => {
            // The implementation checks for specific error messages for 400
            (DriverService.createDriver as any).mockRejectedValue(new Error('New drivers cannot be created with an existing vehicle assignment'));

            const req = new Request('http://localhost/api/drivers', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req as any);

            expect(res.status).toBe(400);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.error).toContain('New drivers cannot be created');
        });

        it('should handle generic server errors with 500', async () => {
            (DriverService.createDriver as any).mockRejectedValue(new Error('Unexpected DB Error'));

            const req = new Request('http://localhost/api/drivers', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req as any);

            expect(res.status).toBe(500);
            const json = await res.json();
            expect(json.success).toBe(false);
            expect(json.error).toBe('Unexpected DB Error');
        });
    });
});
