import { FleetVehicle, VehicleRoute } from "@gis/shared";

export interface PredictiveKPIs {
  // Tiempo
  timeSavedHours: number;
  timeSavedMinutes: number;
  timePercentage: number;

  // Combustible
  fuelSavedLiters: number;
  fuelCostSaved: number;
  fuelPercentage: number;

  // Emisiones
  emissionsSavedKg: number;
  emissionsPercentage: number;

  // Distancia
  distanceSavedKm: number;
  distancePercentage: number;
}

export interface RouteAnalysis {
  vehicleId: string;
  vehicleLabel: string;
  originalDistance: number;
  optimizedDistance: number;
  originalTime: number;
  optimizedTime: number;
  kpis: PredictiveKPIs;
}

/**
 * Analytics Service para cálculo de KPIs predictivos
 * Calcula ahorros potenciales de tiempo, combustible y emisiones
 */
export class AnalyticsService {
  // Consumo de combustible promedio (L/100km) - Datos realistas UE
  // Basado en estándares EURO 6 y condiciones urbanas/carretera mixtas
  private static readonly FUEL_CONSUMPTION_MAP: Record<string, number> = {
    'van': 6.5,        // Furgoneta ligera (3.5-5T) - realista
    'van-large': 8.0,  // Furgoneta grande (5-7T) - realista
    'truck': 16.5,     // Camión pequeño (7-12T) - realista
    'truck-large': 20.0, // Camión grande (12T+) - realista
    'eco': 6.0,        // Vehículo económico - realista
  };

  // Precio del combustible por litro (€/L)
  private static readonly FUEL_PRICE_PER_LITER = 1.60;

  // Velocidad promedio (km/h)
  private static readonly AVERAGE_SPEED_KMH = 50;

  // Factor de emisiones (kg CO2 por litro de combustible)
  private static readonly CO2_EMISSIONS_PER_LITER = 2.31; // kg CO2/L

  /**
   * Calcula KPIs predictivos para una comparación original vs optimizada
   */
  static calculateRoutePredictiveKPIs(
    originalDistance: number,
    optimizedDistance: number,
    vehicle: FleetVehicle,
  ): PredictiveKPIs {
    const fuelConsumption = this.getFuelConsumption(vehicle);
    const distanceSaved = Math.max(0, originalDistance - optimizedDistance);

    // Cálculos
    const fuelSaved = (distanceSaved / 100) * fuelConsumption;
    const timeSavedHours = (distanceSaved / this.AVERAGE_SPEED_KMH);
    const emissionsSaved = fuelSaved * this.CO2_EMISSIONS_PER_LITER;
    const fuelCostSaved = fuelSaved * this.FUEL_PRICE_PER_LITER;

    // Porcentajes
    const distancePercentage = originalDistance > 0 
      ? Math.round((distanceSaved / originalDistance) * 100)
      : 0;
    
    const timePercentage = distancePercentage; // Proporcional a distancia
    const fuelPercentage = distancePercentage;
    const emissionsPercentage = distancePercentage;

    return {
      timeSavedHours: Math.floor(timeSavedHours),
      timeSavedMinutes: Math.round((timeSavedHours % 1) * 60),
      timePercentage,
      
      fuelSavedLiters: Number(fuelSaved.toFixed(2)),
      fuelCostSaved: Number(fuelCostSaved.toFixed(2)),
      fuelPercentage,
      
      emissionsSavedKg: Number(emissionsSaved.toFixed(2)),
      emissionsPercentage,
      
      distanceSavedKm: Number(distanceSaved.toFixed(1)),
      distancePercentage,
    };
  }

  /**
   * Obtiene el consumo de combustible para un vehículo
   */
  private static getFuelConsumption(vehicle: FleetVehicle): number {
    // Primero intenta usar consumo mockeado del vehículo
    if (vehicle.metrics?.consumptionAverage) {
      return vehicle.metrics.consumptionAverage;
    }

    // Luego intenta por tipo
    const type = typeof vehicle.type === 'string' 
      ? vehicle.type 
      : (vehicle.type as any)?.id || '';
    
    return this.FUEL_CONSUMPTION_MAP[type] || 7; // Default 7 L/100km (realista para vehículo promedio)
  }

  /**
   * Calcula análisis para múltiples rutas
   */
  static calculateMultipleRoutesAnalysis(
    routes: VehicleRoute[],
    fleetVehicles: FleetVehicle[],
  ): RouteAnalysis[] {
    return routes.map(route => {
      const vehicle = fleetVehicles.find(v => String(v.id) === String(route.vehicleId));
      if (!vehicle) return null;

      // Asumimos que la distancia de la ruta ya es optimizada
      // Para la comparación sin optimizar, asumimos 12% más distancia (factor realista)
      const optimizedDistance = route.distance || 0;
      const originalDistance = optimizedDistance * 1.12; // 12% más sin optimización

      const kpis = this.calculateRoutePredictiveKPIs(
        originalDistance,
        optimizedDistance,
        vehicle
      );

      return {
        vehicleId: String(vehicle.id),
        vehicleLabel: vehicle.label,
        originalDistance,
        optimizedDistance,
        originalTime: (originalDistance / this.AVERAGE_SPEED_KMH) * 60, // minutos
        optimizedTime: (optimizedDistance / this.AVERAGE_SPEED_KMH) * 60, // minutos
        kpis,
      };
    }).filter((r): r is RouteAnalysis => r !== null);
  }

