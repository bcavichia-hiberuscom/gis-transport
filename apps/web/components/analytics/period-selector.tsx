"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimePeriod = "7d" | "30d" | "90d" | "year";

interface PeriodSelectorProps {
    currentPeriod: TimePeriod;
    onPeriodChange: (period: TimePeriod) => void;
}

const periods: { id: TimePeriod; label: string }[] = [
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "year", label: "YTD" },
];

export function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
    return (
        <div className="flex items-center gap-2 p-1 bg-[#F7F8FA] rounded-md border border-[#EAEAEA]">
            <div className="px-2 py-1 flex items-center gap-2 ml-1">
                <Calendar strokeWidth={1.5} className="h-3.5 w-3.5 text-[#6B7280]/60" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Período</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
                {periods.map((period) => {
                    const isActive = currentPeriod === period.id;
                    return (
                        <button
                            key={period.id}
                            onClick={() => onPeriodChange(period.id)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all",
                                isActive
                                    ? "bg-[#1C1C1C] text-white shadow-sm"
                                    : "text-[#6B7280] hover:text-[#1C1C1C] hover:bg-white"
                            )}
                        >
                            {period.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
