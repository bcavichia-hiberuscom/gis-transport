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
        <div className="chart-container">
            <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col gap-0.5">
                    <p className="chart-title">Calidad de Servicio</p>
                    <p className="chart-subtitle">Evolución histórica del rendimiento operacional.</p>
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
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4F04A" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#D4F04A" stopOpacity={0.05} />
                                </linearGradient>
                                <filter id="shadowScore" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D4F04A" floodOpacity="0.3" />
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
                                domain={[0, 100]}
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
                                y={95}
                                stroke="#D4F04A"
                                strokeDasharray="5 5"
                                label={{ position: 'right', value: 'TARGET', fill: '#5D6B1A', fontSize: 8, fontWeight: 500 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                name="Score"
                                stroke="#1C1C1C"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                animationDuration={1000}
                                style={{ filter: "url(#shadowScore)" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
