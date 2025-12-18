// app/api/routing/route.ts
import { type NextRequest, NextResponse } from "next/server";

const REQUEST_TIMEOUT = 15000;
// Aumentado a 5km para zonas rurales

/**
 * Intenta hacer snap de coordenadas a carreteras antes de routing
 */
async function snapCoordinates(
  coordinates: [number, number][],
  apiKey: string
): Promise<[number, number][]> {
  try {
    console.log(`🔍 Intentando snap de ${coordinates.length} coordenadas...`);

    // Convertir [lat, lon] a [lon, lat] para ORS
    const locations = coordinates.map(([lat, lon]) => [lon, lat]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      "https://api.openrouteservice.org/v2/snap/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("⚠️ Snap failed in routing:", response.status, errorText);
      return coordinates;
    }

    const data = await response.json();

    console.log(`📦 Snap response:`, JSON.stringify(data, null, 2));

    if (!data.locations || !Array.isArray(data.locations)) {
      console.warn("⚠️ Invalid snap response structure");
      return coordinates;
    }

    // Procesar respuesta con cuidado
    const snapped = data.locations.map((loc: any, idx: number) => {
      console.log(`  - Location ${idx}:`, JSON.stringify(loc, null, 2));

      if (
        loc &&
        loc.location &&
        Array.isArray(loc.location) &&
        loc.location.length === 2
      ) {
        const [lon, lat] = loc.location;
        if (isFinite(lon) && isFinite(lat)) {
          const original = coordinates[idx];
          const distance = loc.distance || 0;
          if (distance > 100) {
            console.log(
              `📍 Waypoint ${idx}: ajustado ${Math.round(
                distance
              )}m (${original[0].toFixed(4)},${original[1].toFixed(
                4
              )} → ${lat.toFixed(4)},${lon.toFixed(4)})`
            );
          }
          return [lat, lon] as [number, number];
        }
      }
      console.warn(
        `❌ No se pudo hacer snap del waypoint ${idx}: [${coordinates[idx][0]}, ${coordinates[idx][1]}]`
      );
      return coordinates[idx];
    });

    const snappedCount = snapped.filter(
      (s: [number, number], i: number) =>
        Math.abs(s[0] - coordinates[i][0]) > 0.00001 ||
        Math.abs(s[1] - coordinates[i][1]) > 0.00001
    ).length;

    return snapped;
  } catch (error) {
    console.error("❌ Snap in routing failed:", error);
    return coordinates;
  }
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

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouteService API key not configured" },
        { status: 500 }
      );
    }

    // Intentar snap ANTES de routing
    let finalCoordinates = coordinates;
    try {
      finalCoordinates = await snapCoordinates(coordinates, apiKey);
    } catch (snapError) {
      console.warn("Pre-routing snap failed, proceeding with original coords");
    }

    // Convertir [lat, lon] a [lon, lat] para ORS
    const locations = finalCoordinates.map(([lat, lon]: number[]) => [
      lon,
      lat,
    ]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
            Accept:
              "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          },
          body: JSON.stringify({
            coordinates: locations,
            instructions: false,
            preference: "recommended",
            radiuses: locations.map(() => 5000), // permitir buscar en 5km por cada punto
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ORS routing error:", response.status, errorText);

        // Si falla routing incluso después del snap, devolver línea recta
        return NextResponse.json(
          {
            error: "Routing failed",
            details: errorText,
            fallback: true,
            coordinates: finalCoordinates, // devolver las coords que intentamos usar
            distance: 0,
            duration: 0,
          },
          { status: 502 }
        );
      }

      const data = await response.json();

      if (
        !data.features ||
        !data.features[0] ||
        !data.features[0].geometry ||
        !data.features[0].geometry.coordinates
      ) {
        return NextResponse.json(
          { error: "Invalid response from ORS" },
          { status: 502 }
        );
      }

      const routeCoordinates = data.features[0].geometry.coordinates.map(
        ([lon, lat]: number[]) => [lat, lon]
      );

      const properties = data.features[0].properties;
      const distance = properties?.summary?.distance || 0;
      const duration = properties?.summary?.duration || 0;

      return NextResponse.json({
        coordinates: routeCoordinates,
        distance: Math.round(distance),
        duration: Math.round(duration),
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Routing request timeout" },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Routing API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
