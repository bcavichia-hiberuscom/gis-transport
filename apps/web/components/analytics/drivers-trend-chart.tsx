"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Activity, Target } from "lucide-react";

interface DriversTrendChartProps {
    data: any[];
}

export function DriversTrendChart({ data }: DriversTrendChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="p-10 border-r border-slate-100 bg-gradient-to-b from-white via-primary/3 to-white group rounded-lg">
            <div className="flex items-start justify-between mb-10">
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-sky-500" />
                        Histórico de Rendimiento
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Evolución de la Puntualidad Media por Periodo
                    </p>
                </div>

            </div>

            <div className="h-[280px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">Sin datos históricos suficientes</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#075985" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#075985" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(7,41,68,0.04)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }}
                                dy={12}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ stroke: '#0f172a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                    textTransform: 'uppercase'
                                }}
                            />
                            <ReferenceLine
                                y={95}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                label={{ position: 'right', value: 'OBJETIVO', fill: '#10b981', fontSize: 8, fontWeight: 900 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                name="Rendimiento"
                                stroke="#075985"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
