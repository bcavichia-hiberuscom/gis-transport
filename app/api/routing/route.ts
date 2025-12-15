// app/api/routing/route.ts
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 coordinates" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouteService API key not set" },
        { status: 500 }
      );
    }

    // Convertir de [lat, lon] a [lon, lat] para ORS
    const locations = coordinates.map((coord: number[]) => {
      if (!Array.isArray(coord) || coord.length < 2) {
        throw new Error("Invalid coordinate format, expected [lat, lon]");
      }
      return [coord[1], coord[0]];
    });

    const orsUrl =
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

    const orsResponse = await fetch(orsUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: locations,
        elevation: false,
        instructions: false,
      }),
    });

    if (!orsResponse.ok) {
      const text = await orsResponse.text();
      console.error("ORS routing error:", orsResponse.status, text);
      return NextResponse.json(
        {
          error: "ORS routing request failed",
          status: orsResponse.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const data = await orsResponse.json();

    if (!data.features || !data.features[0] || !data.features[0].geometry) {
      console.error(
        "ORS returned unexpected routing payload:",
        JSON.stringify(data)
      );
      return NextResponse.json(
        { error: "ORS returned unexpected routing payload" },
        { status: 502 }
      );
    }

    const feature = data.features[0];
    const geometry = feature.geometry.coordinates; // [lon, lat][]
    const properties = feature.properties;

    // Convertir de [lon, lat] a [lat, lon] para Leaflet
    const routeCoordinates = geometry.map((coord: number[]) => [
      coord[1],
      coord[0],
    ]);

    return NextResponse.json({
      coordinates: routeCoordinates,
      distance:
        properties.segments?.[0]?.distance || properties.summary?.distance || 0,
      duration:
        properties.segments?.[0]?.duration || properties.summary?.duration || 0,
    });
  } catch (error) {
    console.error("Routing API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
