import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driverId, speed, limit, latitude, longitude } = body;

    if (!driverId || speed == null || limit == null || latitude == null || longitude == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: driverId, speed, limit, latitude, longitude" },
        { status: 400 },
      );
    }

    await repository.logSpeeding(driverId, {
      speed: Number(speed),
      limit: Number(limit),
      latitude: Number(latitude),
      longitude: Number(longitude),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    console.error("Log speeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
