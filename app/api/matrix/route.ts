// app/api/matrix/route.ts
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

    const orsUrl = "https://api.openrouteservice.org/v2/matrix/driving-car";

    const orsResponse = await fetch(orsUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locations,
        metrics: ["distance", "duration"],
        units: "m",
      }),
    });

    if (!orsResponse.ok) {
      const text = await orsResponse.text();
      console.error("ORS returned error:", orsResponse.status, text);
      return NextResponse.json(
        {
          error: "ORS matrix request failed",
          status: orsResponse.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const data = await orsResponse.json();

    if (!data.distances || !data.durations) {
      console.error("ORS returned unexpected payload:", JSON.stringify(data));
      return NextResponse.json(
        { error: "ORS returned unexpected payload" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      distances: data.distances,
      durations: data.durations,
    });
  } catch (error) {
    console.error("Matrix API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
