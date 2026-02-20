"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Route,
    Users,
    Truck,
    Package,
    Layers,
    Map as MapIcon,
    Settings,
    LogOut,
    ChevronRight,
    Fuel,
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
] as const;

export function NavPanel({ activeModule, onModuleChange }: NavPanelProps) {
    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col z-20">
            {/* Business/Workspace Section */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-4 ring-blue-50">
                        H
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate tracking-tight">Hooli Logistics</span>
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-2">Platform</span>
                {navItems.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleChange(item.id as DashboardModule)}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-slate-50 text-blue-600 font-bold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className="text-xs tracking-tight">{item.label}</span>
                            {isActive && <div className="ml-auto h-1 w-1 rounded-full bg-blue-600" />}
                        </button>
                    );
                })}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mt-8 mb-2">Systems</span>
                <button className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-all">
                    <Settings className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-xs tracking-tight">Settings</span>
                </button>
            </nav>

            {/* User Profile Section (Minimalist & Professional) */}
            <div className="p-4 mt-auto border-t border-slate-50">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                        <img
                            src="https://github.com/shadcn.png"
                            alt="User"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">Jordan Finch</span>
                        <span className="text-[10px] text-slate-400 truncate font-medium">Operations Chief</span>
                    </div>
                    <LogOut className="h-3 w-3 ml-auto text-slate-300 group-hover:text-rose-500 transition-colors" />
                </div>
            </div>
        </aside>
    );
}
