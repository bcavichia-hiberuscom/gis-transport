import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startLat = searchParams.get("startLat");
  const startLon = searchParams.get("startLon");
  const endLat = searchParams.get("endLat");
  const endLon = searchParams.get("endLon");

  if (!startLat || !startLon || !endLat || !endLon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouteService API key not set" },
      { status: 500 }
    );
  }

  try {
    const orsUrl =
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
    const body = {
      coordinates: [
        [parseFloat(startLon), parseFloat(startLat)],
        [parseFloat(endLon), parseFloat(endLat)],
      ],
      instructions: true,
    };

    const response = await fetch(orsUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ORS returned non-OK response:", text);
      return NextResponse.json(
        { error: "Routing service returned an invalid response" },
        { status: 502 }
      );
    }

    const data = await response.json();

    const route = data.features[0];
    if (!route) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const coordinates = route.geometry.coordinates.map((c: number[]) => [
      c[1],
      c[0],
    ]);
    const instructions = (route.properties.segments?.[0].steps || []).map(
      (step: any) => ({
        text: step.instruction,
        distance: step.distance,
        duration: step.duration,
        type: step.type,
        modifier: step.modifier,
      })
    );

    return NextResponse.json({
      coordinates,
      distance: route.properties.summary.distance,
      duration: route.properties.summary.duration,
      instructions,
      waypoints: [
        { location: [parseFloat(startLat), parseFloat(startLon)] },
        { location: [parseFloat(endLat), parseFloat(endLon)] },
      ],
    });
  } catch (error) {
    console.error("ORS routing error:", error);
    return NextResponse.json(
      { error: "Routing service unavailable" },
      { status: 500 }
    );
  }
}
