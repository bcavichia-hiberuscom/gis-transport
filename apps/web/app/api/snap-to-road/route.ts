import { type NextRequest, NextResponse } from "next/server";
import { FetchError, OrsLocation, SnappedPoint } from "@/lib/types";
import { fetchWithTimeout } from "@/lib/fetch-utils";
import { TIMEOUTS, ROUTING_CONFIG } from "@/lib/config";

const ORS_LOCAL = process.env.ORS_LOCAL_URL || "http://127.0.0.1:8080/ors/v2";
const ORS_PUBLIC = "https://api.openrouteservice.org/v2";
const ORS_API_KEY = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY || "";

async function callOrsSnap(locations: number[][], usePublic: boolean) {
  const baseUrl = usePublic ? ORS_PUBLIC : ORS_LOCAL;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (usePublic && ORS_API_KEY) headers["Authorization"] = ORS_API_KEY;

  return fetchWithTimeout(`${baseUrl}/snap/driving-car`, {
    method: "POST",
    headers,
    body: JSON.stringify({ locations, radius: ROUTING_CONFIG.DEFAULT_RADIUS }),
    timeout: TIMEOUTS.SNAP,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { coordinates } = await request.json();

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }
    const locations = coordinates.map(([lat, lon]: number[]) => [lon, lat]);

    // Try local ORS first, fallback to public
    let response: Response | null = null;

    try {
      response = await callOrsSnap(locations, false);
      if (!response.ok) throw new Error(`Local ORS snap failed: ${response.status}`);
    } catch (localErr) {
      console.warn("[Snap] Local ORS unavailable, falling back to public API");
      try {
        response = await callOrsSnap(locations, true);
      } catch (publicErr) {
        // Both failed, return original coordinates
        return NextResponse.json({
          snapped: coordinates.map(([lat, lon]: number[]) => ({
            location: [lat, lon],
            snapped: false,
          })),
        });
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({
        snapped: coordinates.map(([lat, lon]: number[]) => ({
          location: [lat, lon],
          snapped: false,
        })),
      });
    }

    try {
      const data = await response.json();

      const snapped: SnappedPoint[] = data.locations.map((loc: OrsLocation, idx: number) => {
        if (loc && loc.location?.length === 2 && loc.snapped_distance != null) {
          const [lon, lat] = loc.location;
          console.log(`[Snap] Point ${idx}: [${coordinates[idx]}] -> [${lat}, ${lon}] (distance: ${loc.snapped_distance}m)`);
          return { location: [lat, lon], snapped: true, distance: loc.snapped_distance };
        }
        console.log(`[Snap] Point ${idx}: Could not snap [${coordinates[idx]}] (loc: ${loc})`);
        return { location: coordinates[idx], snapped: false };
      });

      return NextResponse.json({ snapped });
    } catch (err) {
      const error = err as FetchError;
      console.error("Snap-to-road fetch error:", error.message);

      return NextResponse.json({
        snapped: coordinates.map(([lat, lon]: number[]) => ({
          location: [lat, lon],
          snapped: false,
        })),
      });
    }
  } catch (error) {
    console.error("Snap-to-road error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
