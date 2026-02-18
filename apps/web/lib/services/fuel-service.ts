import {
    FuelTransaction,
    DriverFuelSummary,
    FleetFuelOverview,
    VehicleFuelConfig,
    FuelTransactionStatus,
    FuelDiscrepancyType,
} from "@gis/shared";

/**
 * Abstract service for fuel management operations.
 * Implementations can connect to different data sources (API, database, mock, etc.)
 * by simply changing the endpoint configuration.
 */
export class FuelService {
    private baseUrl: string;

    constructor(baseUrl: string = "/api/fuel") {
        this.baseUrl = baseUrl;
    }

    /**
     * Fetch fuel transactions for a specific driver
     */
    async getDriverTransactions(
        driverId: string,
        options?: {
            startDate?: number;
            endDate?: number;
            status?: FuelTransactionStatus;
            limit?: number;
        }
    ): Promise<FuelTransaction[]> {
        const params = new URLSearchParams();
        if (options?.startDate) params.set("startDate", options.startDate.toString());
        if (options?.endDate) params.set("endDate", options.endDate.toString());
        if (options?.status) params.set("status", options.status);
        if (options?.limit) params.set("limit", options.limit.toString());

        const response = await fetch(
            `${this.baseUrl}/drivers/${driverId}/transactions?${params}`
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch driver transactions: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data || [];
    }

    /**
     * Fetch fuel summary for a specific driver
     */
    async getDriverFuelSummary(
        driverId: string,
        startDate: number,
        endDate: number
    ): Promise<DriverFuelSummary> {
        const params = new URLSearchParams({
            startDate: startDate.toString(),
            endDate: endDate.toString(),
        });

        const response = await fetch(
            `${this.baseUrl}/drivers/${driverId}/summary?${params}`
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch driver fuel summary: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }

    /**
     * Fetch fleet-wide fuel overview
     */
    async getFleetFuelOverview(
        startDate: number,
        endDate: number
    ): Promise<FleetFuelOverview> {
        const params = new URLSearchParams({
            startDate: startDate.toString(),
            endDate: endDate.toString(),
        });

        const response = await fetch(`${this.baseUrl}/fleet/overview?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch fleet fuel overview: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }

    /**
     * Create a new fuel transaction
     */
    async createTransaction(
        transaction: Omit<FuelTransaction, "id" | "createdAt" | "updatedAt" | "validation">
    ): Promise<FuelTransaction> {
        const response = await fetch(`${this.baseUrl}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
        });

        if (!response.ok) {
            throw new Error(`Failed to create fuel transaction: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }

    /**
     * Update transaction status (for manual review/approval)
     */
    async updateTransactionStatus(
        transactionId: string,
        status: FuelTransactionStatus,
        reviewNotes?: string
    ): Promise<FuelTransaction> {
        const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reviewNotes }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update transaction status: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }

    /**
     * Get vehicle fuel configuration
     */
    async getVehicleFuelConfig(
        vehicleId: string | number
    ): Promise<VehicleFuelConfig> {
        const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}/config`);
        if (!response.ok) {
            throw new Error(`Failed to fetch vehicle fuel config: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }

    /**
     * Get transactions flagged for review
     */
    async getFlaggedTransactions(
        options?: {
            flagType?: FuelDiscrepancyType;
            limit?: number;
        }
    ): Promise<FuelTransaction[]> {
        const params = new URLSearchParams();
        if (options?.flagType) params.set("flagType", options.flagType);
        if (options?.limit) params.set("limit", options.limit.toString());

        const response = await fetch(`${this.baseUrl}/transactions/flagged?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch flagged transactions: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data || [];
    }

    /**
     * Upload receipt image for a transaction
     */
    async uploadReceipt(
        transactionId: string,
        file: File
    ): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append("receipt", file);

        const response = await fetch(
            `${this.baseUrl}/transactions/${transactionId}/receipt`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload receipt: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    }
}

// Singleton instance
export const fuelService = new FuelService();
