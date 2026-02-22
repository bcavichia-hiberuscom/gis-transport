import { NextResponse } from "next/server";
import { IGisResponse } from "@gis/shared";

// ─── MOCK MODE ─ Remove when DB is available ───────────────────────────────
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
// ───────────────────────────────────────────────────────────────────────────

export async function GET() {
    if (USE_MOCKS) {
        return NextResponse.json({ success: true, data: [] } as IGisResponse);
    }
    try {
        const { repository } = await import("@/lib/db");
        const groups = await repository.getVehicleGroups();
        return NextResponse.json({ success: true, data: groups } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups GET] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: (error as Error).message },
            } as IGisResponse,
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    if (USE_MOCKS) {
        const { name, vehicleIds } = await req.json();
        return NextResponse.json({ success: true, data: { id: `grp-mock-${Date.now()}`, name, vehicleIds: vehicleIds || [] } } as IGisResponse);
    }
    try {
        const { name, vehicleIds } = await req.json();
        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "BAD_REQUEST", message: "Name is required" },
                } as IGisResponse,
                { status: 400 }
            );
        }
        const { repository } = await import("@/lib/db");
        const group = await repository.createVehicleGroup(name, vehicleIds || []);
        return NextResponse.json({ success: true, data: group } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups POST] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: (error as Error).message },
            } as IGisResponse,
            { status: 500 }
        );
    }
}
