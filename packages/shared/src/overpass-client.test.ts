import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverpassClient } from './overpass-client';
import { OverpassResponse } from './index';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('OverpassClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('query', () => {
        it('should execute a query and return data', async () => {
            const mockData: OverpassResponse = { elements: [] };
            globalFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData,
            });

            const result = await OverpassClient.query('node(1);out;');

            expect(result).toEqual(mockData);
            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining('kumi.systems'),
                expect.objectContaining({
                    method: 'POST',
                    body: 'node(1);out;',
                })
            );
        });

        it('should throw an error if response is not ok', async () => {
            globalFetch.mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => 'Bad Request',
            });

            await expect(OverpassClient.query('invalid')).rejects.toThrow('Overpass API error (400)');
        });

        it('should handle timeouts', async () => {
            // Mock fetch to simulate abort signal usage
            globalFetch.mockImplementation(async (url, options) => {
                return new Promise((resolve) => {
                    // Simulate long request
                    setTimeout(() => {
                        resolve({ ok: true, json: async () => ({ elements: [] }) });
                    }, 100);
                });
            });

            // Check if timeout is passed to fetch options (not essentially testing the timeout triggering unless we use fake timers for abort)
            await OverpassClient.query('node(1);out;', { timeout: 1000 });

            expect(globalFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    signal: expect.any(Object) // AbortSignal
                })
            );
        });
    });

    describe('fetchAroundPOIs', () => {
        it('should construct correct query for fuel stations', async () => {
            const mockData: OverpassResponse = {
                elements: [
                    {
                        type: 'node',
                        id: 1,
                        lat: 10,
                        lon: 10,
                        tags: { name: 'Gas Station 1' }
                    }
                ]
            };

            globalFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData,
            });

            const result = await OverpassClient.fetchAroundPOIs(0, 0, 1000, 'fuel');

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('gas');
            expect(result[0].name).toBe('Gas Station 1');

            // Check query construction
            const lastCall = globalFetch.mock.calls[0];
            const body = lastCall[1].body;
            expect(body).toContain('amenity"="fuel"');
            expect(body).toContain('around:1000,0,0');
        });

        it('should construct correct query for charging stations', async () => {
            const mockData: OverpassResponse = { elements: [] };
            globalFetch.mockResolvedValue({ ok: true, json: async () => mockData });

            await OverpassClient.fetchAroundPOIs(0, 0, 1000, 'charging_station');

            const lastCall = globalFetch.mock.calls[0];
            const body = lastCall[1].body;
            expect(body).toContain('amenity"="charging_station"');
        });
    });
});
