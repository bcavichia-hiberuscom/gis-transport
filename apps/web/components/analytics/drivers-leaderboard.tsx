"use client";

import React from "react";
import { Driver } from "@gis/shared";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, Medal, AlertCircle, CheckCircle2, TrendingUp, Users, ShieldCheck, Activity, Trophy } from "lucide-react";

interface LeaderboardProps {
    drivers: Driver[];
    onDriverSelect?: (driver: Driver) => void;
}

export function DriversLeaderboard({ drivers, onDriverSelect }: LeaderboardProps) {
    // Logic for High Performance (Top Rate)
    const sortedByRate = [...drivers].sort((a, b) => (b.onTimeDeliveryRate || 0) - (a.onTimeDeliveryRate || 0));
    const topPerformers = sortedByRate.slice(0, 5);

    const hasDrivers = drivers.length > 0;

    return (
        <div className="bg-white p-8 flex flex-col gap-8 animate-in fade-in duration-500">
            {!hasDrivers ? (
                <div className="py-20 text-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-lg">
                    <Users strokeWidth={1.25} className="h-10 w-10 text-[#6B7280]/20 mx-auto mb-4" />
                    <h4 className="text-[12px] font-medium text-[#1C1C1C] uppercase tracking-wider">Esperando datos operacionales</h4>
                    <p className="text-[10px] font-normal text-[#6B7280]/60 uppercase tracking-widest mt-1">Sincronización en curso...</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-[#EAEAEA]">
                        <div className="flex flex-col gap-0.5">
                            <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-3">
                                <Trophy strokeWidth={1.5} className="h-4 w-4" />
                                Operadores Elite
                            </h3>
                            <p className="text-[10px] font-normal text-[#6B7280] uppercase tracking-wider">
                                Métricas de cumplimiento y seguridad vial.
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-[#F7F8FA] border border-[#EAEAEA] rounded">
                            <span className="text-[10px] font-medium text-[#1C1C1C] uppercase tracking-wider">TOP 5</span>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex flex-col divide-y divide-[#EAEAEA]">
                        {topPerformers.map((d, i) => {
                            const speedingCount = d.speedingEvents?.length || 0;
                            const isExcellent = (d.onTimeDeliveryRate || 0) >= 95;
                            
                            return (
                                <div
                                    key={`top-${d.id}`}
                                    onClick={() => onDriverSelect?.(d)}
                                    className="group flex items-center justify-between py-5 px-4 hover:bg-[#F7F8FA] transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="h-10 w-10 bg-[#1C1C1C] text-[#D4F04A] flex items-center justify-center text-[13px] font-medium rounded">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-[14px] font-medium text-[#1C1C1C] group-hover:text-[#1C1C1C]">
                                                {d.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-medium text-[#6B7280]/40 uppercase">ID: {d.id.substring(0, 8)}</span>
                                                <div className="h-0.5 w-0.5 rounded-full bg-[#EAEAEA]" />
                                                <span className="text-[9px] font-medium text-[#6B7280]/60 uppercase bg-[#F7F8FA] px-1.5 rounded">Operador Senior</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="text-right min-w-[100px]">
                                            <div className={cn("text-base font-medium tabular-nums", isExcellent ? "text-[#1C1C1C]" : "text-[#1C1C1C]")}>
                                                {d.onTimeDeliveryRate?.toFixed(1)}%
                                            </div>
                                            <p className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-widest mt-0.5">
                                                Nivel SLA
                                            </p>
                                        </div>

                                        <div className="text-right min-w-[100px]">
                                            <div className={cn(
                                                "text-base font-medium tabular-nums",
                                                speedingCount > 2 ? "text-red-500" : "text-[#1C1C1C]"
                                            )}>
                                                {speedingCount}
                                            </div>
                                            <p className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-widest mt-0.5">
                                                Incidencias
                                            </p>
                                        </div>

                                        <ChevronRight strokeWidth={1.5} className="h-4 w-4 text-[#EAEAEA] group-hover:text-[#1C1C1C] group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
