"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Fuel } from "lucide-react";

interface FuelTrendDataPoint {
    date: string;
    declared: number;
    expected: number;
    discrepancy: number;
}

interface FuelTrendChartProps {
    data: FuelTrendDataPoint[];
    className?: string;
    title?: string;
}

export function FuelTrendChart({ data, className, title = "Tendencia de Consumo" }: FuelTrendChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className={className}>
            <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-[#0047AB]" />
                        {title}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Volumen Facturado vs Sensor del Vehículo
                    </p>
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            No hay datos suficientes
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: "#64748b" }}
                                dy={12}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: "#64748b" }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    paddingBottom: '20px',
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="declared"
                                name="Facturado (L)"
                                stroke="#0f172a"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#0f172a", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={800}
                            />

                            <Line
                                type="monotone"
                                dataKey="expected"
                                name="Sensor (L)"
                                stroke="#0047AB"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={{ r: 3, fill: "#0047AB", strokeWidth: 1.5, stroke: "#fff" }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Unidad: Litros (L)
                </p>
            </div>
        </div>
    );
}
