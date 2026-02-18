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
    { id: "7d", label: "7 Días" },
    { id: "30d", label: "30 Días" },
    { id: "90d", label: "90 Días" },
    { id: "year", label: "Este año" },
];

export function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-slate-100/50 rounded-xl border border-slate-100/40">
            <div className="px-2 py-1 flex items-center gap-1.5 ml-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Período</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
                {periods.map((period) => (
                    <button
                        key={period.id}
                        onClick={() => onPeriodChange(period.id)}
                        className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all",
                            currentPeriod === period.id
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/30"
                        )}
                    >
                        {period.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
