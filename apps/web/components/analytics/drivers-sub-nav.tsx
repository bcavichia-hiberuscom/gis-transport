"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Layout, Users2, Activity, Zap, FileText, Fuel } from "lucide-react";

interface DriversSubNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    actions?: React.ReactNode;
}

const tabs = [
    { id: "overview", label: "Resumen", icon: Layout },
    { id: "drivers", label: "Conductores", icon: Users2 },
    { id: "events", label: "Eventos", icon: Activity },
    { id: "speeding", label: "Infracciones", icon: Zap },
    { id: "requests", label: "Solicitudes", icon: FileText },
];

export function DriversSubNav({ activeTab, onTabChange, actions }: DriversSubNavProps) {
    return (
        <div className="flex items-center gap-10 px-8 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-10">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
                            activeTab === tab.id
                                ? "text-slate-900 font-black"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <tab.icon className={cn("h-3.5 w-3.5", activeTab === tab.id ? "text-slate-950" : "text-slate-400")} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1" />
            {actions && <div className="py-2">{actions}</div>}
        </div>
    );
}
