import { NextResponse } from "next/server";
import { repository } from "@/lib/db";
import { IGisResponse } from "@gis/shared";

export async function GET() {
    try {
        const groups = await repository.getVehicleGroups();
        return NextResponse.json({
            success: true,
            data: groups,
        } as IGisResponse);
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

        const group = await repository.createVehicleGroup(name, vehicleIds || []);
        return NextResponse.json({
            success: true,
            data: group,
        } as IGisResponse);
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
