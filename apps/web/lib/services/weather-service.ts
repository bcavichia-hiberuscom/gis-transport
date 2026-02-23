import { OPENWEATHER_URL } from "@/lib/config";
import { WeatherAlert, RawWeatherData, RouteWeather, VehicleRoute } from "@gis/shared";

export class WeatherService {
    private static cache = new Map<string, { data: RawWeatherData[]; timestamp: number }>();
    private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    /**
     * Samples points along routes and fetches weather alerts.
     */
    static async analyzeRoutes(
        vehicleRoutes: VehicleRoute[],
        startTime: string = new Date().toISOString(),
        bbox?: [number, number, number, number]
    ): Promise<RouteWeather[]> {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        if (!apiKey) {
            console.error("WeatherService: Missing OpenWeatherMap API key");
            return [];
        }

        // If no routes, but bbox provided, fetch a dense grid for that area
        if (vehicleRoutes.length === 0 && bbox) {
            const windNodes = await this.getWindField(bbox, apiKey);
            const globalAlerts: WeatherAlert[] = windNodes.map(node => ({
                segmentIndex: 0,
                event: "WIND",
                severity: "LOW",
                message: `Wind check`,
                lat: node.lat,
                lon: node.lon,
                timeWindow: startTime,
                value: node.speed,
                direction: node.direction
            }));
            return [{ vehicle: "GLOBAL", riskLevel: "LOW", alerts: globalAlerts }];
        }

        // If no routes and no bbox, return a default Iberian grid
        if (vehicleRoutes.length === 0) {
            const gridPoints: [number, number][] = [
                [40.4168, -3.7038], // Madrid
                [41.3851, 2.1734],  // Barcelona
                [37.3891, -5.9845], // Sevilla
                [43.3623, -8.4115], // A Coruña
                [39.4699, -0.3763], // Valencia
                [36.7213, -4.4214], // Málaga
                [43.2630, -2.9350], // Bilbao
                [41.6488, -0.8891], // Zaragoza
                [38.3460, -0.4907], // Alicante
                [28.1235, -15.4363],// Las Palmas
                [39.5696, 2.6502],  // Palma
                [38.7223, -9.1393], // Lisboa
                [41.1579, -8.6291], // Porto
                [44.8378, -0.5792], // Bordeaux
                [43.7102, 7.2620],   // Nice
            ];
            const globalAlerts: WeatherAlert[] = [];
            for (const [lat, lon] of gridPoints) {
                const current = await this.getCurrentWeather(lat, lon, apiKey);
                if (current) {
                    globalAlerts.push(...this.evaluateThresholds(current, lat, lon, startTime, 0));
                }
            }
            return [{ vehicle: "GLOBAL", riskLevel: "LOW", alerts: globalAlerts }];
        }

        const startDate = new Date(startTime);
        const results: RouteWeather[] = [];

        for (const vr of vehicleRoutes) {
            const alerts: WeatherAlert[] = [];
            const coords = vr.coordinates || [];

            if (coords.length === 0) {
                results.push({ vehicle: vr.vehicleId, riskLevel: "LOW", alerts: [] });
                continue;
            }

            // Sample indices: start, middle, end
            const samples = Array.from(new Set([0, Math.floor(coords.length / 2), coords.length - 1]));

            for (let i = 0; i < samples.length; i++) {
                const idx = samples[i];
                const point = coords[idx];
                if (!point) continue;

                const [lat, lon] = point;
                const forecast = await this.getForecast(lat, lon, apiKey);

                if (!forecast || forecast.length === 0) continue;

                const frac = coords.length <= 1 ? 0 : idx / (coords.length - 1);
                const eta = new Date(startDate.getTime() + ((vr.duration || 0) * frac * 1000)).getTime() / 1000;

                // Find closest forecast item
                const closest = forecast.reduce((prev: RawWeatherData, curr: RawWeatherData) =>
                    Math.abs(curr.dt - eta) < Math.abs(prev.dt - eta) ? curr : prev
                );

                const pointAlerts = this.evaluateThresholds(closest, lat, lon, new Date(eta * 1000).toISOString(), i);
                alerts.push(...pointAlerts);
            }

            const riskLevel = alerts.some(a => a.severity === "HIGH")
                ? "HIGH"
                : alerts.length > 0 ? "MEDIUM" : "LOW";

            results.push({
                vehicle: vr.vehicleId,
                riskLevel,
                alerts
            });
        }

        return results;
    }

