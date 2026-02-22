"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LegendProps {
  type: "temp" | "rain" | "wind";
  visible: boolean;
}

export function WeatherLegend({ type, visible }: LegendProps) {
  if (!visible) return null;

  const configs = {
    temp: {
      title: "Temperatura (°C)",
      gradient: "bg-gradient-to-r from-blue-600 via-green-400 via-yellow-300 via-orange-500 to-purple-600",
      labels: ["-20°", "0°", "15°", "30°", "45°+"],
    },
    rain: {
      title: "Precipitación (mm/h)",
      gradient: "bg-gradient-to-r from-blue-200 via-green-400 via-yellow-400 to-red-600",
      labels: ["Ligera", "Media", "Fuerte", "Tormenta"],
    },
    wind: {
      title: "Viento (km/h)",
      gradient: "bg-gradient-to-r from-gray-200 via-blue-300 via-teal-400 to-red-500",
      labels: ["Calma", "Brisa", "Fuerte", "Vendaval"],
    },
  };

  const config = configs[type];

  return (
    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">{config.title}</span>
      </div>
      <div className={cn("h-1.5 w-full rounded-full ring-1 ring-white/10", config.gradient)} />
      <div className="flex justify-between px-0.5">
        {config.labels.map((label, idx) => (
          <span key={idx} className="text-[8px] font-medium text-white/50 uppercase">{label}</span>
        ))}
      </div>
    </div>
  );
}
