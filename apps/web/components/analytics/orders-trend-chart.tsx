"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

interface OrdersTrendChartProps {
    data: any[];
}

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col gap-0.5">
                    <p className="chart-title">Métricas de Demanda</p>
                    <p className="chart-subtitle">Evolución histórica de órdenes y cumplimiento.</p>
                </div>
            </div>

            <div className="h-[260px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-md">
                        <p className="text-[10px] font-medium text-[#6B7280]/40 uppercase tracking-widest">Sin datos disponibles</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4F04A" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="#D4F04A" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6B7280" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6B7280" stopOpacity={0.05} />
                                </linearGradient>
                                <filter id="shadowCompleted" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D4F04A" floodOpacity="0.4" />
                                </filter>
                                <filter id="shadowPending" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1C1C1C" floodOpacity="0.1" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }}
                            />
                            <Tooltip
                                cursor={{ stroke: '#1C1C1C', strokeWidth: 1 }}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #EAEAEA",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "500",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    textTransform: 'uppercase'
                                }}
                            />
                            <ReferenceLine
                                y={10}
                                stroke="#D4F04A"
                                strokeDasharray="5 5"
                                label={{ position: 'right', value: 'TARGET', fill: '#5D6B1A', fontSize: 8, fontWeight: 500 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                name="Completadas"
                                stroke="#1C1C1C"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorCompleted)"
                                animationDuration={1000}
                                style={{ filter: "url(#shadowCompleted)" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="pending"
                                name="Pendientes"
                                stroke="#6B7280"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPending)"
                                animationDuration={1000}
                                style={{ filter: "url(#shadowPending)" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
