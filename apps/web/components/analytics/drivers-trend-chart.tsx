"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";

interface DriversTrendChartProps {
    data: any[];
}

export function DriversTrendChart({ data }: DriversTrendChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="p-6 border-r border-border bg-card group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-medium text-foreground flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        Historico de Rendimiento
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Evolucion de la puntualidad media por periodo
                    </p>
                </div>
            </div>

            <div className="h-[260px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary border border-dashed border-border rounded-md">
                        <p className="text-xs text-muted-foreground">Sin datos historicos suficientes</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.23 0.02 250)" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="oklch(0.23 0.02 250)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 500, fill: "oklch(0.50 0.01 250)" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 500, fill: "oklch(0.50 0.01 250)" }}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ stroke: 'oklch(0.23 0.02 250)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: "oklch(1 0 0)",
                                    border: "1px solid oklch(0.92 0.004 250)",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                            />
                            <ReferenceLine
                                y={95}
                                stroke="oklch(0.55 0.15 160)"
                                strokeDasharray="3 3"
                                label={{ position: 'right', value: 'Objetivo', fill: 'oklch(0.55 0.15 160)', fontSize: 10, fontWeight: 500 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                name="Rendimiento"
                                stroke="oklch(0.23 0.02 250)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                animationDuration={1200}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
