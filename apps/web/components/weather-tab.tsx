"use client";

import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CloudDrizzle,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  AlertTriangle,
  MapPin,
  Clock,
  Compass,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetVehicle, FleetJob, VehicleRoute } from "@gis/shared";

interface WeatherTabProps {
  fleetVehicles: FleetVehicle[];
  fleetJobs: FleetJob[];
}

export function WeatherTab({ fleetVehicles, fleetJobs }: WeatherTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null); // To store results from Weather API

  useEffect(() => {
    async function fetchWeatherAnalysis() {
      // Mocking a vehicle Route for the API payload based on assigned jobs / vehicles
      // In a real scenario we'd get the actual computed route path coordinates.
      if (fleetVehicles.length === 0) return;
      
      setIsLoading(true);
      try {
        // Here we build a fake route array to send to your weather API for analysis
        // Since we don't have the full VROOM Ors matrix, we send basic vehicle positions
        const activeVehicles = fleetVehicles.filter(v => {
           const hasJobs = fleetJobs.some(j => j.assignedVehicleId === v.id);
           const isOnRoute = v.metrics?.movementState === 'on_route';
           return hasJobs || isOnRoute;
        });

        const routesToAnalyze: VehicleRoute[] = activeVehicles.map(v => ({
           vehicleId: v.id,
           distance: 0,
           duration: 0,
           color: '#000000',
           jobsAssigned: 0,
           coordinates: [v.position] // just pass the current position for now
        }));


        const response = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleRoutes: routesToAnalyze,
            startTime: new Date().toISOString()
          })
        });

        if (response.ok) {
           const data = await response.json();
           setWeatherData(data);
        }
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeatherAnalysis();
  }, [fleetVehicles]);

  const kpis = useMemo(() => {
    const rawRoutes = weatherData?.routes || [];
    let affectedCount = 0;
    let totalRiskScore = 0;
    let alertsCount = 0;

    rawRoutes.forEach((route: any) => {
       if (route.alerts && route.alerts.length > 0) {
          affectedCount++;
          alertsCount += route.alerts.length;
       }
       if (route.riskLevel === 'HIGH') totalRiskScore += 3;
       if (route.riskLevel === 'MEDIUM') totalRiskScore += 2;
       if (route.riskLevel === 'LOW') totalRiskScore += 1;
    });

    return {
       affectedRoutes: affectedCount,
       totalAlerts: alertsCount,
       generalRisk: totalRiskScore > 5 ? 'ELEVADO' : totalRiskScore > 2 ? 'MODERADO' : 'NOMINAL'
    };
  }, [weatherData]);

  const renderWeatherCard = (routeInfo: any) => {
    const vehicle = fleetVehicles.find(v => String(v.id) === String(routeInfo.vehicle));
    if (!vehicle) return null;

    return (
      <div key={routeInfo.vehicle} className="premium-card p-5 cursor-pointer group border-[#EAEAEA] hover:border-[#1C1C1C]/40 transition-all bg-white">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className={cn(
              "h-12 w-12 flex items-center justify-center rounded-lg border transition-all",
              routeInfo.riskLevel === 'HIGH' ? "bg-red-50 border-red-200 text-red-600" :
              routeInfo.riskLevel === 'MEDIUM' ? "bg-amber-50 border-amber-200 text-amber-600" :
              "bg-[#F7F8FA] border-[#EAEAEA] text-[#1C1C1C]"
            )}>
              {routeInfo.riskLevel === 'HIGH' ? <AlertTriangle strokeWidth={1.5} className="h-5 w-5" /> : 
               routeInfo.riskLevel === 'MEDIUM' ? <CloudRain strokeWidth={1.5} className="h-5 w-5" /> :
               <CloudDrizzle strokeWidth={1.5} className="h-5 w-5" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-medium tracking-tight text-[#1C1C1C] truncate">{vehicle.label}</h4>
                <p className="text-[10px] font-medium text-[#6B7280] mt-0.5 uppercase tracking-wider">
                  Nivel de Riesgo • {routeInfo.riskLevel}
                </p>
              </div>
              <Badge className={cn(
                  "font-medium h-6 px-3 border-none tabular-nums text-[10px] rounded-full uppercase tracking-wider",
                  routeInfo.riskLevel === 'HIGH' ? "bg-red-600 text-white" :
                  routeInfo.riskLevel === 'MEDIUM' ? "bg-amber-100 text-amber-800" :
                  "bg-[#1C1C1C] text-[#D4F04A]"
              )}>
                 {routeInfo.alerts?.length || 0} Alertas
              </Badge>
            </div>

            {routeInfo.alerts && routeInfo.alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                 {routeInfo.alerts.map((alert: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded bg-[#F7F8FA] border border-[#EAEAEA]">
                       <div className="mt-0.5 text-[#6B7280]">
                         {alert.event === 'WIND' ? <Wind strokeWidth={1.5} className="h-3.5 w-3.5" /> :
                          alert.event === 'SNOW' ? <Snowflake strokeWidth={1.5} className="h-3.5 w-3.5" /> :
                          <CloudRain strokeWidth={1.5} className="h-3.5 w-3.5" />}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#1C1C1C] uppercase tracking-wider">{alert.event}</span>
                          <span className="text-[10px] text-[#6B7280] leading-snug pr-2">{alert.message}</span>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col grow h-full bg-white overflow-hidden">
      {/* Streamlined Operational Header */}
      <div className="shrink-0 bg-white border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <CloudDrizzle strokeWidth={1.5} className="h-5 w-5" />
               Impacto Meteorológico
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Análisis y mitigación de riesgos climáticos en las rutas operativas activas.
            </p>
          </div>
        </div>

        {/* Similar to DriversSubNav but simplified since it's just one view for now */}
        <div className="px-10 flex items-center gap-6 mt-2 relative">
           <button className="bp-btn relative py-3 text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C] transition-colors">
             Monitorización Activa
             <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1C1C1C] rounded-t-full" />
           </button>
           <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#EAEAEA] -z-10" />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white">
        <ScrollArea className="h-full">
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              
              {/* KPI STRIP */}
              <div className="px-10 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* KPI 1 */}
                  <div className="premium-card p-5 border-[#EAEAEA] bg-white group hover:border-[#D4F04A]/50 transition-all cursor-default">
                    <div className="flex items-center gap-3 mb-6 relative">
                      <div className="h-8 w-8 bg-[#F7F8FA] rounded-md flex items-center justify-center border border-[#EAEAEA] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] transition-all">
                        <RouteIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">Rutas Afectadas</span>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#EAEAEA] group-hover:bg-[#D4F04A] transition-colors" />
                    </div>
                    <div>
                      <span className="text-3xl font-medium tracking-tighter text-[#1C1C1C] tabular-nums">
                        {kpis.affectedRoutes}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#1C1C1C] uppercase tracking-wider">Unidades</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="premium-card p-5 border-[#EAEAEA] bg-white group hover:border-[#D4F04A]/50 transition-all cursor-default relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 relative">
                      <div className="h-8 w-8 bg-[#F7F8FA] rounded-md flex items-center justify-center border border-[#EAEAEA] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] transition-all">
                        <Zap strokeWidth={1.5} className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">Riesgo General</span>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#EAEAEA] group-hover:bg-[#D4F04A] transition-colors" />
                    </div>
                    <div>
                      <span className={cn(
                          "text-3xl font-medium tracking-tighter tabular-nums",
                           kpis.generalRisk === 'ELEVADO' ? "text-red-600" :
                           kpis.generalRisk === 'MODERADO' ? "text-amber-600" :
                           "text-[#1C1C1C]"
                        )}>
                        {kpis.generalRisk}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#1C1C1C] uppercase tracking-wider">Nivel de Alerta</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="premium-card p-5 border-[#EAEAEA] bg-white group hover:border-[#D4F04A]/50 transition-all cursor-default">
                    <div className="flex items-center gap-3 mb-6 relative">
                      <div className="h-8 w-8 bg-[#F7F8FA] rounded-md flex items-center justify-center border border-[#EAEAEA] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] transition-all">
                        <AlertTriangle strokeWidth={1.5} className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">Alertas Activas</span>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#EAEAEA] group-hover:bg-[#D4F04A] transition-colors" />
                    </div>
                    <div>
                      <span className="text-3xl font-medium tracking-tighter text-[#1C1C1C] tabular-nums">
                        {kpis.totalAlerts}
                      </span>
                    </div>
                  </div>

                </div>
              </div>


              {/* MAIN LIST */}
              <div className="px-10 pb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1C1C1C]" />
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#1C1C1C]">Evaluación de Flota Activa</h3>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading ? (
                       <div className="py-20 col-span-full text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <CloudDrizzle strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3 animate-pulse" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Analizando rutas...</p>
                       </div>
                    ) : weatherData?.routes && weatherData.routes.length > 0 ? (
                      weatherData.routes.map(renderWeatherCard)
                    ) : (
                      <div className="py-20 col-span-full text-center bg-[#F7F8FA] rounded-md border border-dashed border-[#EAEAEA]">
                         <Compass strokeWidth={1.25} className="h-8 w-8 text-[#6B7280]/30 mx-auto mb-3" />
                         <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]/50">Sin impactos meteorológicos registrados</p>
                      </div>
                    )}
                </div>
              </div>

            </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function RouteIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="19" r="3"/>
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  );
}
