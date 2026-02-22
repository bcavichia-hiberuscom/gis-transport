"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    Truck,
    Package,
    Map as MapIcon,
    Settings,
    LogOut,
    Fuel,
    CloudRain,
} from "lucide-react";
import { DashboardModule } from "./dashboard";

interface NavPanelProps {
    activeModule: DashboardModule;
    onModuleChange: (module: DashboardModule) => void;
}

const navItems = [
    { id: "map", label: "Monitorización", icon: MapIcon },
    { id: "drivers", label: "Conductores", icon: Users },
    { id: "vehicles", label: "Vehículos", icon: Truck },
    { id: "fuel", label: "Combustible", icon: Fuel },
    { id: "orders", label: "Pedidos", icon: Package },
    { id: "weather", label: "Climatología", icon: CloudRain },
] as const;

export function NavPanel({ activeModule, onModuleChange }: NavPanelProps) {
    return (
        <aside className="w-[240px] bg-white border-r border-[#EAEAEA] flex flex-col z-20 shrink-0">
            {/* Logo Section */}
            <div className="p-8 pb-10">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-[#1C1C1C] flex items-center justify-center text-[#D4F04A] font-medium text-sm">
                        G
                    </div>
                    <span className="text-sm font-medium tracking-tight text-[#1C1C1C]">GIS Transport</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 flex flex-col gap-1">
                <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.1em] px-4 mb-3 select-none">
                    Menu Principal
                </span>
                {navItems.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleChange(item.id as DashboardModule)}
                            className={cn(
                                "group relative flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200",
                                isActive
                                    ? "text-[#1C1C1C] bg-[#F7F8FA]"
                                    : "text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1C1C1C]"
                            )}
                        >
                            {/* Accent indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#D4F04A] rounded-r-full" />
                            )}
                            
                            <item.icon 
                                strokeWidth={1.5} 
                                className={cn(
                                    "h-[18px] w-[18px] transition-colors", 
                                    isActive ? "text-[#1C1C1C]" : "text-[#6B7280] group-hover:text-[#1C1C1C]"
                                )} 
                            />
                            <span className="text-[13px] font-normal transition-colors">
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                <div className="mt-8 mb-4 px-4">
                    <div className="h-[1px] w-full bg-[#EAEAEA]" />
                </div>

                <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.1em] px-4 mb-3 select-none">
                    Configuración
                </span>
                <button className="group flex items-center gap-3 px-4 py-2.5 rounded-md text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1C1C1C] transition-all duration-200">
                    <Settings strokeWidth={1.5} className="h-[18px] w-[18px] text-[#6B7280] group-hover:text-[#1C1C1C]" />
                    <span className="text-[13px]">Ajustes del Sistema</span>
                </button>
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-[#EAEAEA]">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-[#F7F8FA] transition-all duration-200 cursor-pointer group">
                    <div className="h-8 w-8 rounded-full border border-[#EAEAEA] overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                        <img
                            src="https://github.com/shadcn.png"
                            alt="User"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-medium text-[#1C1C1C] truncate">Jordan Finch</span>
                        <span className="text-[10px] text-[#6B7280] truncate font-normal">Operaciones</span>
                    </div>
                    <LogOut strokeWidth={1.5} className="h-3.5 w-3.5 ml-auto text-[#6B7280] group-hover:text-destructive transition-colors" />
                </div>
            </div>
        </aside>
    );
}
