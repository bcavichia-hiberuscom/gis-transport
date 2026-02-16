import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/driver-service";
import { FetchError } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const driver = await DriverService.getDriverById(id);

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (err) {
    const error = err as FetchError;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const driver = await DriverService.updateDriver(id, body);
    return NextResponse.json({ success: true, data: driver });
  } catch (err) {
    const error = err as FetchError;
    // Handle validation errors from service
    if (error.message.includes("Invalid vehicle ID") || error.message.includes("Cannot mark driver as unavailable")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
