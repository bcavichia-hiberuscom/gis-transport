// app/api/snap-to-road/route.ts
import { type NextRequest, NextResponse } from "next/server";

/**
 * Snaps coordinates to the nearest road using OpenRouteService.
 * Returns corrected coordinates that are safe for routing.
 */

const SNAP_RADIUS = 5000; // buscar carretera en 5km para zonas rurales
const REQUEST_TIMEOUT = 15000; // 15 segundos

export async function POST(request: NextRequest) {
  try {
    const { coordinates } = await request.json();

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      // Sin API key, devolver coordenadas originales
      return NextResponse.json({
        snapped: coordinates.map(([lat, lon]: number[]) => ({
          location: [lat, lon],
          snapped: false,
        })),
      });
    }

    // ORS espera [lon, lat]
    const locations = coordinates.map(([lat, lon]: number[]) => [lon, lat]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
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
            radius: SNAP_RADIUS,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("ORS snap failed:", response.status);
        // Devolver coordenadas originales
        return NextResponse.json({
          snapped: coordinates.map(([lat, lon]: number[]) => ({
            location: [lat, lon],
            snapped: false,
          })),
        });
      }

      const data = await response.json();

      // Procesar respuesta con cuidado
      const snapped = data.locations.map((loc: any, idx: number) => {
        // Verificar que existe y tiene location válido
        if (
          loc &&
          loc.location &&
          Array.isArray(loc.location) &&
          loc.location.length === 2
        ) {
          const [lon, lat] = loc.location;
          if (isFinite(lon) && isFinite(lat)) {
            const distance = loc.distance || 0;
            if (distance > 500) {
              console.log(
                `📍 Ubicación ${idx}: ajustada ${Math.round(
                  distance
                )}m a carretera más cercana`
              );
            }
            return {
              location: [lat, lon], // convertir a [lat, lon]
              snapped: true,
            };
          }
        }

        // Fallback: usar coordenadas originales
        console.warn(
          `⚠️ No se encontró carretera para ubicación ${idx}: [${coordinates[idx][0]}, ${coordinates[idx][1]}]`
        );
        return {
          location: coordinates[idx],
          snapped: false,
        };
      });

      const snappedCount = snapped.filter((s: any) => s.snapped).length;
      console.log(
        `✅ Snap: ${snappedCount}/${coordinates.length} ubicaciones ajustadas`
      );

      return NextResponse.json({ snapped });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("Snap-to-road fetch error:", fetchError.message);

      // Fallback: devolver coordenadas originales
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