  /**
   * Agrega KPIs de múltiples rutas
   */
  static aggregateKPIs(analyses: RouteAnalysis[]): PredictiveKPIs {
    if (analyses.length === 0) {
      return {
        timeSavedHours: 0,
        timeSavedMinutes: 0,
        timePercentage: 0,
        fuelSavedLiters: 0,
        fuelCostSaved: 0,
        fuelPercentage: 0,
        emissionsSavedKg: 0,
        emissionsPercentage: 0,
        distanceSavedKm: 0,
        distancePercentage: 0,
      };
    }

    const aggregate = analyses.reduce(
      (acc, analysis) => ({
        timeSavedHours: acc.timeSavedHours + analysis.kpis.timeSavedHours,
        timeSavedMinutes: acc.timeSavedMinutes + analysis.kpis.timeSavedMinutes,
        fuelSavedLiters: acc.fuelSavedLiters + analysis.kpis.fuelSavedLiters,
        fuelCostSaved: acc.fuelCostSaved + analysis.kpis.fuelCostSaved,
        emissionsSavedKg: acc.emissionsSavedKg + analysis.kpis.emissionsSavedKg,
        distanceSavedKm: acc.distanceSavedKm + analysis.kpis.distanceSavedKm,
      }),
      {
        timeSavedHours: 0,
        timeSavedMinutes: 0,
        fuelSavedLiters: 0,
        fuelCostSaved: 0,
        emissionsSavedKg: 0,
        distanceSavedKm: 0,
      }
    );

    // Ajustar minutos a horas si es necesario
    const totalMinutes = aggregate.timeSavedMinutes;
    const extraHours = Math.floor(totalMinutes / 60);

    return {
      timeSavedHours: aggregate.timeSavedHours + extraHours,
      timeSavedMinutes: totalMinutes % 60,
      timePercentage: analyses.length > 0 
        ? Math.round(analyses.reduce((sum, a) => sum + a.kpis.timePercentage, 0) / analyses.length)
        : 0,
      
      fuelSavedLiters: Number(aggregate.fuelSavedLiters.toFixed(2)),
      fuelCostSaved: Number(aggregate.fuelCostSaved.toFixed(2)),
      fuelPercentage: analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.kpis.fuelPercentage, 0) / analyses.length)
        : 0,
      
      emissionsSavedKg: Number(aggregate.emissionsSavedKg.toFixed(2)),
      emissionsPercentage: analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.kpis.emissionsPercentage, 0) / analyses.length)
        : 0,
      
      distanceSavedKm: Number(aggregate.distanceSavedKm.toFixed(1)),
      distancePercentage: analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.kpis.distancePercentage, 0) / analyses.length)
        : 0,
    };
  }

  /**
   * Calcula KPIs predictivos para asignación de conductor
   * Muestra el impacto de asignar un conductor específico
   */
  /**
   * Compara dos rutas y calcula ahorros reales (ruta comparada vs ruta baseline)
   * Por ejemplo: mostrar ahorros de shortest vs fastest
   */
  static compareRoutesKPIs(
    baselineDistanceKm: number,
    comparisonDistanceKm: number,
    baselineDurationSeconds: number,
    comparisonDurationSeconds: number,
    vehicle: FleetVehicle,
  ): PredictiveKPIs {
    // Calculamos diferencias reales
    const distanceSaved = Math.max(0, baselineDistanceKm - comparisonDistanceKm);
    const timeSavedSeconds = Math.max(0, baselineDurationSeconds - comparisonDurationSeconds);
    
    // Conversiones
    const fuelConsumption = this.getFuelConsumption(vehicle);
    const fuelSaved = (distanceSaved / 100) * fuelConsumption;
    const timeSavedHours = timeSavedSeconds / 3600;
    const emissionsSaved = fuelSaved * this.CO2_EMISSIONS_PER_LITER;
    const fuelCostSaved = fuelSaved * this.FUEL_PRICE_PER_LITER;

    // Porcentajes
    const distancePercentage = baselineDistanceKm > 0 
      ? Math.round((distanceSaved / baselineDistanceKm) * 100)
      : 0;
    
    const timePercentage = baselineDurationSeconds > 0 
      ? Math.round((timeSavedSeconds / baselineDurationSeconds) * 100)
      : 0;
    
    const fuelPercentage = distancePercentage;
    const emissionsPercentage = distancePercentage;

    return {
      timeSavedHours: Math.floor(timeSavedHours),
      timeSavedMinutes: Math.round((timeSavedHours % 1) * 60),
      timePercentage,
      
      fuelSavedLiters: Number(fuelSaved.toFixed(2)),
      fuelCostSaved: Number(fuelCostSaved.toFixed(2)),
      fuelPercentage,
      
      emissionsSavedKg: Number(emissionsSaved.toFixed(2)),
      emissionsPercentage,
      
      distanceSavedKm: Number(distanceSaved.toFixed(1)),
      distancePercentage,
    };
  }

  static calculateAssignmentPredictiveKPIs(
    vehicle: FleetVehicle,
    estimatedDistanceKm: number = 50, // distancia típica de un cliente
  ): PredictiveKPIs {
    // Asumimos que con buen conductor y ruta optimizada hay 12% de ahorro realista
    const optimizedDistance = estimatedDistanceKm;
    const originalDistance = estimatedDistanceKm * 1.12;

    return this.calculateRoutePredictiveKPIs(
      originalDistance,
      optimizedDistance,
      vehicle
    );
  }
}
