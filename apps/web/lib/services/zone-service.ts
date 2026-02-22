import { Zone } from "@gis/shared";

export class ZoneService {
    /**
     * Fetches zones (LEZ, Restricted, etc.) around a point from the database.
     * Returns empty array in mock mode so the app remains functional without a DB.
     */
    static async getZones(lat: number, lon: number, radius = 5000): Promise<Zone[]> {
        if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
            return []; // No zones in mock mode — the map layer won't show zone overlays
        }
        try {
            console.log(`[ZoneService] Fetching zones from DB for ${lat},${lon} (radius: ${radius}m)`);
            const { repository } = await import("@/lib/db");
            return await repository.getZones(lat, lon, radius);
        } catch (err) {
            console.error("ZoneService Error:", err);
            throw err;
        }
    }
}
