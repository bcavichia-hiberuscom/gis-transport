import { type NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-utils";
import { FetchError } from "@/lib/types";
import { TIMEOUTS, ROUTING_CONFIG, ORS_LOCAL_URL, ORS_PUBLIC_URL, ORS_API_KEY } from "@/lib/config";

const ORS_LOCAL = ORS_LOCAL_URL;
const ORS_PUBLIC = ORS_PUBLIC_URL;

async function callOrsMatrix(locations: number[][], usePublic: boolean) {
  const baseUrl = usePublic ? ORS_PUBLIC : ORS_LOCAL;
  const headers: Record<string, string> = { 
    "Content-Type": "application/json",
    "Accept": "application/json, application/geo+json, export/json, text/plain, */*"
  };
  
  if (usePublic && ORS_API_KEY) {
    headers["Authorization"] = ORS_API_KEY;
  }

  const url = `${baseUrl}/matrix/driving-car`;
  console.log(`[Matrix] Calling ORS (${usePublic ? 'Public' : 'Local'}): ${url}`);

  return fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ 
      locations, 
      metrics: ["distance", "duration"], 
      units: "m" 
    }),
    timeout: TIMEOUTS.MATRIX,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { coordinates } = await request.json();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 coordinates" },
        { status: 400 }
      );
    }

    if (coordinates.length > ROUTING_CONFIG.MAX_LOCATIONS) {
      return NextResponse.json(
        { error: `Too many locations. Maximum is ${ROUTING_CONFIG.MAX_LOCATIONS}` },
        { status: 400 }
      );
    }

    const locations = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

    // Try local ORS first, fallback to public
    let response: Response | null = null;
    let fallbackToPublic = false;

    try {
      response = await callOrsMatrix(locations, false);
      if (!response.ok) {
        console.warn(`[Matrix] Local ORS failed with status ${response.status}. Trying public...`);
        fallbackToPublic = true;
      }
    } catch (localErr) {
      console.warn("[Matrix] Local ORS connection error. Falling back to public API.");
      fallbackToPublic = true;
    }

    if (fallbackToPublic) {
      try {
        response = await callOrsMatrix(locations, true);
      } catch (publicErr) {
        console.error("[Matrix] Public ORS also failed:", publicErr);
        return NextResponse.json(
          { error: "Both local and public ORS unavailable", detail: (publicErr as Error).message },
          { status: 502 }
        );
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : "No response from ORS";
      console.error("[Matrix] Final ORS error:", errorText);
      return NextResponse.json(
        { 
          error: "ORS matrix request failed", 
          status: response?.status,
          body: errorText 
        },
        { status: response?.status || 502 }
      );
    }

    const data = await response.json();
    const n = coordinates.length;

    const cost: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0;
        const distance = Number(data.distances[i][j]);
        const duration = Number(data.durations[i][j]);
        if (!isFinite(distance) || !isFinite(duration) || distance < 0 || duration < 0)
          return ROUTING_CONFIG.UNREACHABLE_COST;
        return Math.round(
          distance * ROUTING_CONFIG.COST_PER_METER + duration * ROUTING_CONFIG.COST_PER_SECOND
        );
      })
    );

    return NextResponse.json({ cost });
  } catch (error) {
    console.error("Matrix API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
