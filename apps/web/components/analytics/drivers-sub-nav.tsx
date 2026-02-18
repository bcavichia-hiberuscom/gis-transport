"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Layout, Users2, Activity, Zap, FileText, Fuel } from "lucide-react";

interface DriversSubNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { id: "overview", label: "Resumen", icon: Layout },
    { id: "drivers", label: "Conductores", icon: Users2 },
    { id: "fuel", label: "Combustible", icon: Fuel },
    { id: "events", label: "Eventos", icon: Activity },
    { id: "speeding", label: "Infracciones", icon: Zap },
    { id: "requests", label: "Solicitudes", icon: FileText },
];

export function DriversSubNav({ activeTab, onTabChange }: DriversSubNavProps) {
    return (
        <div className="flex items-center gap-6 px-8 border-b border-border bg-card shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "py-3 text-xs font-medium transition-all relative flex items-center gap-2",
                        activeTab === tab.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <tab.icon className={cn("h-3.5 w-3.5", activeTab === tab.id ? "text-foreground" : "text-muted-foreground")} />
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                </button>
            ))}
        </div>
    );
}
