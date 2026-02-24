"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CloudRain, Wind, Thermometer, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

interface WeatherHUDProps {
  weatherRoutes: any[];
  visible: boolean;
  vehicleRoutes?: any[];
}

export function WeatherHUD({ weatherRoutes, visible, vehicleRoutes }: WeatherHUDProps) {
  const activeAlert = useMemo(() => {
    if (!visible || !weatherRoutes || weatherRoutes.length === 0) return null;

    // Only consider vehicles with active routes
    const activeVehicleIds = new Set((vehicleRoutes || []).map(vr => String(vr.vehicleId)));
    const activeWeather = weatherRoutes.filter(wr => activeVehicleIds.has(String(wr.vehicle)));

    if (activeWeather.length === 0) return null;

    // Find the most critical alert
    const severityMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    let best: any = null;

    activeWeather.forEach(wr => {
      wr.alerts?.forEach((alert: any) => {
        if (!best || (severityMap[alert.severity] || 0) > (severityMap[best.severity] || 0)) {
          best = { ...alert, vehicle: wr.vehicle };
        }
      });
    });

    return best;
  }, [weatherRoutes, visible, vehicleRoutes]);

  if (!visible || !activeAlert) return null;

  const getIcon = () => {
    switch (activeAlert.event) {
      case "RAIN": return <CloudRain className="h-5 w-5 text-blue-400" />;
      case "WIND": return <Wind className="h-5 w-5 text-[#D4F04A]" />;
      case "HEAT":
      case "COLD": return <Thermometer className="h-5 w-5 text-orange-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#1C1C1C]/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto flex items-center gap-6 group hover:border-[#D4F04A]/40 transition-all">
        
        {/* Severity Badge / Glow */}
        <div className="relative shrink-0">
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-700",
            activeAlert.severity === 'HIGH' ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : 
            "bg-[#D4F04A]/10 border-[#D4F04A]/20 text-[#D4F04A]"
          )}>
            {getIcon()}
          </div>
          {activeAlert.severity === 'HIGH' ? (
             <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-[#1C1C1C] animate-pulse" />
          ) : (
             <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#D4F04A] rounded-full border-2 border-[#1C1C1C]" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-[140px]">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded",
              activeAlert.severity === 'HIGH' ? "bg-red-600 text-white" : "bg-white/10 text-white/40"
            )}>
              {activeAlert.severity === 'HIGH' ? 'System Alert' : 'Live Status'}
            </span>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold text-[#D4F04A] uppercase tracking-widest">
              Radar
            </span>
          </div>
          <h3 className="text-[13px] font-bold text-white mt-1 flex items-center gap-2 tabular-nums">
            {activeAlert.event} Impact
            <span className="text-white/20 font-light">/</span>
            {Math.round(activeAlert.value)} {activeAlert.event === 'WIND' ? 'm/s' : '°'}
          </h3>
          <p className="text-[9px] text-white/40 font-bold mt-0.5 uppercase tracking-tight">
             Vehículo: <span className="text-white/70 italic ml-1">ID-{activeAlert.vehicle}</span>
          </p>
        </div>

        {/* Separator */}
        <div className="h-8 w-[1px] bg-white/10 mx-1" />

        {/* Right Info */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5">
             <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A] animate-pulse" />
             <span className="text-[10px] font-black text-white uppercase tracking-tighter">Monitoreando</span>
          </div>
          <div className="flex items-center gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-all cursor-pointer">
             <span className="text-[8px] font-black text-white uppercase tracking-widest">Ver Mapa</span>
             <ChevronRight className="h-3 w-3" />
          </div>
        </div>

      </div>
    </div>
  );
}
