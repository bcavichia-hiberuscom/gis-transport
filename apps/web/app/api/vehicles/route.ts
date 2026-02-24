import { NextResponse } from "next/server";
import { FleetVehicle } from "@gis/shared";

// These match the MOCK_VEHICLES in vehicle-service.ts to provide consistency
const MOCK_VEHICLES: FleetVehicle[] = [
    {
        id: "vh-001",
        type: { id: "zero", label: "Zero Emission Vehicle", tags: ["0", "eco", "zero"], vroomType: "car" as const },
        label: "Van-001",
        position: [40.4168, -3.7038],
        licensePlate: "MAD-1001",
        brand: "Mercedes",
        model: "EQV",
        year: 2023,
        mileage: 45200,
        fuelConsumption: 8.5,
        status: "active" as const,
        lastMaintenanceDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        nextMaintenanceDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
    {
        id: "vh-002",
        type: { id: "eco", label: "ECO Vehicle", tags: ["eco", "zero", "0"], vroomType: "car" as const },
        label: "Van-002",
        position: [40.4200, -3.7000],
        licensePlate: "MAD-1002",
        brand: "Volkswagen",
        model: "eTransporter",
        year: 2022,
        mileage: 62100,
        fuelConsumption: 7.2,
        status: "active" as const,
        lastMaintenanceDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
        nextMaintenanceDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
    },
    {
        id: "vh-003",
        type: { id: "b", label: "Label B", tags: ["b", "eco", "zero", "0"], vroomType: "car" as const },
        label: "Truck-003",
        position: [40.4150, -3.7080],
        licensePlate: "MAD-1003",
        brand: "Volvo",
        model: "FM",
        year: 2021,
        mileage: 125400,
        fuelConsumption: 22.5,
        status: "maintenance" as const,
        lastMaintenanceDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
        nextMaintenanceDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
    }
];

export async function GET() {
    return NextResponse.json(MOCK_VEHICLES);
}

export async function POST(req: Request) {
    try {
        const vehicle = await req.json();
        return NextResponse.json({ ...vehicle, id: `vh-${Math.random().toString(36).substr(2, 9)}` });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
