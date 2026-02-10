import { type NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-utils";
import { FetchError } from "@/lib/types";
import { TIMEOUTS, ROUTING_CONFIG } from "@/lib/config";

const ORS_LOCAL = process.env.ORS_LOCAL_URL || "http://127.0.0.1:8080/ors/v2";
const ORS_PUBLIC = "https://api.openrouteservice.org/v2";
const ORS_API_KEY = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY || "";

async function callOrsMatrix(locations: number[][], usePublic: boolean) {
  const baseUrl = usePublic ? ORS_PUBLIC : ORS_LOCAL;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (usePublic && ORS_API_KEY) headers["Authorization"] = ORS_API_KEY;

  return fetchWithTimeout(`${baseUrl}/matrix/driving-car`, {
    method: "POST",
    headers,
    body: JSON.stringify({ locations, metrics: ["distance", "duration"], units: "m" }),
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

    try {
      response = await callOrsMatrix(locations, false);
      if (!response.ok) throw new Error(`Local ORS failed: ${response.status}`);
    } catch (localErr) {
      console.warn("[Matrix] Local ORS unavailable, falling back to public API");
      try {
        response = await callOrsMatrix(locations, true);
      } catch (publicErr) {
        return NextResponse.json(
          { error: "Both local and public ORS unavailable" },
          { status: 502 }
        );
      }
    }

    if (!response || !response.ok) {
      const text = response ? await response.text() : "No response";
      return NextResponse.json(
        { error: "ORS matrix request failed", body: text },
        { status: 502 }
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
