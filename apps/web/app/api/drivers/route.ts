import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/driver-service";
import { FetchError } from "@/lib/types";

export async function GET() {
  try {
    const drivers = await DriverService.getAllDrivers();
    return NextResponse.json({ success: true, data: drivers });
  } catch (err) {
    const error = err as FetchError;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Special action to clear all driver assignments
    if (body.action === "clear-assignments") {
      const data = await DriverService.clearAssignments();
      return NextResponse.json({
        success: true,
        message: "All driver assignments cleared",
        data,
      });
    }

    const driver = await DriverService.createDriver(body);
    return NextResponse.json({ success: true, data: driver });
  } catch (err) {
    const error = err as FetchError;
    // Handle validation errors from service
    if (error.message.includes("New drivers cannot be created") || error.message.includes("Invalid vehicle ID")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
