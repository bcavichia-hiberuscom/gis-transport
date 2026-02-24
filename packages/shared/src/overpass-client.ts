import { OverpassResponse, POI, RoadInfo, OverpassElement } from "./index";

/**
 * Universal client for Overpass API.
 * Works in both Browser and Node.js (18+).
 */
export class OverpassClient {
  private static readonly URLS = [
    "https://overpass.kumi.systems/api/interpreter",  // Primary - good stability
    "https://overpass-api.de/api/interpreter",         // Fallback - public instance
    "https://overpass.osm.ch/api/interpreter",         // Fallback - Swiss instance
  ];
  private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds to be safe
  private static urlIndex = 0;

  /**
   * Executes a raw Overpass QL query with automatic fallback to alternative servers.
   */
  static async query(
    query: string,
    options: {
      timeout?: number;
      url?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<OverpassResponse> {
    const timeout = options.timeout ?? this.DEFAULT_TIMEOUT;
    const customUrl = options.url;
    
    // If custom URL provided or on first attempt, try the URLs in rotation
    const urlsToTry = customUrl ? [customUrl] : this.URLS;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < urlsToTry.length; attempt++) {
      const url = urlsToTry[attempt];
      console.log(`[OverpassClient] Attempting request to: ${url} (attempt ${attempt + 1}/${urlsToTry.length})`);

      // Create a fresh controller for each attempt
      const controller = new AbortController();
      const signal = controller.signal;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: query,
          headers: {
            "Content-Type": "text/plain",
            "User-Agent": "GIS-Transport-Logistics/1.0",
          },
          signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const statusMessage = {
            429: "Too many requests (rate limited)",
            504: "Gateway timeout (server busy or query too complex)",
            500: "Internal server error",
          } as Record<number, string>;
          
          const message = statusMessage[response.status] || `HTTP ${response.status}`;
          const err = new Error(`Overpass API error (${response.status}): ${message}`);
          console.warn(`[OverpassClient] Request failed: ${message}`);
          lastError = err;

          // Try next server on rate limit or timeout
          if ([429, 504, 500, 503].includes(response.status)) {
            continue;
          }
          throw err;
        }

        const data = await response.json();
        console.log(`[OverpassClient] ✅ Query successful on ${url} - Returned ${data.elements?.length || 0} elements`);
        // Update to remember which URL worked best
        this.urlIndex = this.URLS.indexOf(url);
        return data as OverpassResponse;
      } catch (e) {
        clearTimeout(timeoutId);
        
        if (e instanceof Error && e.name === 'AbortError') {
          console.warn(`[OverpassClient] Request timeout (>${timeout}ms) on ${url}, trying next server...`);
          lastError = e;
          continue;
        }
        
        if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
          console.warn(`[OverpassClient] Network error on ${url}, trying next server...`);
          lastError = e;
          continue;
        }
        
        throw e;
      }
    }

    // All URLs failed
    throw lastError || new Error('All Overpass API servers are unavailable');
  }

  /**
   * Fetches POIs around a location.
   */
  static async fetchAroundPOIs(
    lat: number,
    lon: number,
    radiusMeters: number,
    amenity: "fuel" | "charging_station",
  ): Promise<POI[]> {
    const maxRadius = Math.min(radiusMeters, 10000); // Cap at 10km
    const query = `[out:json][timeout:15];
            node["amenity"="${amenity}"](around:${maxRadius},${lat},${lon});
            out 100;`;

    const data = await this.query(query, { timeout: 15000 });
    const type = amenity === "fuel" ? "gas" : "ev";

    return (data.elements || [])
      .map((element: OverpassElement) => {
        const latEl = element.lat ?? element.center?.lat;
        const lonEl = element.lon ?? element.center?.lon;
        if (!latEl || !lonEl) return null;

        return {
          id: `${type}-${element.id}`,
          name:
            element.tags?.name ||
            element.tags?.brand ||
            (type === "gas" ? "Gas Station" : "EV Charging Station"),
          position: [latEl, lonEl] as [number, number],
          type: type,
          brand: element.tags?.brand,
          operator: element.tags?.operator,
          address: element.tags?.["addr:street"]
            ? `${element.tags["addr:street"]}${element.tags["addr:housenumber"] ? " " + element.tags["addr:housenumber"] : ""}`
            : undefined,
          town: element.tags?.["addr:city"] || element.tags?.["addr:town"],
          postalCode: element.tags?.["addr:postcode"],
          connectors:
            type === "ev" ? Number(element.tags?.capacity || 1) : undefined,
        } as POI;
      })
      .filter((p): p is POI => p !== null);
  }

  /**
   * Fetches road info (maxspeed, name) around a location.
   */
  static async fetchAroundRoadInfo(
    lat: number,
    lon: number,
  ): Promise<RoadInfo> {
    // Use a smaller radius (50m) to be more specific about the current location
    // and reduce load on Overpass API
    const query = `[out:json][timeout:5];
            way(around:50,${lat},${lon})[highway][highway!~"footway|path|cycleway|service"];
            out tags 1;`;

    const data = await this.query(query, { timeout: 6000 });
    const elements = data.elements || [];
    if (elements.length === 0) return {};

    // Find the best way with maxspeed tag
    const bestWay = elements.find((e: any) => e.tags?.maxspeed) || elements[0];
    let maxSpeed: number | undefined;

    if (bestWay?.tags?.maxspeed) {
      const match = bestWay.tags.maxspeed.match(/\d+/);
      if (match) maxSpeed = parseInt(match[0]);
    }

    // Fallback: infer speed limit from highway classification when no explicit maxspeed tag
    if (!maxSpeed && bestWay?.tags?.highway) {
      const highwaySpeedDefaults: Record<string, number> = {
        motorway: 120,
        motorway_link: 80,
        trunk: 100,
        trunk_link: 60,
        primary: 90,
        primary_link: 50,
        secondary: 70,
        secondary_link: 40,
        tertiary: 50,
        tertiary_link: 30,
        unclassified: 40,
        residential: 30,
        living_street: 20,
        track: 30,
      };
      maxSpeed = highwaySpeedDefaults[bestWay.tags.highway] ?? 50;
    }

    return {
      maxSpeed,
      roadName: bestWay?.tags?.name,
      smoothness: bestWay?.tags?.smoothness,
      surface: bestWay?.tags?.surface,
      highway: bestWay?.tags?.highway,
    };
  }

  /**
   * Fetches road segments with poor smoothness values within a bounding box.
   * Ultra-simplified query to avoid Overpass timeouts.
   */
  static async fetchPoorSmoothnessWays(
    bbox: [number, number, number, number],
  ): Promise<OverpassElement[]> {
    const [minLat, minLon, maxLat, maxLon] = bbox;
    console.log(`[OverpassClient] Fetching poor smoothness ways for bbox: [${minLat.toFixed(4)}, ${minLon.toFixed(4)}, ${maxLat.toFixed(4)}, ${maxLon.toFixed(4)}]`);
    
    // Ultra-simplified: just look for explicit smoothness tags
    const query = `[out:json][timeout:15];
way["smoothness"~"bad|very_bad|horrible"](${minLat},${minLon},${maxLat},${maxLon});
out geom;`;

    try {
      console.log(`[OverpassClient] Sending simplified query to Overpass API...`);
      // 60 second client timeout to allow Overpass time to process
      const data = await this.query(query, { timeout: 60000 });
      const ways = data.elements || [];
      console.log(`[OverpassClient] Poor smoothness query returned ${ways.length} ways`);
      if (ways.length > 0) {
        ways.slice(0, 3).forEach((w, i) => {
          const tagsStr = w.tags ? JSON.stringify(w.tags).substring(0, 60) : 'no tags';
          console.log(`  Way ${i+1}: id=${w.id}, pts=${w.geometry?.length || 0}, ${tagsStr}`);
        });
      }
      return ways;
    } catch (e) {
      console.error(`[OverpassClient] Error fetching poor smoothness ways:`, e);
      console.warn(`[OverpassClient] Returning empty array as fallback`);
      return [];
    }
  }
}
