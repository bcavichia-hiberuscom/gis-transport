import { NextResponse } from "next/server";
import { repository } from "@/lib/db";
import { IGisResponse } from "@gis/shared";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await req.json();

        const group = await repository.updateVehicleGroup(id, data);
        return NextResponse.json({
            success: true,
            data: group,
        } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups PUT] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: (error as Error).message },
            } as IGisResponse,
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await repository.deleteVehicleGroup(id);
        return NextResponse.json({
            success: true,
            data: null,
        } as IGisResponse);
    } catch (error) {
        console.error("[VehicleGroups DELETE] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: (error as Error).message },
            } as IGisResponse,
            { status: 500 }
        );
    }
}
