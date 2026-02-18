"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Zap, CheckCircle2 } from "lucide-react";

interface DriversFactorsChartProps {
    data: any[];
}

export function DriversFactorsChart({ data }: DriversFactorsChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="p-6 bg-card group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-medium text-foreground flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        Distribucion de Incidencias
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Frecuencia de factores criticos en el periodo
                    </p>
                </div>
            </div>

            <div className="h-[260px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary border border-dashed border-border rounded-md">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600/40 mb-2" />
                        <h4 className="text-xs font-medium text-foreground">Estado Nominal</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Sin factores de riesgo detectados</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.92 0.004 250)" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={120}
                                tick={{ fontSize: 10, fontWeight: 500, fill: "oklch(0.50 0.01 250)", width: 100 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'oklch(0.955 0.004 250)' }}
                                contentStyle={{
                                    backgroundColor: "oklch(1 0 0)",
                                    border: "1px solid oklch(0.92 0.004 250)",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                            />
                            <Bar
                                dataKey="impact"
                                name="Eventos"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                animationDuration={1000}
                                label={{ position: 'right', fill: 'oklch(0.23 0.02 250)', fontSize: 10, fontWeight: 500, formatter: (val: number) => `${val}` }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || "oklch(0.23 0.02 250)"} fillOpacity={1 - (index * 0.12)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
