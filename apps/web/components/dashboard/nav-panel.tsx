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
        <aside className="w-56 bg-card border-r border-border text-foreground flex flex-col z-20">
            {/* User Profile Section */}
            <div className="p-4 flex items-center gap-3 border-b border-border">
                <div className="h-8 w-8 rounded-md overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    <img
                        src="https://github.com/shadcn.png"
                        alt="User"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className="hidden text-[10px] font-medium text-muted-foreground">BC</div>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold truncate text-foreground">Hooli Dynamic</span>
                    <span className="text-[10px] text-muted-foreground">Jordan Finch</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 flex flex-col gap-0.5 mt-1">
                {navItems.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleChange(item.id as DashboardModule)}
                            className={cn(
                                "group flex items-center justify-between px-3 py-2 rounded-md transition-all duration-150",
                                isActive
                                    ? "bg-secondary text-foreground"
                                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border flex flex-col gap-0.5">
                <button className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-medium">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                </button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors text-xs font-medium">
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
