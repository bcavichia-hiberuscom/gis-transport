import { type NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-utils";
import { FetchError, SnappedPoint } from "@/lib/types";
import { TIMEOUTS } from "@/lib/config";

const ORS_LOCAL = process.env.ORS_LOCAL_URL || "http://127.0.0.1:8080/ors/v2";
const ORS_PUBLIC = "https://api.openrouteservice.org/v2";
const ORS_API_KEY = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY || "";

async function callOrsDirections(coordinates: [number, number][], usePublic: boolean) {
  const baseUrl = usePublic ? ORS_PUBLIC : ORS_LOCAL;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (usePublic && ORS_API_KEY) headers["Authorization"] = ORS_API_KEY;

  return fetchWithTimeout(`${baseUrl}/directions/driving-car/geojson`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      coordinates,
      instructions: false,
      preference: "recommended",
      radiuses: coordinates.map(() => 5000),
    }),
    timeout: TIMEOUTS.ROUTING,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 coordinates for routing" },
        { status: 400 }
      );
    }

    // Try local ORS first, fallback to public
    let response: Response | null = null;
    let usedPublic = false;

    try {
      response = await callOrsDirections(coordinates, false);
      if (!response.ok) throw new Error(`Local ORS failed: ${response.status}`);
    } catch (localErr) {
      console.warn("[Routing] Local ORS unavailable, falling back to public API");
      usedPublic = true;
      try {
        response = await callOrsDirections(coordinates, true);
      } catch (publicErr) {
        return NextResponse.json(
          { error: "Both local and public ORS unavailable", details: String(publicErr) },
          { status: 502 }
        );
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : "No response";
      return NextResponse.json(
        { error: "Routing failed", details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const routeCoordinates = data.features[0].geometry.coordinates;
    const properties = data.features[0].properties;

    return NextResponse.json({
      coordinates: routeCoordinates,
      distance: Math.round(properties?.summary?.distance || 0),
      duration: Math.round(properties?.summary?.duration || 0),
      source: usedPublic ? "public" : "local",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
