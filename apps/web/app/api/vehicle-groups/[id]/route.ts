import { NextResponse } from "next/server";
import { IGisResponse } from "@gis/shared";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (USE_MOCKS) {
        const data = await req.json();
        return NextResponse.json({ success: true, data: { id, ...data } } as IGisResponse);
    }
    try {
        const data = await req.json();
        const { repository } = await import("@/lib/db");
        const group = await repository.updateVehicleGroup(id, data);
        return NextResponse.json({ success: true, data: group } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups PUT] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } } as IGisResponse,
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (USE_MOCKS) {
        return NextResponse.json({ success: true, data: null } as IGisResponse);
    }
    try {
        const { repository } = await import("@/lib/db");
        await repository.deleteVehicleGroup(id);
        return NextResponse.json({ success: true, data: null } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups DELETE] Error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } } as IGisResponse,
            { status: 500 }
        );
    }
}
