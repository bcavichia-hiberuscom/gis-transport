import {
  FleetVehicle,
  FleetJob,
  RouteData,
  Zone,
  VehicleRoute,
  LatLon,
  VroomResult,
  VroomStep,
  OrsMatrixResponse,
  OrsDirectionsResponse,
  OptimizeOptions,
} from "@gis/shared";
import { THEME } from "@/lib/theme";
import { ORS_URL, ORS_PUBLIC_URL, ORS_API_KEY, VROOM_URL, SNAP_URL, ROUTING_CONFIG } from "@/lib/config";
import { WeatherService } from "./weather-service";
import {
  isPointInZone,
  isPointInPolygon,
  isZoneForbiddenForVehicle,
  getForbiddenZones,
  getZoneForbiddenReason,
} from "@/lib/helpers/zone-access-helper";
import { OverpassClient } from "@gis/shared";

const VROOM_PUBLIC = "https://solver.vroom-project.org";

const { route: ROUTE_COLORS } = THEME.colors;

/**
 * Fetch with fallback: tries local URL first, then public.
 */
async function fetchWithFallback(
  localUrl: string,
  publicUrl: string,
  options: RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  try {
    const res = await fetch(localUrl, { ...options, signal: AbortSignal.timeout(10000) });
    if (res.ok) return res;
    throw new Error(`Local returned ${res.status}`);
  } catch (err) {
    const isORS = publicUrl.includes("openrouteservice.org");
    console.warn(`[Fallback] Local ${localUrl} unavailable, using public. Error: ${(err as Error).message}`);

    if (isORS && !ORS_API_KEY) {
      console.error("[Fallback] ❌ CRITICAL: No se ha detectado ORS_API_KEY o NEXT_PUBLIC_ORS_API_KEY en las variables de entorno. Las peticiones al servicio público de ORS fallarán con 'Authorization field missing'. Por favor, añada su clave a su archivo .env");
    }

    // Si es ORS y tenemos key, la metemos también en el URL para máxima compatibilidad
    let finalPublicUrl = publicUrl;
    if (isORS && ORS_API_KEY) {
      console.log(`[Fallback] Usando ORS Público con clave (longitud: ${ORS_API_KEY.length})`);
      const separator = finalPublicUrl.includes("?") ? "&" : "?";
      finalPublicUrl += `${separator}api_key=${ORS_API_KEY}`;
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      ...extraHeaders,
    };

    if (isORS && ORS_API_KEY && !headers["Authorization"]) {
      headers["Authorization"] = ORS_API_KEY;
    }

    return fetch(finalPublicUrl, { ...options, headers });
  }
}

interface ProfileData {
  name: string;
  avoidPolygons: LatLon[][];
}

