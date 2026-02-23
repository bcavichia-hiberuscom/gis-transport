"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Route, Gauge, Sparkles, Activity, MapPin, Loader2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetJob, FleetVehicle, Zone, VehicleGroup, RouteData } from "@gis/shared";
import dynamic from "next/dynamic";
import { calculateDistance } from "@/lib/utils";

// Prevent SSR for Leaflet
const MapPreview = dynamic(() => import("@/components/map-preview"), { ssr: false });

interface RouteAlternative {
    preference: "shortest" | "fastest";
    label: string;
    icon: React.ElementType;
    data: RouteData | null;
    estimatedCost: number;
    fuelSource: string;
    fuelPrice: number;
    description?: string;
    error?: string;
}

interface MapPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetVariables: {
        jobs: FleetJob[];
        vehicles?: FleetVehicle[];
        groupId?: string | number;
    };
    fleetVehicles: FleetVehicle[];
    vehicleGroups?: VehicleGroup[];
    activeZones: Zone[];
    onConfirm: (preference: "shortest" | "fastest") => void;
}

export function MapPreviewModal({
    open,
    onOpenChange,
    targetVariables,
    fleetVehicles,
    vehicleGroups = [],
    activeZones,
    onConfirm
}: MapPreviewModalProps) {
    const [alternatives, setAlternatives] = useState<RouteAlternative[]>([
        { preference: "shortest", label: "Eficiente", icon: Route, data: null, estimatedCost: 0, fuelSource: "", fuelPrice: 0, 
            description: "Calculada con foco en menor impacto ambiental y menor trayecto total (prioriza menor coste)." },
        { preference: "fastest", label: "Rápida", icon: Gauge, data: null, estimatedCost: 0, fuelSource: "", fuelPrice: 0,
            description: "Calculada con foco en minimizar el tiempo operativo (prioriza vías rápidas o autopistas)." }
    ]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [selectedPreference, setSelectedPreference] = useState<"shortest" | "fastest" | null>("shortest");
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Resolve which vehicles are actually going to be used for calculation
    const resolvedVehicles = useMemo(() => {
        if (targetVariables.vehicles && targetVariables.vehicles.length > 0) {
            return targetVariables.vehicles;
        }
        if (targetVariables.groupId) {
            const group = vehicleGroups.find(g => String(g.id) === String(targetVariables.groupId));
            if (group) {
                const groupVehicleIds = new Set(group.vehicleIds.map(String));
                return fleetVehicles.filter(v => groupVehicleIds.has(String(v.id)));
            }
        }
        return fleetVehicles; // fallback to all
    }, [targetVariables, fleetVehicles, vehicleGroups]);

    const primaryVehicle = resolvedVehicles[0];

    // Reset state upon opening
    useEffect(() => {
        if (open) {
            setSelectedPreference(null);
            setGlobalError(null);
            calculateAlternatives();
        }
    }, [open]);

    const fetchFuelPrice = async (lat: number, lon: number): Promise<{ price: number, source: string }> => {
        try {
            // Check if vehicle is EV to fetch from ev-stations, otherwise gas
            const isEV = primaryVehicle?.type?.tags?.includes("ev") || false;
            const endpoint = isEV ? "/api/ev-stations" : "/api/gas-stations";
            
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                distanceKm: "5"
            });
            
            const res = await fetch(`${endpoint}?${params}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.data && data.data.length > 0) {
                    const firstGas = data.data[0];
                    if (isEV) {
                        return { 
                            price: firstGas.price || 0.45, 
                            source: `${firstGas.brand || 'Electrolinera'} (0.45€/kWh)` 
                        };
                    } else {
                        return { 
                            price: firstGas.prices?.diesel || firstGas.prices?.gasoline95 || 1.6, 
                            source: `${firstGas.brand || 'Gasolinera'} (${firstGas.prices?.diesel || 1.6}€/L)` 
                        };
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching fuel price:", e);
        }
        // Fallback
        const isEV = primaryVehicle?.type?.tags?.includes("ev");
        if (isEV) return { price: 0.45, source: "Estimado Estándar (0.45€/kWh)" };
        return { price: 1.6, source: "Estimado Estándar (1.60€/L)" };
    };

    const calculateCost = (distanceMeters: number, pricePerUnit: number, isEV: boolean) => {
        const distanceKm = distanceMeters / 1000;
        const performance = (primaryVehicle as any)?.metadata?.performance || (isEV ? 15 : 8); // kWh/100km or L/100km
        return (distanceKm / 100) * performance * pricePerUnit;
    };

    const calculateAlternatives = async () => {
        if (!primaryVehicle || targetVariables.jobs.length === 0) {
            setGlobalError("Faltan datos para calcular (vehículo o pedidos).");
            return;
        }

        setIsCalculating(true);
        setGlobalError(null);

        try {
            const startLat = primaryVehicle.position[0];
            const startLon = primaryVehicle.position[1];
            
            // 1. Fetch fuel info
            const fuelInfo = await fetchFuelPrice(startLat, startLon);
            const isEV = primaryVehicle.type?.tags?.includes("ev") ?? false;

            // 2. Fetch routes in parallel
            const fetchRoute = async (pref: "shortest" | "fastest") => {
                const res = await fetch("/api/gis/optimize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        vehicles: resolvedVehicles,
                        jobs: targetVariables.jobs,
                        startTime: new Date().toISOString(),
                        zones: activeZones,
                        preference: pref,
                        traffic: false, // Standardized for preview
                        isSimulation: true
                    })
                });
                const responseData = await res.json();
                if (!res.ok || !responseData.success) {
                    throw new Error(responseData.error?.message || "Error al calcular ruta");
                }
                return responseData.data as RouteData;
            };

            const [shortestData, fastestData] = await Promise.all([
                fetchRoute("shortest"),
                fetchRoute("fastest")
            ]);

            // Sum distance across all vehicle routes returned in this option
            const sumDistanceShortest = shortestData.vehicleRoutes?.reduce((acc, r) => acc + (r.distance || 0), 0) || 0;
            const sumDurationShortest = shortestData.vehicleRoutes?.reduce((acc, r) => acc + (r.duration || 0), 0) || 0;
            
            const sumDistanceFastest = fastestData.vehicleRoutes?.reduce((acc, r) => acc + (r.distance || 0), 0) || 0;
            const sumDurationFastest = fastestData.vehicleRoutes?.reduce((acc, r) => acc + (r.duration || 0), 0) || 0;

            // Attach computed summaries since RouteData might not have a top-level summary typed
            const shortestWithSummary = { 
                ...shortestData, 
                _computedSummary: { distance: sumDistanceShortest, duration: sumDurationShortest },
                vehicleRoutes: shortestData.vehicleRoutes?.map(r => ({ ...r, color: "#10b981" }))
            } as any;
            const fastestWithSummary = { 
                ...fastestData, 
                _computedSummary: { distance: sumDistanceFastest, duration: sumDurationFastest },
                vehicleRoutes: fastestData.vehicleRoutes?.map(r => ({ ...r, color: "#0ea5e9" }))
            } as any;

            // 3. Process results
            setAlternatives([
                {
                    preference: "shortest",
                    label: "Eficiente",
                    icon: Route,
                    data: shortestWithSummary,
                    fuelPrice: fuelInfo.price,
                    fuelSource: fuelInfo.source,
                    estimatedCost: calculateCost(sumDistanceShortest, fuelInfo.price, isEV)
                },
                {
                    preference: "fastest",
                    label: "Rápida",
                    icon: Gauge,
                    data: fastestWithSummary,
                    fuelPrice: fuelInfo.price,
                    fuelSource: fuelInfo.source,
                    estimatedCost: calculateCost(sumDistanceFastest, fuelInfo.price, isEV)
                }
            ]);

        } catch (err) {
            console.error(err);
            setGlobalError("Hubo un error calculando las alternativas de ruta.");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleConfirm = () => {
        if (selectedPreference) {
            onConfirm(selectedPreference);
            onOpenChange(false);
        }
    };

    const routesToCompare = useMemo(() => {
        if (selectedPreference) {
            return alternatives
                .filter(a => a.preference === selectedPreference)
                .map(a => a.data)
                .filter(Boolean) as RouteData[];
        }
        return alternatives.map(a => a.data).filter(Boolean) as RouteData[];
    }, [alternatives, selectedPreference]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl p-0 overflow-hidden bg-white border-[#EAEAEA] gap-0 flex flex-col h-[85vh]">
                
                {/* Header */}
                <div className="shrink-0 px-8 py-5 border-b border-[#EAEAEA] flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#1C1C1C] flex items-center justify-center rounded-lg text-[#D4F04A]">
                            <Sparkles strokeWidth={1.5} className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-semibold text-[#1C1C1C] uppercase tracking-wider">
                                Vista Previa de Asignación
                            </h2>
                            <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mt-0.5">
                                Seleccione la estrategia operativa
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 bg-[#F7F8FA]">
                    {/* Left Panel: Options */}
                    <div className="w-[380px] shrink-0 border-r border-[#EAEAEA] bg-white flex flex-col overflow-y-auto z-10">
                        {isCalculating ? (
                            <div className="flex flex-col items-center justify-center py-32 px-10 gap-4">
                                <Activity strokeWidth={1.5} className="h-8 w-8 text-[#1C1C1C] animate-spin" />
                                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider text-center">
                                    Simulando alternativas heurísticas...
                                </p>
                            </div>
                        ) : globalError ? (
                            <div className="p-8">
                                <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg flex flex-col gap-2">
                                    <p className="text-xs font-semibold">Error de simulación</p>
                                    <p className="text-[11px]">{globalError}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 flex flex-col gap-6">
                                {alternatives.map((alt) => {
                                    if (!alt.data) return null;
                                    const isSelected = selectedPreference === alt.preference;
                                    const distanceKm = ((alt.data as any)._computedSummary.distance / 1000).toFixed(1);
                                    const timeMins = Math.ceil((alt.data as any)._computedSummary.duration / 60);

                                    return (
                                        <div
                                            key={alt.preference}
                                            onClick={() => setSelectedPreference(alt.preference)}
                                            className={cn(
                                                "p-5 flex flex-col gap-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                                                isSelected 
                                                    ? "border-[#1C1C1C] bg-[#1C1C1C] shadow-lg" 
                                                    : "border-[#EAEAEA] bg-white hover:border-[#1C1C1C]/40"
                                            )}
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                                                        isSelected ? "bg-[#D4F04A] text-[#1C1C1C]" : "bg-[#F7F8FA] text-[#1C1C1C]"
                                                    )}>
                                                        <alt.icon strokeWidth={1.5} className="h-4 w-4" />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[13px] font-bold uppercase tracking-widest",
                                                        isSelected ? "text-white" : "text-[#1C1C1C]"
                                                    )}>
                                                        Opción {alt.label}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                                                    isSelected ? "border-[#D4F04A]" : "border-[#EAEAEA]"
                                                )}>
                                                    {isSelected && <div className="h-2 w-2 rounded-full bg-[#D4F04A]" />}
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 dark:border-black/5">
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn("text-[9px] uppercase tracking-widest font-medium opacity-60", isSelected ? "text-white" : "text-[#6B7280]")}>Distancia</span>
                                                    <span className={cn("text-sm font-semibold tabular-nums", isSelected ? "text-[#D4F04A]" : "text-[#1C1C1C]")}>{distanceKm} km</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn("text-[9px] uppercase tracking-widest font-medium opacity-60", isSelected ? "text-white" : "text-[#6B7280]")}>Tiempo</span>
                                                    <span className={cn("text-sm font-semibold tabular-nums", isSelected ? "text-white" : "text-[#1C1C1C]")}>{timeMins} min</span>
                                                </div>
                                                <div className="col-span-2 flex flex-col gap-1 pt-2">
                                                    <span className={cn("text-[9px] uppercase tracking-widest font-medium opacity-60", isSelected ? "text-white" : "text-[#6B7280]")}>
                                                        Costo Estimado
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-base font-bold tabular-nums", isSelected ? "text-[#D4F04A]" : "text-[#1C1C1C]")}>
                                                            €{alt.estimatedCost.toFixed(2)}
                                                        </span>
                                                        <span className={cn("text-[10px] font-medium border px-1.5 py-0.5 rounded", 
                                                            isSelected ? "border-white/20 text-white/80 bg-white/5" : "border-[#EAEAEA] text-[#6B7280] bg-[#F7F8FA]"
                                                        )}>
                                                            {alt.fuelSource}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason Description */}
                                            {alt.description && (
                                                <div className={cn("pt-4 mt-2 border-t border-white/10 dark:border-black/5 text-[10.5px] leading-relaxed", 
                                                    isSelected ? "text-white/80" : "text-[#6B7280]"
                                                )}>
                                                    {alt.description}
                                                </div>
                                            )}

                                            {/* Decorative glow when selected */}
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F04A]/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Map */}
                    <div className="flex-1 relative bg-[#EAEAEA]">
                        {!isCalculating && routesToCompare.length > 0 && primaryVehicle ? (
                            <MapPreview
                                vehicle={primaryVehicle}
                                jobs={targetVariables.jobs}
                                compareRoutes={routesToCompare}
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
                                {isCalculating && <Activity strokeWidth={1.5} className="h-8 w-8 text-[#1C1C1C] animate-spin opacity-20" />}
                            </div>
                        )}
                        
                        {/* Legend overlay */}
                        {!isCalculating && routesToCompare.length > 0 && (
                            <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-[#EAEAEA] flex flex-col gap-3">
                                <span className="text-[10px] font-bold text-[#1C1C1C] uppercase tracking-widest">Leyenda Vías</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-[3px] bg-sky-500 rounded-full" />
                                    <span className="text-[11px] font-medium text-[#6B7280]">Plan Rápido</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-[3px] bg-emerald-500 rounded-full" />
                                    <span className="text-[11px] font-medium text-[#6B7280]">Plan Eficiente</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-8 py-5 border-t border-[#EAEAEA] flex items-center justify-between bg-white z-10">
                   <p className="text-[11px] font-medium text-[#6B7280] max-w-lg">
                       Operación bloqueada hasta validación. Nota: En la versión actual los cálculos asumen condiciones ideales.<br/>
                       En un futuro se incluirá soporte nativo para integrar datos de <strong className="font-semibold">Tráfico en Tiempo Real</strong> a los cálculos de demora.
                   </p>
                   <div className="flex items-center gap-4">
                       <Button
                           variant="ghost"
                           onClick={() => onOpenChange(false)}
                           className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280] hover:text-[#1C1C1C]"
                       >
                           Cancelar
                       </Button>
                       <Button
                           onClick={handleConfirm}
                           disabled={!selectedPreference}
                           className="h-10 px-8 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white transition-all shadow-none disabled:opacity-50 border-none rounded-md"
                       >
                           <Navigation strokeWidth={1.5} className="h-4 w-4 mr-2" />
                           <span className="text-[11px] font-bold uppercase tracking-widest">Lanzar Ruta</span>
                       </Button>
                   </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
