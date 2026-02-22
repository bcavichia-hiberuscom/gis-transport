"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Play, Pause, Thermometer, Wind, CloudRain, Clock, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { WeatherLegend } from "./weather-legend";

interface WeatherDynamicInterfaceProps {
  layers: {
    weatherRain?: boolean;
    weatherWind?: boolean;
    weatherTemp?: boolean;
  };
  settings: {
    opacity: { rain: number; wind: number; temp: number };
    timelineOffset: number;
    isPlaying: boolean;
  };
  updateSettings: (settings: any) => void;
}

export function WeatherDynamicInterface({
  layers,
  settings,
  updateSettings,
}: WeatherDynamicInterfaceProps) {
  const [showConfig, setShowConfig] = useState(false);

  // Playback Loop Logic
  useEffect(() => {
    let interval: any;
    if (settings.isPlaying) {
      interval = setInterval(() => {
        updateSettings({
          timelineOffset: (settings.timelineOffset + 1) % 25, // 24h loop
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [settings.isPlaying, settings.timelineOffset, updateSettings]);

  if (!layers.weatherRain && !layers.weatherWind && !layers.weatherTemp) return null;

  const currentHour = new Date();
  currentHour.setHours(currentHour.getHours() + settings.timelineOffset);
  const formattedTime = currentHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-6 pointer-events-none">
      <div className="bg-[#1C1C1C]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto overflow-hidden">
        
        {/* Main Content: Timeline & Stats */}
        <div className="flex flex-col gap-6">
          
          {/* Top Bar: Playback Controls & Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-[#D4F04A] hover:text-black text-white border-white/5 transition-all"
                onClick={() => updateSettings({ isPlaying: !settings.isPlaying })}
              >
                {settings.isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </Button>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4F04A]/70">Pronóstico en Tiempo Real</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-white/40" />
                  <span className="text-sm font-medium text-white tabular-nums tracking-tight">
                    {settings.timelineOffset === 0 ? "Ahora" : `+${settings.timelineOffset}h • ${formattedTime}`}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full border transition-all",
                showConfig ? "bg-[#D4F04A] text-black border-transparent" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              )}
              onClick={() => setShowConfig(!showConfig)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="relative group px-1">
            <Slider
              value={[settings.timelineOffset]}
              min={0}
              max={24}
              step={1}
              onValueChange={([val]: number[]) => updateSettings({ timelineOffset: val })}
              className="py-4"
            />
            {/* Ticks */}
            <div className="flex justify-between px-1">
               {[0, 6, 12, 18, 24].map((h) => (
                 <span key={h} className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                   {h}h
                 </span>
               ))}
            </div>
          </div>

          {/* Config Panel: Opacity Sliders */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-white/5 transition-all duration-500 overflow-hidden",
            showConfig ? "max-h-48 opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
          )}>
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-blue-400" />
                   <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Opacidad Radar</span>
                 </div>
                 <span className="text-[9px] font-medium text-[#D4F04A] tabular-nums">{Math.round(settings.opacity.rain * 100)}%</span>
               </div>
               <Slider
                 value={[settings.opacity.rain * 100]}
                 onValueChange={([v]: number[]) => updateSettings({ opacity: { ...settings.opacity, rain: v / 100 } })}
                 className="opacity-slider"
               />
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-teal-400" />
                   <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Opacidad Viento</span>
                 </div>
                 <span className="text-[9px] font-medium text-[#D4F04A] tabular-nums">{Math.round(settings.opacity.wind * 100)}%</span>
               </div>
               <Slider
                 value={[settings.opacity.wind * 100]}
                 onValueChange={([v]: number[]) => updateSettings({ opacity: { ...settings.opacity, wind: v / 100 } })}
                 className="opacity-slider"
               />
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-orange-400" />
                   <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Opacidad Térmica</span>
                 </div>
                 <span className="text-[9px] font-medium text-[#D4F04A] tabular-nums">{Math.round(settings.opacity.temp * 100)}%</span>
               </div>
               <Slider
                 value={[settings.opacity.temp * 100]}
                 onValueChange={([v]: number[]) => updateSettings({ opacity: { ...settings.opacity, temp: v / 100 } })}
                 className="opacity-slider"
               />
            </div>
          </div>

          {/* Dynamic Legends Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 mt-auto">
            <WeatherLegend type="temp" visible={!!layers.weatherTemp} />
            <WeatherLegend type="rain" visible={!!layers.weatherRain} />
            <WeatherLegend type="wind" visible={!!layers.weatherWind} />
          </div>
        </div>

        {/* Glossy Refraction Background Blur Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F04A]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      </div>
    </div>
  );
}
