import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZoneService } from '@/lib/services/zone-service';

// Mock repository
const mockGetZones = vi.fn();

vi.mock('@/lib/db', () => ({
    repository: {
        getZones: (...args: any[]) => mockGetZones(...args),
    },
}));

describe('ZoneService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getZones', () => {
        it('should fetch zones from repository with correct parameters', async () => {
            const lat = 40.0;
            const lon = -3.0;
            const radius = 1000;

            const mockZones = [{ id: 'zone-1', name: 'Test Zone' }];
            mockGetZones.mockResolvedValue(mockZones);

            const result = await ZoneService.getZones(lat, lon, radius);

            expect(mockGetZones).toHaveBeenCalledWith(lat, lon, radius);
            expect(result).toEqual(mockZones);
        });

        it('should use default radius if not provided', async () => {
            const lat = 40.0;
            const lon = -3.0;

            await ZoneService.getZones(lat, lon);

            expect(mockGetZones).toHaveBeenCalledWith(lat, lon, 5000); // Default 5000 from service
        });

        it('should handle repository errors gracefully', async () => {
            const error = new Error('Database error');
            mockGetZones.mockRejectedValue(error);

            await expect(ZoneService.getZones(0, 0)).rejects.toThrow('Database error');
        });
    });
});
