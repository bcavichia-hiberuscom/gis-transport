import { repository } from "@/lib/db";
import { Zone } from "@gis/shared";

export class ZoneService {
    /**
     * Fetches zones (LEZ, Restricted, etc.) around a point from the database.
     */
    static async getZones(lat: number, lon: number, radius = 5000): Promise<Zone[]> {
        try {
            console.log(`[ZoneService] Fetching zones from DB for ${lat},${lon} (radius: ${radius}m)`);
            return await repository.getZones(lat, lon, radius);
        } catch (err) {
            console.error("ZoneService Error:", err);
            // Return empty array or rethrow depending on strategy. 
            // Given the route handles errors, rethrowing or returning empty might depend.
            // Following POIService style, we might return empty or throw.
            throw err;
        }
    }
}
