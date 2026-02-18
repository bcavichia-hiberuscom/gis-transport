"use client";

import React from "react";
import { Driver } from "@gis/shared";
import { cn } from "@/lib/utils";
import { ChevronRight, AlertCircle, CheckCircle2, TrendingUp, Users, Medal } from "lucide-react";

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
        <div className="bg-card p-8 flex flex-col gap-8 border-t border-border">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Analisis Comparativo</p>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                        Informe de Auditoria
                    </h3>
                </div>
            </div>

            {!hasDrivers ? (
                <div className="py-16 text-center bg-secondary rounded-lg border border-border">
                    <div className="h-10 w-10 bg-card border border-border rounded-md flex items-center justify-center mx-auto mb-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h4 className="text-xs font-medium text-foreground">Sincronizacion de Flota</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">Datos operativos pendientes</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* RISK AUDIT */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2.5 border-b border-foreground pb-2">
                            <AlertCircle className="h-4 w-4 text-foreground" />
                            <span className="text-xs font-medium text-foreground">Auditoria de Riesgo</span>
                        </div>

                        <div className="space-y-0.5 divide-y divide-border">
                            {lowPerformers.length > 0 ? lowPerformers.map((d) => (
                                <div
                                    key={`low-${d.id}`}
                                    onClick={() => onDriverSelect?.(d)}
                                    className="group flex items-center justify-between py-4 hover:bg-secondary/50 transition-all cursor-pointer px-2 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-secondary rounded-md flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                            {d.id.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-medium text-foreground leading-none group-hover:text-foreground transition-colors">
                                                {d.name}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <TrendingUp className="h-3 w-3 text-destructive rotate-180" />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(d.speedingEvents?.length || 0)} incidentes detectados
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-foreground tracking-tight leading-none">
                                                {d.onTimeDeliveryRate?.toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Eficiencia</div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 border border-border bg-secondary/50 rounded-lg text-center">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600/50 mx-auto mb-2" />
                                    <h4 className="text-xs font-medium text-foreground">Cumplimiento Completo</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1">Parametros dentro del rango nominal</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TOP PERFORMANCE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2.5 border-b border-border pb-2">
                            <Medal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Excelencia Operativa</span>
                        </div>

                        <div className="space-y-0.5 divide-y divide-border">
                            {topPerformers.length > 0 ? topPerformers.map((d) => (
                                <div
                                    key={`high-${d.id}`}
                                    onClick={() => onDriverSelect?.(d)}
                                    className="group flex items-center justify-between py-4 hover:bg-secondary/50 transition-all cursor-pointer px-2 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-secondary rounded-md flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                            {d.id.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-medium text-foreground leading-none group-hover:text-foreground transition-colors">
                                                {d.name}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-emerald-600 tracking-tight leading-none">
                                                {d.onTimeDeliveryRate?.toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Eficiencia</div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 border border-border bg-secondary/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Sin datos de referencia registrados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
