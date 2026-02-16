import { describe, it, expect } from 'vitest';
import { RoutingService } from '@/lib/services/routing-service';
import { Zone } from '@gis/shared';

describe('RoutingService Logic', () => {

    describe('isPointInZone (via private access or helper)', () => {
        // exposing private method for testing or assume we test via public interface
        // Since isPointInZone is private, we can test it via getForbiddenZonesForVehicle if we mock the intersection check,
        // OR we can export it for testing. For now, testing generic zone logic via public methods if possible, 
        // or using 'any' casting to access private static methods for unit testing purposes.

        it('should correctly identify a point inside a polygon', () => {
            const polygon = [[0, 0], [10, 0], [10, 10], [0, 10]]; // 10x10 square at origin
            const pointInside: [number, number] = [5, 5];
            const pointOutside: [number, number] = [15, 5];

            // Accessing private method for unit testing
            const isInside = (RoutingService as any).isPointInPolygon(pointInside, polygon);
            const isOutside = (RoutingService as any).isPointInPolygon(pointOutside, polygon);

            expect(isInside).toBe(true);
            expect(isOutside).toBe(false);
        });

        it('should handle complex shapes', () => {
            const polygon = [[0, 0], [5, 5], [10, 0], [5, 10]]; // Diamond shape
            const center: [number, number] = [5, 5];
            const topCorner: [number, number] = [5, 9.9];

            expect((RoutingService as any).isPointInPolygon(center, polygon)).toBe(true);
            expect((RoutingService as any).isPointInPolygon(topCorner, polygon)).toBe(true);
        });
    });

    describe('getForbiddenZonesForVehicle', () => {
        const lezZone: Zone = {
            id: 'z1',
            name: 'Madrid Central',
            type: 'LEZ',
            requiredTags: ['zero', 'eco'],
            coordinates: []
        };

        const restrictedZone: Zone = {
            id: 'z2',
            name: 'Area 51',
            type: 'RESTRICTED',
            requiredTags: ['military'],
            coordinates: []
        };

        const zones = [lezZone, restrictedZone];

        it('should return zones where vehicle lacks required tags', () => {
            const dieselTruckTags = ['diesel', 'c']; // No 'zero', no 'eco'

            // Should be forbidden in LEZ (needs zero/eco) AND Restricted (needs military)
            const forbidden = (RoutingService as any).getForbiddenZonesForVehicle(dieselTruckTags, zones);

            expect(forbidden).toHaveLength(2);
            expect(forbidden.map((z: Zone) => z.id)).toContain('z1');
            expect(forbidden.map((z: Zone) => z.id)).toContain('z2');
        });

        it('should allow access if vehicle has ONE of the required tags', () => {
            const ecoCarTags = ['gasoline', 'eco']; // Has 'eco'

            // Should be allowed in LEZ (has eco), but forbidden in Restricted
            const forbidden = (RoutingService as any).getForbiddenZonesForVehicle(ecoCarTags, zones);

            expect(forbidden).toHaveLength(1);
            expect(forbidden[0].id).toBe('z2'); // Restricted zone
        });

        it('should allow access if vehicle has ALL required tags', () => {
            const militaryEvansTags = ['zero', 'military'];

            // Allowed in both
            const forbidden = (RoutingService as any).getForbiddenZonesForVehicle(militaryEvansTags, zones);

            expect(forbidden).toHaveLength(0);
        });
    });
});
