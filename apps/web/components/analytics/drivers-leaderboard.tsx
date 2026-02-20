"use client";

import React from "react";
import { Driver } from "@gis/shared";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, Medal, AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";

interface LeaderboardProps {
    drivers: Driver[];
    onDriverSelect?: (driver: Driver) => void;
}

export function DriversLeaderboard({ drivers, onDriverSelect }: LeaderboardProps) {
    const sortedDriversByRate = [...drivers]
        .sort((a, b) => (b.onTimeDeliveryRate || 0) - (a.onTimeDeliveryRate || 0));

    const topPerformers = sortedDriversByRate.slice(0, 5);
    const potentialLowPerformers = sortedDriversByRate.filter(d => (d.onTimeDeliveryRate || 0) < 100);
    const finalLowPerformersList = potentialLowPerformers.filter(d => !topPerformers.find(t => t.id === d.id));
    const lowPerformers = [...finalLowPerformersList].reverse().slice(0, 5);

    const hasDrivers = drivers.length > 0;

    return (
        <div className="bg-white p-10 flex flex-col gap-12 border-t border-slate-100">

            {!hasDrivers ? (
                <div className="py-24 text-center bg-slate-50/10 border border-dashed border-slate-100 rounded-xl">
                    <div className="h-12 w-12 border border-slate-200 flex items-center justify-center mx-auto mb-4 bg-white rounded-lg">
                        <Users className="h-5 w-5 text-slate-300" />
                    </div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Sincronización de Flota</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-1 italic">Esperando inyección de datos operacionales</p>
                </div>
            ) : (
                // If there are no low performers, only show the Top Performance section full-width
                lowPerformers.length === 0 ? (
                    <div className="space-y-10">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Medal className="h-4 w-4 text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Excelencia en Servicio</span>
                        </div>

                        <div className="space-y-1 divide-y divide-slate-50">
                            {topPerformers.length > 0 ? topPerformers.map((d) => (
                                <div
                                    key={`high-${d.id}`}
                                    onClick={() => onDriverSelect?.(d)}
                                    className="group flex items-center justify-between py-5 hover:bg-slate-50/50 transition-all cursor-pointer px-2"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="h-10 w-10 border border-slate-100 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-400 italic">
                                            {d.id.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">
                                                {d.name}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-xl font-black italic text-emerald-600 tracking-tighter leading-none">
                                                {d.onTimeDeliveryRate?.toFixed(0)}%
                                            </div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Eficiencia</div>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 border border-slate-100 bg-slate-50/30 text-center">
                                    <p className="text-[10px] font-bold text-slate-300 uppercase italic">No top data benchmarks recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        {/* RISK AUDIT */}
                        <div className="space-y-10">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-rose-500" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Auditoría de Riesgo</span>
                                </div>
                            </div>

                            <div className="space-y-1 divide-y divide-slate-50">
                                {lowPerformers.length > 0 ? lowPerformers.map((d) => (
                                    <div
                                        key={`low-${d.id}`}
                                        onClick={() => onDriverSelect?.(d)}
                                        className="group flex items-center justify-between py-5 hover:bg-slate-50/50 transition-all cursor-pointer px-2"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-10 w-10 border border-slate-200 bg-white flex items-center justify-center text-[11px] font-black text-slate-900 italic">
                                                {d.id.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">
                                                    {d.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <TrendingUp className="h-3 w-3 text-rose-500 rotate-180" />
                                                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest italic">
                                                        {(d.speedingEvents?.length || 0)} Incidencias Detectadas
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-xl font-black italic text-slate-900 tracking-tighter leading-none">
                                                    {d.onTimeDeliveryRate?.toFixed(0)}%
                                                </div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Eficiencia</div>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 border border-emerald-100 bg-emerald-50/10 text-center rounded-xl border-dashed">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-4 opacity-40" />
                                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Conformidad Total</h4>
                                        <p className="text-[9px] font-bold text-emerald-600/50 uppercase mt-1 italic">Parámetros operativos dentro del rango nominal</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TOP PERFORMANCE */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <Medal className="h-4 w-4 text-emerald-500" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Excelencia en Servicio</span>
                            </div>

                            <div className="space-y-1 divide-y divide-slate-50">
                                {topPerformers.length > 0 ? topPerformers.map((d) => (
                                    <div
                                        key={`high-${d.id}`}
                                        onClick={() => onDriverSelect?.(d)}
                                        className="group flex items-center justify-between py-5 hover:bg-slate-50/50 transition-all cursor-pointer px-2"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-10 w-10 border border-slate-100 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-400 italic">
                                                {d.id.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">
                                                    {d.name}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-xl font-black italic text-emerald-600 tracking-tighter leading-none">
                                                    {d.onTimeDeliveryRate?.toFixed(0)}%
                                                </div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Eficiencia</div>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 border border-slate-100 bg-slate-50/30 text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">No top data benchmarks recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