    private static async getWindField(bbox: [number, number, number, number], apiKey: string): Promise<any[]> {
        try {
            const [lonL, latB, lonR, latT] = bbox;
            // OWM Box API: bbox {lon-left,lat-bottom,lon-right,lat-top,zoom}
            const url = `https://api.openweathermap.org/data/2.5/box/city?bbox=${lonL},${latB},${lonR},${latT},10&units=metric&appid=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();

            return (data.list || []).map((item: any) => {
                const node = {
                    lat: item.coord.Lat || item.coord.lat,
                    lon: item.coord.Lon || item.coord.lon,
                    speed: item.wind.speed,
                    direction: item.wind.deg
                };
                return node;
            });
        } catch (e) {
            console.error("WeatherService: Box fetch failed", e);
            return [];
        }
    }

    private static async getCurrentWeather(lat: number, lon: number, apiKey: string): Promise<RawWeatherData | null> {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();

            return {
                main: data.main,
                wind: data.wind,
                rain: data.rain,
                snow: data.snow,
                visibility: data.visibility,
                dt: data.dt
            };
        } catch (e) {
            console.error("WeatherService: Current weather fetch failed", e);
            return null;
        }
    }

    private static async getForecast(lat: number, lon: number, apiKey: string): Promise<RawWeatherData[]> {
        const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }

        try {
            const res = await fetch(
                `${OPENWEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            );
            if (!res.ok) return [];
            const data = await res.json();
            const forecast = data.list || [];

            this.cache.set(cacheKey, { data: forecast, timestamp: Date.now() });
            return forecast;
        } catch (e) {
            console.error("WeatherService: Forecast fetch failed", e);
            return [];
        }
    }

    private static evaluateThresholds(
        data: RawWeatherData,
        lat: number,
        lon: number,
        timeWindow: string,
        segmentIndex: number
    ): WeatherAlert[] {
        const alerts: WeatherAlert[] = [];

        const temp = data.main?.temp ?? 0;
        const rain = data.rain?.["3h"] ?? 0;
        const snow = data.snow?.["3h"] ?? 0;
        const wind = data.wind?.speed ?? 0;
        const windDeg = data.wind?.deg ?? 0;
        const visibility = data.visibility ?? 10000;

        // Always add a "HEAT" or "COLD" alert if we want labels on the map
        // but let's stick to the user's "solo si activo las layers"
        // Actually, I'll pass the values in all alerts.

        if (snow > 0) {
            alerts.push({
                segmentIndex,
                event: "SNOW",
                severity: snow >= 5 ? "HIGH" : "MEDIUM",
                message: `Nieve (${snow.toFixed(1)} mm): reducir velocidad.`,
                lat, lon, timeWindow,
                value: snow
            });
        }

        if (rain > 0) {
            alerts.push({
                segmentIndex,
                event: "RAIN",
                severity: rain >= 20 ? "HIGH" : rain >= 10 ? "MEDIUM" : "LOW",
                message: `Lluvia (${rain.toFixed(1)} mm): posible hidroplaneo.`,
                lat, lon, timeWindow,
                value: rain
            });
        }

        if (temp <= 5) {
            alerts.push({
                segmentIndex,
                event: temp <= 0 ? "ICE" : "COLD",
                severity: temp <= 0 ? "HIGH" : "LOW",
                message: temp <= 0 ? "Riesgo de hielo: extreme precaución." : `Frío (${temp.toFixed(1)}°C).`,
                lat, lon, timeWindow,
                value: temp
            });
        } else if (temp >= 30) {
            alerts.push({
                segmentIndex,
                event: "HEAT",
                severity: temp >= 40 ? "HIGH" : "MEDIUM",
                message: `Calor extremo (${temp.toFixed(1)}°C).`,
                lat, lon, timeWindow,
                value: temp
            });
        }

        if (wind >= 0.5) { // Back to testing threshold (m/s) as requested
            alerts.push({
                segmentIndex,
                event: "WIND",
                severity: wind >= 25 ? "HIGH" : wind >= 15 ? "MEDIUM" : "LOW",
                message: `Viento (${wind.toFixed(1)} m/s, ${windDeg}°).`,
                lat, lon, timeWindow,
                value: wind,
                direction: windDeg
            });
        }

        if (visibility < 5000) {
            alerts.push({
                segmentIndex,
                event: "FOG",
                severity: visibility < 200 ? "HIGH" : visibility < 1000 ? "MEDIUM" : "LOW",
                message: `Visibilidad reducida (${visibility} m).`,
                lat, lon, timeWindow,
                value: visibility
            });
        }

        return alerts;
    }
}
