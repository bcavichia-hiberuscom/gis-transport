/**
 * ============================================================
 *  MOCK DATA — NO-DB MODE
 * ============================================================
 *  Activated when NEXT_PUBLIC_USE_MOCKS=true in .env
 *  To remove: delete this file + lib/mock/ folder, then
 *  remove NEXT_PUBLIC_USE_MOCKS from .env
 * ============================================================
 */

import type { Driver, FleetVehicle } from "@gis/shared";
import type { FleetFuelOverview } from "@gis/shared";

// ─── Drivers ────────────────────────────────────────────────────────────────

export const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv-001",
    name: "Alejandro García",
    licenseType: "C+E",
    licenseNumber: "B-2456789",
    phoneNumber: "+34 612 345 678",
    onTimeDeliveryRate: 97,
    isAvailable: false,
    currentVehicleId: "vh-001",
    hireDate: Date.now() - 3 * 365 * 24 * 60 * 60 * 1000,
    licenseExpiryDate: Date.now() + 2 * 365 * 24 * 60 * 60 * 1000,
    medicalCertStatus: "approved",
    medicalCertExpiryDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
    speedingEvents: [],
  },
  {
    id: "drv-002",
    name: "María López",
    licenseType: "C",
    licenseNumber: "M-1234567",
    phoneNumber: "+34 623 456 789",
    onTimeDeliveryRate: 94,
    isAvailable: false,
    currentVehicleId: "vh-002",
    hireDate: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000,
    licenseExpiryDate: Date.now() + 1.5 * 365 * 24 * 60 * 60 * 1000,
    medicalCertStatus: "approved",
    medicalCertExpiryDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
    speedingEvents: [
      {
        id: "spd-001",
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        speed: 92,
        limit: 80,
        latitude: 40.418,
        longitude: -3.702,
        driverId: "drv-002",
      },
    ],
  },
  {
    id: "drv-003",
    name: "Carlos Martínez",
    licenseType: "C+E",
    licenseNumber: "S-9876543",
    phoneNumber: "+34 634 567 890",
    onTimeDeliveryRate: 88,
    isAvailable: true,
    currentVehicleId: undefined,
    hireDate: Date.now() - 5 * 365 * 24 * 60 * 60 * 1000,
    licenseExpiryDate: Date.now() + 6 * 30 * 24 * 60 * 60 * 1000,
    medicalCertStatus: "pending",
    medicalCertExpiryDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
    speedingEvents: [
      {
        id: "spd-002",
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        speed: 105,
        limit: 90,
        latitude: 40.42,
        longitude: -3.695,
        driverId: "drv-003",
      },
      {
        id: "spd-003",
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        speed: 98,
        limit: 80,
        latitude: 40.415,
        longitude: -3.71,
        driverId: "drv-003",
      },
    ],
  },
  {
    id: "drv-004",
    name: "Ana Fernández",
    licenseType: "B",
    licenseNumber: "V-5432198",
    phoneNumber: "+34 645 678 901",
    onTimeDeliveryRate: 99,
    isAvailable: true,
    currentVehicleId: undefined,
    hireDate: Date.now() - 1 * 365 * 24 * 60 * 60 * 1000,
    licenseExpiryDate: Date.now() + 4 * 365 * 24 * 60 * 60 * 1000,
    medicalCertStatus: "approved",
    medicalCertExpiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    speedingEvents: [],
  },
  {
    id: "drv-005",
    name: "Pedro Sánchez",
    licenseType: "C",
    licenseNumber: "Z-3219876",
    phoneNumber: "+34 656 789 012",
    onTimeDeliveryRate: 91,
    isAvailable: false,
    currentVehicleId: "vh-004",
    hireDate: Date.now() - 4 * 365 * 24 * 60 * 60 * 1000,
    licenseExpiryDate: Date.now() + 3 * 365 * 24 * 60 * 60 * 1000,
    medicalCertStatus: "approved",
    medicalCertExpiryDate: Date.now() + 200 * 24 * 60 * 60 * 1000,
    speedingEvents: [],
  },
];


// ─── Vehicles (rich version with metrics) ────────────────────────────────────

