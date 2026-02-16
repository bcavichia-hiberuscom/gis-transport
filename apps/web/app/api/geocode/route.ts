import { type NextRequest, NextResponse } from "next/server";
import { GeocodingService } from "@/lib/services/geocoding-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json({ hits: [] });
  }

  try {
    const hits = await GeocodingService.search(query);
    return NextResponse.json({ hits });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json({ hits: [] });
  }
}