export class RoutingService {
  /**
   * Main orchestrator function: Snap -> Matrix -> VROOM -> Routing -> Weather
   */
  static async optimize(
    vehicles: FleetVehicle[],
    jobs: FleetJob[],
    options: OptimizeOptions = {},
  ): Promise<RouteData> {
    const startTime = options.startTime || new Date().toISOString();
    const zones = options.zones || [];

    if (options.preference === "health") {
      options.avoidPoorSmoothness = true;
    }

    console.log(
      `[Optimize] Iniciando optimización con ${vehicles.length} vehículos, ${jobs.length} jobs, ${zones.length} zonas`,
    );
    if (zones.length > 0) {
      console.log(
        "[Optimize] Zonas recibidas:",
        zones.map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type,
          requiredTags: z.requiredTags,
          hasCoordinates: !!z.coordinates && z.coordinates.length > 0,
        })),
      );
    }

    // 1. Snapping
    console.log(
      "[Optimize] Jobs:",
      jobs.map((j) => ({
        id: j.id,
        label: j.label,
        position: j.position,
        assignedVehicleId: j.assignedVehicleId,
      })),
    );

    // Verificar si los jobs están dentro de zonas LEZ
    console.log("[Optimize] Verificando si jobs están dentro de zonas...");
    jobs.forEach((job, idx) => {
      console.log(
        `[Optimize] Verificando Job "${job.label}" en posición [${job.position[0].toFixed(4)}, ${job.position[1].toFixed(4)}]`,
      );
      zones.forEach((zone) => {
        if (zone.coordinates && zone.coordinates.length > 0) {
          const isInside = this.isPointInZone(job.position, zone.coordinates);
          if (isInside) {
            console.log(
              `[Optimize] ⚠️⚠️⚠️ Job "${job.label}" está DENTRO de zona "${zone.name}" (${zone.type})`,
            );
          }
        }
      });
    });

    const allCoords = [
      ...vehicles.map((v) => v.position),
      ...jobs.map((j) => j.position),
    ];
    const snappedLocations = await this.snapCoordinates(allCoords);

    // 2. Profiles Mapping
    console.log("[Optimize] Mapeando perfiles de vehículos...");
    const vehicleProfiles = vehicles.map((v, idx) => {
      console.log(`[Profile] Procesando vehículo ${idx}:`, {
        id: v.id,
        label: v.label,
        typeLabel: v.type.label,
        tags: v.type.tags,
      });
      const forbidden = this.getForbiddenZonesForVehicle(v.type.tags, zones);
      console.log(
        `[Profile] Vehículo ${idx} (${v.type.label || v.label}) - Tags: [${v.type.tags.join(", ")}] - Zonas prohibidas: ${forbidden.length}`,
      );
      if (forbidden.length > 0) {
        console.log(
          `[Profile] Zonas prohibidas para vehículo ${idx}:`,
          forbidden.map((z) => ({
            id: z.id,
            name: z.name,
            type: z.type,
            requiredTags: z.requiredTags,
          })),
        );
      }
      return forbidden.map((z) => z.coordinates);
    });

    const uniqueProfiles = this.getUniqueProfiles(vehicleProfiles);
    const { matrices, poorSmoothnessPolygons } = await this.getMatricesForProfiles(
      snappedLocations,
      uniqueProfiles,
      allCoords,
      options
    );

    // Map each vehicle index to its profile name and avoid polygons
    const vehicleToProfile = vehicles.map((_, idx) => {
      const currentAvoidPolygons = vehicleProfiles[idx];
      const profile = uniqueProfiles.find(
        (p) =>
          JSON.stringify(p.avoidPolygons) ===
          JSON.stringify(currentAvoidPolygons),
      )!;
      return {
        name: profile.name,
        avoidPolygons: currentAvoidPolygons,
      };
    });

    // 3. VROOM Optimization
    let vroomResult: VroomResult;
    try {
      vroomResult = await this.runVroom(
        vehicles,
        jobs,
        matrices,
        vehicleToProfile,
      );
    } catch (vroomErr) {
      console.warn(
        "[Optimize] VROOM failed (local + public unavailable), using fallback assignment",
        vroomErr,
      );
      // Fallback: simple round-robin assignment without optimization
      vroomResult = this.createFallbackVroomResult(vehicles, jobs);
    }

    // 3.5. Validar rutas asignadas - detectar si VROOM asignó jobs prohibidos por falta de alternativas
    console.log("[Optimize] Validando asignaciones de VROOM...");
    const invalidAssignments: { vehicleIdx: number; jobLabels: string[] }[] =
      [];

    vroomResult.routes.forEach((route) => {
      const vIdx = route.vehicle;
      const profile = vehicleToProfile[vIdx];

      // Si este vehículo tiene zonas prohibidas
      if (profile.avoidPolygons.length > 0) {
        const assignedJobSteps = route.steps.filter((s) => s.type === "job");
        const forbiddenJobsAssigned: string[] = [];

        assignedJobSteps.forEach((step) => {
          const jobIdx = (step.id as number) - vehicles.length;
          const job = jobs[jobIdx];

          if (job) {
            // Verificar si este job está en zona prohibida para este vehículo
            const isInForbiddenZone = profile.avoidPolygons.some((poly) =>
              this.isPointInZone(job.position, poly),
            );

            if (isInForbiddenZone) {
              console.log(
                `[Optimize] ❌ ASIGNACIÓN INVÁLIDA: Vehículo ${vIdx} (${vehicles[vIdx].type.label}) no puede hacer "${job.label}" (en zona LEZ prohibida)`,
              );
              forbiddenJobsAssigned.push(job.label);
            }
          }
        });

        if (forbiddenJobsAssigned.length > 0) {
          invalidAssignments.push({
            vehicleIdx: vIdx,
            jobLabels: forbiddenJobsAssigned,
          });
        }
      }
    });

    // NO eliminar rutas asignadas inválidas - mantener jobs asignados pero sin polygon
    // Solo marcar para no pintar rutas visuales cuando hay violaciones legales
    if (invalidAssignments.length > 0) {
      console.log(
        "[Optimize] ⚠️ Manteniendo asignaciones inválidas pero sin pintar polygons (violaciones legales):",
        invalidAssignments,
      );
    }

    // 4. Data Processing
    const baseUnassignedJobs = this.processUnassignedJobs(
      vroomResult,
      jobs,
      vehicles.length,
    );

    // NO agregar jobs inválidos a unassignedJobs - mantener asignados pero sin polygon
    // const forcedAssignmentErrors = invalidAssignments.flatMap(inv =>
    //   inv.jobLabels.map(jobLabel => ({
    //     id: jobs.find(j => j.label === jobLabel)?.id.toString() || jobLabel,
    //     description: jobLabel,
    //     reason: `El vehículo ${vehicles[inv.vehicleIdx].type.label || vehicles[inv.vehicleIdx].label} no tiene etiqueta medioambiental válida para entrar a la zona LEZ`
    //   }))
    // );

    const unassignedJobs = baseUnassignedJobs; // [...baseUnassignedJobs, ...forcedAssignmentErrors];
    const notices = this.generateNotices(
      vroomResult,
      vehicles,
      jobs,
      vehicleToProfile,
      invalidAssignments,
    );

    // 5. Individual Routing
    const vehicleRoutes = await this.calculateVehicleRoutes(
      vroomResult,
      snappedLocations,
      vehicleToProfile,
      vehicles,
      jobs,
      invalidAssignments,
      poorSmoothnessPolygons,
      options,
    );

    const hasPoorSmoothness = vehicleRoutes.some(r => r.hasPoorSmoothness);

    // 6. Weather Analysis
    const weatherRoutes = await WeatherService.analyzeRoutes(
      vehicleRoutes,
      startTime,
    );

    return {
      coordinates: [],
      distance: vehicleRoutes.reduce((acc, r) => acc + (r.distance || 0), 0),
      duration: vehicleRoutes.reduce((acc, r) => acc + (r.duration || 0), 0),
      vehicleRoutes,
      weatherRoutes,
      unassignedJobs,
      notices,
      hasPoorSmoothness,
    };
  }

  private static getUniqueProfiles(
    vehicleAvoidPolygons: LatLon[][][],
  ): ProfileData[] {
    const profilesMap = new Map<string, LatLon[][]>();
    vehicleAvoidPolygons.forEach((polys) => {
      profilesMap.set(JSON.stringify(polys), polys);
    });

    return Array.from(profilesMap.entries()).map(([_, avoidPolygons], idx) => ({
      name: `p${idx}`,
      avoidPolygons,
    }));
  }

  private static async getMatricesForProfiles(
    locations: LatLon[],
    profiles: ProfileData[],
    allCoords: LatLon[],
    options: OptimizeOptions = {},
  ): Promise<{ matrices: Record<string, number[][]>; poorSmoothnessPolygons: LatLon[][] }> {
    const matrices: Record<string, number[][]> = {};
    const poorSmoothnessPolygons = await this.getPoorSmoothnessPolygons(allCoords);

    console.log(`[Optimize] Smoothness polygons found: ${poorSmoothnessPolygons.length}`);

    for (const profile of profiles) {
      const allAvoid = [...profile.avoidPolygons, ...poorSmoothnessPolygons.filter(p => !locations.some(l => this.isPointInZone(l, p)))];
      matrices[profile.name] = await this.getMatrix(
        locations,
        allAvoid,
        options
      );
    }
    return { matrices, poorSmoothnessPolygons };
  }

  private static async getPoorSmoothnessPolygons(locations: LatLon[]): Promise<LatLon[][]> {
    if (locations.length === 0) return [];

    // Calculate bounding box
    const lats = locations.map(l => l[0]);
    const lons = locations.map(l => l[1]);
    const bbox: [number, number, number, number] = [
      Math.min(...lats) - 0.05,
      Math.min(...lons) - 0.05,
      Math.max(...lats) + 0.05,
      Math.max(...lons) + 0.05,
    ];

    try {
      const ways = await OverpassClient.fetchPoorSmoothnessWays(bbox);

      // Convert ways with geometry to polygons (buffers around the line)
      return ways
        .filter(w => w.geometry && w.geometry.length >= 2)
        .map(w => {
          // Even smaller box around segments to reduce false positives
          const wlats = w.geometry!.map(g => g.lat);
          const wlons = w.geometry!.map(g => g.lon);
          return [
            [Math.min(...wlats) - 0.0005, Math.min(...wlons) - 0.0005],
            [Math.min(...wlats) - 0.0005, Math.max(...wlons) + 0.0005],
            [Math.max(...wlats) + 0.0005, Math.max(...wlons) + 0.0005],
            [Math.max(...wlats) + 0.0005, Math.min(...wlons) - 0.0005],
          ] as LatLon[];
        });
    } catch (e) {
      console.error("[RoutingService] Failed to fetch poor smoothness ways:", e);
      return [];
    }
  }

  private static processUnassignedJobs(
    vroomResult: VroomResult,
    jobs: FleetJob[],
    vehicleOffset: number,
  ) {
    return (vroomResult.unassigned || []).map((u) => {
      const jobIdx = u.id - vehicleOffset;
      const originalJob = jobs[jobIdx];
      return {
        id: originalJob?.id.toString() || u.id.toString(),
        description: originalJob?.label || `Pedido ${jobIdx + 1}`,
        reason: "RESTRICCIÓN: Vehículo no compatible o ubicación fuera de alcance",
      };
    });
  }

  private static generateNotices(
    vroomResult: VroomResult,
    vehicles: FleetVehicle[],
    jobs: FleetJob[],
    vehicleToProfile: { avoidPolygons: LatLon[][] }[],
    invalidAssignments: { vehicleIdx: number; jobLabels: string[] }[] = [],
  ) {
    const notices: {
      title: string;
      message: string;
      type: "info" | "warning";
    }[] = [];

    // Para cada vehículo, verificar si tiene zonas prohibidas y jobs dentro de ellas
    vehicles.forEach((v, idx) => {
      const profile = vehicleToProfile[idx];

      // Si el vehículo tiene zonas prohibidas (no tiene etiqueta válida)
      if (profile.avoidPolygons.length > 0) {
        // Encontrar jobs que están dentro de las zonas prohibidas
        const forbiddenJobs = jobs.filter((job) =>
          profile.avoidPolygons.some((poly) =>
            this.isPointInZone(job.position, poly),
          ),
        );

        if (forbiddenJobs.length > 0) {
          const forbiddenJobNames = forbiddenJobs.map((job) => job.label);
          const label = v.type.label || v.label || `Vehículo ${idx + 1}`;

          // Verificar si este vehículo tiene jobs asignados en la ruta
          const assignedRoute = vroomResult.routes.find(
            (r) => r.vehicle === idx,
          );
          const assignedJobIds =
            assignedRoute?.steps
              .filter((s) => s.type === "job")
              .map((s) => s.id) || [];

          // Si no tiene ningún job asignado de los prohibidos, mostrar aviso
          // Pero no mostrar si ya hay un error de asignación inválida para este vehículo
          const hasInvalidAssignment = invalidAssignments.some(
            (inv) => inv.vehicleIdx === idx,
          );
          const hasNoForbiddenAssigned = !forbiddenJobs.some((fj) =>
            assignedJobIds.includes(vehicles.length + jobs.indexOf(fj)),
          );

          if (
            hasNoForbiddenAssigned &&
            forbiddenJobs.length > 0 &&
            !hasInvalidAssignment
          ) {
            notices.push({
              title: `Vehículo: ${label}`,
              message: `El vehículo "${label}" no puede realizar: ${forbiddenJobNames.join(", ")} debido a restricciones medioambientales (zona LEZ).`,
              type: "warning",
            });
          }
        }
      }
    });

    // Agregar notices para asignaciones inválidas (cuando VROOM no tuvo alternativa)
    invalidAssignments.forEach((inv) => {
      const vehicle = vehicles[inv.vehicleIdx];
      const label =
        vehicle.type.label || vehicle.label || `Vehículo ${inv.vehicleIdx + 1}`;
      notices.push({
        title: `Error: Vehículo ${label}`,
        message: `El vehículo "${label}" NO puede realizar: ${inv.jobLabels.join(", ")} porque no tiene etiqueta medioambiental válida para entrar a la zona LEZ. Necesita agregar otro vehículo con etiqueta válida (0, ECO, B, C).`,
        type: "warning",
      });
    });

    return notices;
  }

  private static async calculateVehicleRoutes(
    vroomResult: VroomResult,
    allLocations: LatLon[],
    vehicleToProfile: { name: string; avoidPolygons: LatLon[][] }[],
    originalVehicles: FleetVehicle[],
    originalJobs: FleetJob[],
    invalidAssignments: { vehicleIdx: number; jobLabels: string[] }[] = [],
    poorSmoothnessPolygons: LatLon[][] = [],
    options: OptimizeOptions = {},
  ): Promise<VehicleRoute[]> {
    const results: VehicleRoute[] = [];
    const invalidVehicleIndices = new Set(
      invalidAssignments.map((inv) => inv.vehicleIdx),
    );

    for (const route of vroomResult.routes) {
      const vIdx = route.vehicle;
      const isInvalidAssignment = invalidVehicleIndices.has(vIdx);

      // Si es una asignación inválida (violación legal), imprimimos warning pero CONTINUAMOS
      // para que el usuario pueda ver la ruta, aunque sea ilegal.
      if (isInvalidAssignment) {
        console.warn(
          `[CalculateRoutes] ⚠️ Ruta para vehículo ${vIdx} (${originalVehicles[vIdx].label}) tiene violaciones legales, pero se calculará geometry.`,
        );
      }

      const profile = vehicleToProfile[vIdx];
      const waypoints = route.steps
        .filter((s) => typeof s.location_index === "number")
        .map((s) => allLocations[s.location_index!]);

      if (waypoints.length < 2) continue;

      const vehicle = originalVehicles[vIdx];
      const color = ROUTE_COLORS[vIdx % ROUTE_COLORS.length];

      let baseAvoidPolygons = profile.avoidPolygons;
      if (options.avoidPoorSmoothness && poorSmoothnessPolygons.length > 0) {
        baseAvoidPolygons = [...baseAvoidPolygons, ...poorSmoothnessPolygons];
      }

      // Filtrar polígonos que contienen alguno de nuestros waypoints
      // para permitir que ORS calcule la ruta entrando a la zona si es necesario
      const filteredAvoidPolygons = baseAvoidPolygons.filter(poly => {
        const anyWaypointInside = waypoints.some(wp => this.isPointInZone(wp, poly));
        if (anyWaypointInside) {
          console.log(`[CalculateRoutes] Omitiendo zona evitable para ORS en vehículo ${vIdx} porque contiene un waypoint.`);
        }
        return !anyWaypointInside;
      });

      const vehicleRoute = await this.fetchOrsRoute(
        vehicle.id,
        waypoints,
        filteredAvoidPolygons,
        color,
        route.steps,
        originalJobs,
        originalVehicles.length,
        poorSmoothnessPolygons,
        options,
      );

      // Si era inválida, marcamos la ruta con el error
      if (isInvalidAssignment && !vehicleRoute.error) {
        const inv = invalidAssignments.find(i => i.vehicleIdx === vIdx);
        vehicleRoute.error = `Violación LEZ: No autorizado para acceder a: ${inv?.jobLabels.join(", ")}`;
      }

      results.push(vehicleRoute);
    }
    return results;
  }

  private static async fetchOrsRoute(
    vehicleId: string | number,
    waypoints: LatLon[],
    avoidPolygons: LatLon[][],
    color: string,
    steps: VroomStep[],
    originalJobs: FleetJob[],
    vehicleOffset: number,
    poorSmoothnessPolygons: LatLon[][] = [],
    options: OptimizeOptions = {},
  ): Promise<VehicleRoute> {
    const orsWaypoints = waypoints.map(([lat, lon]) => [lon, lat]);
    const avoid_polygons = this.formatAvoidPolygons(avoidPolygons);
    const orsPreference = options.preference === "health" ? "fastest" : (options.preference || "recommended");

    const body: any = {
      coordinates: orsWaypoints,
      instructions: false,
      preference: orsPreference,
      radiuses: orsWaypoints.map(() => ROUTING_CONFIG.DEFAULT_RADIUS),
    };

    if (avoid_polygons) {
      body.options = {
        ...body.options,
        avoid_polygons
      };
    }

    try {
      const orsHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const publicHeaders: Record<string, string> = {};
      if (ORS_API_KEY) publicHeaders["Authorization"] = ORS_API_KEY;

      console.log(`[FetchOrsRoute] Sending to ORS:`, JSON.stringify(body));
      const res = await fetchWithFallback(
        `${ORS_URL}/directions/driving-car/geojson`,
        `${ORS_PUBLIC_URL}/directions/driving-car/geojson`,
        {
          method: "POST",
          headers: orsHeaders,
          body: JSON.stringify(body),
        },
        publicHeaders,
      );

      if (!res.ok) throw new Error(await res.text());

      const data: OrsDirectionsResponse = await res.json();
      const feat = data.features[0];
      const coords = feat.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon] as LatLon,
      );

      // Check if any point in the route intersects with poor smoothness
      const hasPoorSmoothness = coords.some(coord =>
        poorSmoothnessPolygons.some(poly => this.isPointInZone(coord, poly))
      );

      console.log(
        `[FetchOrsRoute] Raw ORS distance: ${feat.properties.summary.distance}m, hasPoorSmoothness: ${hasPoorSmoothness}`
      );

      return {
        vehicleId,
        coordinates: coords,
        distance: Math.round(feat.properties.summary.distance / 1000),
        duration: Math.round(feat.properties.summary.duration),
        color,
        jobsAssigned: steps.filter((s) => s.type === "job").length,
        assignedJobIds: steps
          .filter((s) => s.type === "job")
          .map((s) => {
            const jobIdx = (s.id as number) - vehicleOffset;
            return originalJobs[jobIdx]?.id;
          })
          .filter((id): id is string | number => id !== undefined),
        error: undefined,
        hasPoorSmoothness,
      };
    } catch (e) {
      return this.createErrorRoute(
        vehicleId,
        color,
        "Error al calcular la ruta.",
      );
    }
  }

  private static createErrorRoute(
    vehicleId: string | number,
    color: string,
    error: string,
  ): VehicleRoute {
    return {
      vehicleId,
      coordinates: [],
      distance: 0,
      duration: 0,
      color,
      jobsAssigned: 0,
      error,
    };
  }

  private static async getMatrix(
    locations: LatLon[],
    avoidPolygons: LatLon[][],
    options: OptimizeOptions = {},
  ): Promise<number[][]> {
    const orsLocations = locations.map(([lat, lon]) => [lon, lat]);
    const body = {
      locations: orsLocations,
      metrics: ["distance", "duration"],
      units: "m",
    };

    const orsHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const publicHeaders: Record<string, string> = {};
    if (ORS_API_KEY) publicHeaders["Authorization"] = ORS_API_KEY;

    const res = await fetchWithFallback(
      `${ORS_URL}/matrix/driving-car`,
      `${ORS_PUBLIC_URL}/matrix/driving-car`,
      {
        method: "POST",
        headers: orsHeaders,
        body: JSON.stringify(body),
      },
      publicHeaders,
    );

    if (!res.ok) throw new Error(`ORS Matrix failed: ${await res.text()}`);

    const data: OrsMatrixResponse = await res.json();

    // Determinar qué ubicaciones están dentro de zonas prohibidas para este perfil
    const isLocForbidden = locations.map((loc, idx) => {
      const isForbidden = avoidPolygons.some((poly) =>
        this.isPointInZone(loc, poly),
      );
      if (isForbidden) {
        console.log(
          `[Matrix] ⚠️ Ubicación ${idx} (${loc[0].toFixed(4)}, ${loc[1].toFixed(4)}) está en zona prohibida`,
        );
      }
      return isForbidden;
    });

    const forbiddenCount = isLocForbidden.filter(Boolean).length;
    if (forbiddenCount > 0) {
      console.log(
        `[Matrix] ${forbiddenCount} ubicaciones están en zonas prohibidas para este perfil`,
      );
    }

    // Definición de pesos dinámicos según preferencia del Orquestador
    // fastest: Prioriza tiempo (segundos) sobre distancia (metros)
    // shortest: Prioriza distancia pura
    // recommended: Balanceado 1:1 aproximado
    const pref = options.preference || "recommended";
    const trafficFactor = options.traffic ? 1.4 : 1.0; // Simulamos 40% más de tiempo si hay tráfico

    let weightDistance = 1.0;
    let weightTime = 0.3;

    if (pref === "fastest") {
      weightDistance = 0.2;
      weightTime = 8.0; // Mucho más peso al tiempo
    } else if (pref === "shortest") {
      weightDistance = 5.0; // Prioriza metros sobre todo
      weightTime = 0.1;
    } else if (pref === "health") {
      // Para salud del vehículo, priorizamos fuertemente las vías principales (tiempo)
      // sobre cualquier atajo por calle secundaria (distancia).
      weightDistance = 0.3;
      weightTime = 10.0;
    } else {
      // Balanceado
      weightDistance = 1.0;
      weightTime = 1.5;
    }

    return Array.from({ length: locations.length }, (_, i) =>
      Array.from({ length: locations.length }, (_, j) => {
        if (i === j) return 0;

        // Si cualquiera de los dos puntos está en zona prohibida, penalización absoluta
        if (isLocForbidden[i] || isLocForbidden[j]) {
          return ROUTING_CONFIG.UNREACHABLE_COST;
        }

        const d = data.distances?.[i]?.[j];
        const t = data.durations?.[i]?.[j];

        if (d === undefined || t === undefined || d === null || t === null)
          return ROUTING_CONFIG.UNREACHABLE_COST;

        // Aplicamos los pesos dinámicos y el factor de tráfico simulado
        const adjustedDuration = t * trafficFactor;

        let cost = d * weightDistance + adjustedDuration * weightTime;

        // Custom logic for Vehicle Health preference:
        // 1. Penalize unclassified/residential/living_street if avoidPoorSmoothness is on
        // Note: In a real world, ORS matrix doesn't return highway class for each cell easily.
        // We simulate the hierarchy preference by increasing the cost of all non-unblocked paths 
        // if they are not known main roads.
        if (options.avoidPoorSmoothness) {
          // In this simulation, we give a slight preference to the general "best" roads 
          // by reducing cost for paths that are likely main roads (distance > 500m usually implies main roads)
          // or simply increasing base cost slightly to favor routes that stay on main corridors.
          cost *= 1.2;
        }

        return Math.round(cost);
      }),
    );
  }

  private static async runVroom(
    vehicles: FleetVehicle[],
    jobs: FleetJob[],
    matrices: Record<string, number[][]>,
    vehicleToProfile: { name: string }[],
  ): Promise<VroomResult> {
    console.log(
      "[Vroom] Vehicles mapping:",
      vehicles.map((v, idx) => ({
        idx,
        id: v.id,
        label: v.label,
      })),
    );

    // Generate group skills mapping (starting from vehicles.length + 1 to avoid collision)
    const groupSkillsMap = new Map<string | number, number>();
    const uniqueGroupIds = Array.from(new Set(
      vehicles.flatMap(v => v.groupIds || [])
        .concat(jobs.map(j => j.assignedGroupId).filter((id): id is string | number => id !== undefined))
    ));

    uniqueGroupIds.forEach((id, idx) => {
      groupSkillsMap.set(id, vehicles.length + 1 + idx);
    });

    const payload = {
      vehicles: vehicles.map((v, idx) => {
        const vehicleSkills = [idx + 1];
        // Add skills for all groups this vehicle belongs to
        if (v.groupIds) {
          v.groupIds.forEach(gid => {
            const skill = groupSkillsMap.get(gid);
            if (skill) vehicleSkills.push(skill);
          });
        }

        return {
          id: idx,
          start_index: idx,
          profile: vehicleToProfile[idx].name,
          capacity: [ROUTING_CONFIG.MAX_CAPACITY],
          skills: vehicleSkills,
        };
      }),
      jobs: jobs.map((job, jidx) => {
        const vehicleIdx = job.assignedVehicleId
          ? vehicles.findIndex(
            (v) => String(v.id) === String(job.assignedVehicleId),
          )
          : -1;

        const isPinnedToVehicle = vehicleIdx !== -1;
        const groupSkill = job.assignedGroupId ? groupSkillsMap.get(job.assignedGroupId) : null;

        const jobPayload: any = {
          id: vehicles.length + jidx,
          location_index: vehicles.length + jidx,
          service: ROUTING_CONFIG.DEFAULT_SERVICE_TIME,
          delivery: [1],
          description: job.label,
        };

        if (isPinnedToVehicle) {
          jobPayload.skills = [vehicleIdx + 1];
        } else if (groupSkill) {
          jobPayload.skills = [groupSkill];
        }

        return jobPayload;
      }),
      matrices: Object.entries(matrices).reduce(
        (acc: Record<string, { durations: number[][] }>, [name, matrix]) => {
          acc[name] = { durations: matrix };
          return acc;
        },
        {},
      ),
    };

    console.log(
      "[Vroom] Full payload vehicles:",
      JSON.stringify(payload.vehicles, null, 2),
    );
    console.log(
      "[Vroom] Full payload jobs:",
      JSON.stringify(payload.jobs, null, 2),
    );

    const res = await fetchWithFallback(
      VROOM_URL,
      VROOM_PUBLIC,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) throw new Error(`VROOM failed: ${await res.text()}`);

    const vroomResult = await res.json();

    console.log(
      "[Vroom] Response routes:",
      vroomResult.routes.map((r: any) => ({
        vehicle: r.vehicle,
        steps: r.steps.length,
        jobSteps: r.steps.filter((s: any) => s.type === "job").length,
      })),
    );

    return vroomResult;
  }

  private static createFallbackVroomResult(
    vehicles: FleetVehicle[],
    jobs: FleetJob[],
  ): VroomResult {
    /**
     * Simple round-robin assignment without optimization.
     * Used when VROOM service is unavailable (demo mode).
     */
    const routes = vehicles.map((vehicle, vIdx) => {
      const steps: VroomStep[] = [
        {
          type: "start",
          location_index: vIdx,
          arrival: 0,
          duration: 0,
        },
      ];

      // Assign jobs round-robin to this vehicle
      jobs.forEach((job, jIdx) => {
        if (jIdx % vehicles.length === vIdx) {
          steps.push({
            type: "job",
            id: vehicles.length + jIdx,
            location_index: vehicles.length + jIdx,
            arrival: 0,
            duration: ROUTING_CONFIG.DEFAULT_SERVICE_TIME,
          });
        }
      });

      // Add return step
      steps.push({
        type: "end",
        location_index: vIdx,
        arrival: 0,
        duration: 0,
      });

      return {
        vehicle: vIdx,
        steps,
        distance: 0,
        duration: 0,
        cost: 0,
      };
    });

    const unassignedJobs = jobs
      .map((job, jIdx) => vehicles.length + jIdx)
      .filter((jIdx) => !routes.some((r) => r.steps.some((s) => s.id === jIdx)));

    console.log("[Fallback] Round-robin assignment created:", {
      vehicleRoutes: routes.length,
      totalJobs: jobs.length,
      assignedJobs: jobs.length - unassignedJobs.length,
      unassignedJobs: unassignedJobs.length,
    });

    return {
      code: 0,
      routes,
      unassigned: unassignedJobs.map((id) => ({ id })),
      summary: {
        cost: 0,
        unassigned: unassignedJobs.length,
        service: 0,
        duration: 0,
        distance: 0,
      },
    };
  }

  private static async snapCoordinates(
    coordinates: LatLon[],
  ): Promise<LatLon[]> {
    try {
      const res = await fetch(SNAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates }),
      });
      if (!res.ok) return coordinates;
      const data = await res.json();
      return data.snapped.map(
        (s: { snapped: boolean; location: LatLon }, idx: number) =>
          s.snapped ? s.location : coordinates[idx],
      );
    } catch (e) {
      return coordinates;
    }
  }

  private static formatAvoidPolygons(avoidPolygons: LatLon[][]) {
    if (!avoidPolygons || avoidPolygons.length === 0) return null;
    const coords = avoidPolygons
      .map((poly) => {
        if (poly.length < 3) return null;
        const closed = [...poly];
        if (
          closed[0][0] !== closed[closed.length - 1][0] ||
          closed[0][1] !== closed[closed.length - 1][1]
        ) {
          closed.push(closed[0]);
        }
        return [closed.map(([lat, lon]) => [lon, lat])];
      })
      .filter((p): p is [number, number][][] => p !== null);

    return coords.length > 0
      ? { type: "MultiPolygon", coordinates: coords }
      : null;
  }

  /**
   * Verifica si un punto está dentro de una zona (delegado a helper)
   */
  private static isPointInZone(point: LatLon, zoneCoords: any): boolean {
    return isPointInZone(point, zoneCoords);
  }

  /**
   * Checks if a point is inside a polygon using the ray casting algorithm
   */
  static isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    return isPointInPolygon(point, polygon);
  }

  private static getForbiddenZonesForVehicle(
    vehicleTags: string[],
    allZones: Zone[],
  ): Zone[] {
    console.log(
      `[ForbiddenZones] Evaluando ${allZones.length} zonas para vehículo con tags: [${vehicleTags.join(", ") || "NONE"}]`,
    );

    const forbidden = getForbiddenZones(vehicleTags, allZones);

    if (forbidden.length > 0) {
      console.log(
        `[ForbiddenZones] Found ${forbidden.length} forbidden zones:`,
        forbidden.map((z) => {
          const reason = getZoneForbiddenReason(vehicleTags, z);
          return {
            id: z.id,
            name: z.name,
            type: z.type,
            requiredTags: z.requiredTags || [],
            reason,
          };
        }),
      );
    } else {
      console.log("[ForbiddenZones] No forbidden zones for this vehicle");
    }

    return forbidden;
  }

  /**
   * Calculate a real route for custom stops using ORS
   */
  static async calculateCustomStopRoute(
    vehicleId: string | number,
    waypoints: LatLon[],
    avoidPolygons: LatLon[][] = [],
  ): Promise<VehicleRoute | null> {
    if (waypoints.length < 2) return null;

    const orsWaypoints = waypoints.map(([lat, lon]) => [lon, lat]);
    const avoid_polygons = this.formatAvoidPolygons(avoidPolygons);

    const body = {
      coordinates: orsWaypoints,
      instructions: false,
      preference: "recommended",
      radiuses: orsWaypoints.map(() => ROUTING_CONFIG.DEFAULT_RADIUS),
    };

    try {
      console.log(
        `[CustomStopRoute] Requesting ORS for vehicle ${vehicleId} with ${waypoints.length} waypoints`,
      );

      const orsHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const publicHeaders: Record<string, string> = {};
      if (ORS_API_KEY) publicHeaders["Authorization"] = ORS_API_KEY;

      const res = await fetchWithFallback(
        `${ORS_URL}/directions/driving-car/geojson`,
        `${ORS_PUBLIC_URL}/directions/driving-car/geojson`,
        {
          method: "POST",
          headers: orsHeaders,
          body: JSON.stringify(body),
        },
        publicHeaders,
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[CustomStopRoute] ORS Matrix failed: ${errText}`);
        throw new Error(`ORS Matrix failed: ${errText}`);
      }

      const data: OrsDirectionsResponse = await res.json();
      const feat = data.features[0];

      console.log(
        `[CustomStopRoute] Route calculated - distance: ${feat.properties.summary.distance}m, duration: ${feat.properties.summary.duration}s`,
      );

      return {
        vehicleId,
        coordinates: feat.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon],
        ),
        distance: Math.round(feat.properties.summary.distance / 1000),
        duration: Math.round(feat.properties.summary.duration),
        color: "#8B5CF6", // Purple for custom stop routes
        jobsAssigned: 0,
      };
    } catch (err) {
      console.error(
        `[CustomStopRoute] Error calculating custom stop route for vehicle ${vehicleId}:`,
        err,
      );
      return null;
    }
  }
}