export const MOCK_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: "vh-001",
    type: { id: "zero", label: "Zero Emission Vehicle", tags: ["0", "eco", "zero"], vroomType: "car" },
    label: "Van-001",
    position: [40.4168, -3.7038],
    licensePlate: "MAD-1001",
    brand: "Mercedes",
    model: "EQV",
    year: 2023,
    mileage: 45200,
    fuelConsumption: 8.5,
    status: "active",
    lastMaintenanceDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    driver: MOCK_DRIVERS[0],
    metrics: {
      batteryLevel: 74,
      distanceTotal: 45200,
      speed: 52,
      health: 92,
      status: "active",
      movementState: "on_route",
      updatedAt: Date.now(),
    },
  },
  {
    id: "vh-002",
    type: { id: "eco", label: "ECO Vehicle", tags: ["eco", "zero", "0"], vroomType: "car" },
    label: "Van-002",
    position: [40.422, -3.699],
    licensePlate: "MAD-1002",
    brand: "Volkswagen",
    model: "eTransporter",
    year: 2022,
    mileage: 62100,
    fuelConsumption: 7.2,
    status: "active",
    lastMaintenanceDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
    driver: MOCK_DRIVERS[1],
    metrics: {
      batteryLevel: 45,
      distanceTotal: 62100,
      speed: 0,
      health: 78,
      status: "active",
      movementState: "stopped",
      updatedAt: Date.now(),
    },
  },
  {
    id: "vh-003",
    type: { id: "b", label: "Label B", tags: ["b", "eco", "zero", "0"], vroomType: "car" },
    label: "Truck-003",
    position: [40.415, -3.708],
    licensePlate: "MAD-1003",
    brand: "Volvo",
    model: "FM",
    year: 2021,
    mileage: 125400,
    fuelConsumption: 22.5,
    status: "maintenance",
    lastMaintenanceDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
    metrics: {
      fuelLevel: 30,
      distanceTotal: 125400,
      speed: 0,
      health: 55,
      status: "maintenance",
      movementState: "stopped",
      updatedAt: Date.now(),
    },
  },
  {
    id: "vh-004",
    type: { id: "c", label: "Label C", tags: ["c", "b", "eco", "zero", "0"], vroomType: "car" },
    label: "Truck-004",
    position: [40.425, -3.695],
    licensePlate: "MAD-1004",
    brand: "Scania",
    model: "R",
    year: 2023,
    mileage: 18900,
    fuelConsumption: 24.0,
    status: "active",
    lastMaintenanceDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 80 * 24 * 60 * 60 * 1000,
    driver: MOCK_DRIVERS[4],
    metrics: {
      fuelLevel: 88,
      distanceTotal: 18900,
      speed: 75,
      health: 97,
      status: "active",
      movementState: "on_route",
      updatedAt: Date.now(),
    },
  },
  {
    id: "vh-005",
    type: { id: "noLabel", label: "Sin etiqueta ambiental", tags: [], vroomType: "car" },
    label: "Van-005",
    position: [40.41, -3.712],
    licensePlate: "MAD-1005",
    brand: "Ford",
    model: "Transit",
    year: 2020,
    mileage: 98700,
    fuelConsumption: 10.8,
    status: "active",
    lastMaintenanceDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    metrics: {
      fuelLevel: 62,
      distanceTotal: 98700,
      speed: 5,
      health: 71,
      status: "idle",
      movementState: "moving",
      updatedAt: Date.now(),
    },
  },
];


// ─── Fleet Fuel Overview ─────────────────────────────────────────────────────

export function getMockFleetFuelOverview(startDate: number, endDate: number): FleetFuelOverview {
  return {
    period: { start: startDate, end: endDate },
    totals: {
      declaredLiters: 12450,
      expectedLiters: 11890,
      discrepancyLiters: 560,
      discrepancyPercentage: 4.7,
      totalCost: 18675.5,
      transactionCount: 156,
      estimatedLossEuro: 840,
    },
    statusBreakdown: {
      compliant: 142,
      review: 11,
      flagged: 3,
    },
    topDiscrepancies: MOCK_DRIVERS.slice(0, 5).map((d, i) => ({
      driverId: d.id,
      driverName: d.name,
      discrepancyLiters: [85, 62, 48, 35, 28][i],
      discrepancyPercentage: [12.3, 9.8, 7.2, 5.8, 4.9][i],
      flagCount: [2, 1, 1, 1, 0][i],
    })),
    trendData: Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(endDate - (11 - i) * 7 * 24 * 60 * 60 * 1000);
      const base = 2000 + Math.sin(i * 0.8) * 300;
      const disc = i % 4 === 0 ? 150 + i * 8 : 20 + i * 3;
      return {
        date: date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        declared: Math.round(base + disc),
        expected: Math.round(base),
        discrepancy: Math.round(disc),
      };
    }),
    criticalStations: [
      { brand: "Repsol", locationCount: 12, totalDiscrepancyLiters: 185, avgDiscrepancyPercentage: 8.2 },
      { brand: "BP", locationCount: 8, totalDiscrepancyLiters: 92, avgDiscrepancyPercentage: 5.4 },
      { brand: "Cepsa", locationCount: 15, totalDiscrepancyLiters: 45, avgDiscrepancyPercentage: 1.8 },
    ],
    riskFactors: [
      { factor: "Declaraciones sobre capacidad", occurrences: 8, impactLevel: "high" },
      { factor: "Repostajes rápidos", occurrences: 14, impactLevel: "medium" },
      { factor: "Desvío de ruta", occurrences: 5, impactLevel: "low" },
    ],
  };
}
