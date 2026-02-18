"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Route,
    Users,
    Layers,
    Map as MapIcon,
    Settings,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { DashboardModule } from "./dashboard";

interface NavPanelProps {
    activeModule: DashboardModule;
    onModuleChange: (module: DashboardModule) => void;
}

const navItems = [
    { id: "map", label: "Monitorización", icon: MapIcon },
    { id: "drivers", label: "Conductores", icon: Users },
] as const;

export function NavPanel({ activeModule, onModuleChange }: NavPanelProps) {
    return (
        <aside className="w-64 bg-primary text-primary-foreground flex flex-col shadow-xl z-20">
            {/* User Profile Section */}
            <div className="p-6 flex items-center gap-3 border-b border-primary-foreground/10 bg-black/10">
                <div className="h-10 w-10 rounded-full border-2 border-primary-foreground/20 overflow-hidden bg-primary-foreground/10 flex items-center justify-center">
                    <img
                        src="https://github.com/shadcn.png"
                        alt="User"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className="hidden text-xs font-bold">BC</div>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate">Hooli Dynamic</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-widest font-semibold">Jordan Finch</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-2">
                {navItems.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleChange(item.id as DashboardModule)}
                            className={cn(
                                "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary-foreground/15 text-primary-foreground shadow-sm"
                                    : "hover:bg-primary-foreground/5 text-primary-foreground/70 hover:text-primary-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "opacity-100" : "opacity-60")} />
                                <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-primary-foreground/10 flex flex-col gap-1">
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors text-xs font-medium">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                </button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors text-xs font-medium">
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
