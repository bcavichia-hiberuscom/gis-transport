import { VehicleService } from "./vehicle-service";
import { DriverService } from "./driver-service";
import { fuelService } from "./fuel-service";
import type { Driver, FleetVehicle, FleetFuelOverview } from "@gis/shared";

export interface DashboardAnalytics {
    fleetSafetyScore: number;
    slaComplianceRate: number;
    totalCO2Emissions: number; // in kg
    operationalEfficiency: number; // Cost per km
    activeDrivers: number;
    totalVehicles: number;
    criticalAlerts: number;
}

class DashboardAnalyticsService {
    async getDashboardOverview(): Promise<DashboardAnalytics> {
        const [vehicles, drivers] = await Promise.all([
            VehicleService.fetchVehicles(),
            DriverService.getAllDrivers(),
        ]);

        // Aggregate data with proper typing
        const activeDrivers = drivers.filter((d: Driver) => !d.isAvailable).length;
        const totalVehicles = vehicles.length;

        // Safety score based on speeding events
        const totalEvents = drivers.reduce((acc: number, d: Driver) => acc + (d.speedingEvents?.length || 0), 0);
        const fleetSafetyScore = Math.max(0, 100 - (totalEvents * 2));

        // SLA Compliance (mock for demo)
        const slaComplianceRate = 94.2;

        // CO2 Emissions (mock)
        const totalDistance = vehicles.reduce((acc: number, v: FleetVehicle) => acc + ((v as any).mileage || 0), 0);
        const totalCO2Emissions = Math.round(totalDistance * 0.15 * 2.3);

        // Efficiency: Mock cost per km
        const operationalEfficiency = 1.45;

        return {
            fleetSafetyScore,
            slaComplianceRate,
            totalCO2Emissions,
            operationalEfficiency,
            activeDrivers,
            totalVehicles,
            criticalAlerts: totalEvents,
        };
    }

    async getFuelDynamics(): Promise<FleetFuelOverview> {
        const endDate = Date.now();
        const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
        return await fuelService.getFleetFuelOverview(startDate, endDate);
    }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();
