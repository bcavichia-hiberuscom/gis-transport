"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NavPanel } from "./nav-panel";
import { TopHeader } from "./top-header";

export type DashboardModule = "map" | "drivers";

interface DashboardProps {
    activeModule: DashboardModule;
    onModuleChange: (module: DashboardModule) => void;
    children: React.ReactNode;
}

export function Dashboard({ activeModule, onModuleChange, children }: DashboardProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Left Navigation Panel */}
            <NavPanel activeModule={activeModule} onModuleChange={onModuleChange} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
