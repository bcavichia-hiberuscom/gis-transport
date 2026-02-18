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
    { id: "7d", label: "7 Dias" },
    { id: "30d", label: "30 Dias" },
    { id: "90d", label: "90 Dias" },
    { id: "year", label: "Este ano" },
];

export function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
    return (
        <div className="flex items-center gap-2 p-1 bg-secondary rounded-md border border-border">
            <div className="px-2 py-1 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Periodo</span>
            </div>
            <div className="flex items-center gap-0.5 ml-auto">
                {periods.map((period) => (
                    <button
                        key={period.id}
                        onClick={() => onPeriodChange(period.id)}
                        className={cn(
                            "px-2.5 py-1 text-[10px] font-medium rounded-md transition-all",
                            currentPeriod === period.id
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {period.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
