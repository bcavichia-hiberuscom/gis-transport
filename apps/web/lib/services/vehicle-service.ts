import { FleetVehicle } from "@gis/shared";

/**
 * VehicleService - Handles all vehicle-related operations
 * This service provides CRUD operations for fleet vehicles
 */

// Mock data for development/demo purposes
const MOCK_VEHICLES: FleetVehicle[] = [
  {
    id: "vh-001",
    type: { id: "zero", label: "Zero Emission Vehicle", tags: ["0", "eco"], vroomType: "car" as const },
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
  },
  {
    id: "vh-004",
    type: { id: "c", label: "Label C", tags: ["c", "b", "eco", "zero", "0"], vroomType: "car" as const },
    label: "Truck-004",
    position: [40.4250, -3.6950],
    licensePlate: "MAD-1004",
    brand: "Scania",
    model: "R",
    year: 2023,
    mileage: 18900,
    fuelConsumption: 24.0,
    status: "active" as const,
    lastMaintenanceDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 80 * 24 * 60 * 60 * 1000,
  },
  {
    id: "vh-005",
    type: { id: "noLabel", label: "No environmental label", tags: [], vroomType: "car" as const },
    label: "Van-005",
    position: [40.4100, -3.7120],
    licensePlate: "MAD-1005",
    brand: "Ford",
    model: "Transit",
    year: 2020,
    mileage: 98700,
    fuelConsumption: 10.8,
    status: "active" as const,
    lastMaintenanceDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
    nextMaintenanceDate: Date.now() + 20 * 24 * 60 * 60 * 1000,
  },
];

export class VehicleService {
  /**
   * Add a new vehicle to the fleet
   */
  static async addVehicle(vehicle: Partial<FleetVehicle>): Promise<FleetVehicle> {
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
      });

      if (!response.ok) {
        throw new Error(`Failed to add vehicle: ${response.statusText}`);
      }

      const data = await response.json();
      return data as FleetVehicle;
    } catch (error) {
      console.error("Error adding vehicle:", error);
      throw error;
    }
  }

  /**
   * Fetch all vehicles
   */
  static async fetchVehicles(): Promise<FleetVehicle[]> {
    try {
      const response = await fetch("/api/vehicles", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
      }

      const data = await response.json();
      return data as FleetVehicle[];
    } catch (error) {
      console.error("Error fetching vehicles, using mock data:", error);
      // Return mock data if API fails
      return MOCK_VEHICLES;
    }
  }

  /**
   * Get a specific vehicle by ID
   */
  static async getVehicleById(vehicleId: string | number): Promise<FleetVehicle | null> {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle: ${response.statusText}`);
      }

      const data = await response.json();
      return data as FleetVehicle;
    } catch (error) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Update a vehicle
   */
  static async updateVehicle(
    vehicleId: string | number,
    updates: Partial<FleetVehicle>
  ): Promise<FleetVehicle | null> {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update vehicle: ${response.statusText}`);
      }

      const data = await response.json();
      return data as FleetVehicle;
    } catch (error) {
      console.error(`Error updating vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Delete a vehicle
   */
  static async deleteVehicle(vehicleId: string | number): Promise<boolean> {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete vehicle: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting vehicle ${vehicleId}:`, error);
      return false;
    }
  }

  /**
   * Update vehicle maintenance information
   */
  static async updateMaintenance(
    vehicleId: string | number,
    maintenanceData: {
      lastMaintenanceDate?: number;
      nextMaintenanceDate?: number;
      maintenanceHours?: number;
    }
  ): Promise<FleetVehicle | null> {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maintenanceData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update vehicle maintenance: ${response.statusText}`);
      }

      const data = await response.json();
      return data as FleetVehicle;
    } catch (error) {
      console.error(`Error updating maintenance for vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Get vehicle utilization metrics
   */
  static async getVehicleUtilization(
    vehicleId: string | number,
    period: "7d" | "30d" | "90d" | "year" = "30d"
  ): Promise<any> {
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/utilization?period=${period}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle utilization: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching utilization for vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Get fleet-wide statistics
   */
  static async getFleetStatistics(): Promise<any> {
    try {
      const response = await fetch("/api/vehicles/statistics/fleet", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fleet statistics: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching fleet statistics:", error);
      return null;
    }
  }
}
