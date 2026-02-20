"use client";

import { cn } from "@/lib/utils";
import { Fuel, AlertTriangle } from "lucide-react";

interface FuelDiscrepancyChartProps {
    tankCapacity: number;
    before: number;
    declared: number;
    expected: number;
    after: number;
    discrepancy: number;
    unit?: string;
    status: "compliant" | "review" | "flagged" | "approved" | "rejected";
    className?: string;
}

export function FuelDiscrepancyChart({
    tankCapacity,
    before,
    declared,
    expected,
    after,
    discrepancy,
    unit = "L",
    status,
    className,
}: FuelDiscrepancyChartProps) {
    const displayUnit = unit === "GAL" ? "L" : unit;
    const finalTeorico = before + declared;
    const scaleMax = Math.max(tankCapacity * 1.15, finalTeorico, after);
    const getPercent = (val: number) => (val / scaleMax) * 100;

    const isHighDiscrepancy = finalTeorico > after;

    return (
        <div className={cn("bg-gradient-to-b from-white via-primary/3 to-white border border-slate-100 rounded-lg p-6", className)}>
            <div className="space-y-8">
                {/* Cabecera Sober */}
                <div>
                    <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-[#0047AB]" />
                        Diagnóstico de Carga Individual
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Análisis puntual de entrada vs capacidad
                    </p>
                </div>

                {/* Barras de Nivel */}
                <div className="space-y-6">
                    {/* NIVEL PREVIO */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-400">Nivel Previo al Repostaje</span>
                            <span className="text-slate-900">{before.toFixed(0)} {displayUnit}</span>
                        </div>
                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div
                                className="h-full bg-slate-400 transition-all duration-1000"
                                style={{ width: `${getPercent(before)}%` }}
                            />
                        </div>
                    </div>

                    {/* LECTURA SENSOR */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-400">Lectura de Sensor (Real)</span>
                            <div className="flex items-center gap-3">
                                {isHighDiscrepancy && (
                                    <span className="text-rose-600">
                                        -{(finalTeorico - after).toFixed(0)} {displayUnit} DISCREPANCIA
                                    </span>
                                )}
                                <span className="text-slate-900 font-black">{after.toFixed(0)} {displayUnit}</span>
                            </div>
                        </div>
                        <div className="relative h-7 flex items-stretch">
                            <div
                                className="h-full bg-[#0047AB] rounded-l-md transition-all duration-1000"
                                style={{ width: `${getPercent(after)}%` }}
                            />
                            {isHighDiscrepancy && (
                                <div
                                    className="h-full bg-rose-50 border-y border-r border-rose-500 border-dashed rounded-r-md flex items-center justify-center min-w-[4px]"
                                    style={{ width: `${getPercent(finalTeorico - after)}%` }}
                                >
                                    <AlertTriangle className="h-3 w-3 text-rose-500 opacity-30" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Escala de Referencia (Fix Overlaps) */}
                <div className="relative h-16 border-t border-slate-100 pt-4">
                    {/* Marca de CAPACIDAD */}
                    <div className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${getPercent(tankCapacity)}%`, transform: 'translateX(-50%)' }}>
                        <div className="h-2.5 w-px bg-slate-300" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Capacidad Máx.</span>
                        <span className="text-[9px] font-black text-slate-900">{tankCapacity}L</span>
                    </div>

                    {/* Marca de DECLARADO */}
                    <div className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${getPercent(finalTeorico)}%`, transform: 'translateX(-50%)' }}>
                        <div className="h-4 w-0.5 bg-rose-500" />
                        <span className="text-[8px] font-bold text-rose-500 uppercase mt-1">Total Declarado</span>
                        <span className="text-[9px] font-black text-rose-600 italic">{finalTeorico}L</span>
                    </div>

                </div>

                {/* Leyenda Simple */}
                <div className="flex items-center gap-5 pt-2 border-t border-slate-50 mt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 bg-[#0047AB] rounded-full" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Datos Sensor OK</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 bg-rose-50 border border-rose-500 border-dashed rounded-sm" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Inconsistencia</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
