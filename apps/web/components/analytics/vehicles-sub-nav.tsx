"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Layout, Truck, Wrench } from "lucide-react";

interface VehiclesSubNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
    { id: "overview", label: "Dashboard", icon: Layout },
    { id: "vehicles", label: "Inventario", icon: Truck },
    { id: "maintenance", label: "Taller", icon: Wrench },
];

export function VehiclesSubNav({ activeTab, onTabChange }: VehiclesSubNavProps) {
  return (
    <div className="flex items-center gap-10 px-10 border-b border-[#EAEAEA] bg-white shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
                "py-4 text-[11px] font-medium uppercase tracking-wider transition-all relative flex items-center gap-2",
                isActive
                    ? "text-[#1C1C1C]"
                    : "text-[#6B7280] hover:text-[#1C1C1C]"
            )}
          >
            <tab.icon strokeWidth={isActive ? 2 : 1.5} className={cn("h-4 w-4 transition-all", isActive ? "text-[#1C1C1C] scale-110" : "text-[#6B7280]/60")} />
            {tab.label}
            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1C1C1C] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
