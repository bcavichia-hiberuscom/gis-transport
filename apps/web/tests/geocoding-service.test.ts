import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeocodingService } from '@/lib/services/geocoding-service';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('GeocodingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('search', () => {
        it('should call Nominatim API with correct parameters', async () => {
            const query = 'Madrid';
            const mockResponse = {
                ok: true,
                json: async () => ([
                    {
                        lat: '40.4168',
                        lon: '-3.7038',
                        display_name: 'Madrid, Spain',
                        address: { city: 'Madrid', state: 'MD', country: 'Spain' }
                    }
                ])
            };
            globalFetch.mockResolvedValue(mockResponse);

            const result = await GeocodingService.search(query);

            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining('https://nominatim.openstreetmap.org/search'),
                expect.objectContaining({
                    headers: expect.objectContaining({ "User-Agent": expect.any(String) }),
                })
            );
            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining('q=Madrid'),
                expect.any(Object)
            );
            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining('countrycodes=es'),
                expect.any(Object)
            );

            expect(result).toHaveLength(1);
            expect(result[0].city).toBe('Madrid');
        });

        it('should handle API errors by returning empty array', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Server Error'
            };
            globalFetch.mockResolvedValue(mockResponse);

            const result = await GeocodingService.search('ErrorCity');

            expect(result).toEqual([]);
        });

        it('should handle network exceptions', async () => {
            globalFetch.mockRejectedValue(new Error('Network error'));

            const result = await GeocodingService.search('NetworkError');

            expect(result).toEqual([]);
        });
    });

    describe('reverse', () => {
        it('should call Nominatim reverse API', async () => {
            const lat = 40;
            const lon = -3;
            const mockResponse = {
                ok: true,
                json: async () => ({
                    lat: '40',
                    lon: '-3',
                    display_name: 'Test Location',
                    address: { road: 'Test Road' }
                })
            };
            globalFetch.mockResolvedValue(mockResponse);

            const result = await GeocodingService.reverse(lat, lon);

            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining(`lat=${lat}&lon=${lon}`),
                expect.any(Object)
            );
            expect(result).toBe('Test Road');
        });
    });
});
