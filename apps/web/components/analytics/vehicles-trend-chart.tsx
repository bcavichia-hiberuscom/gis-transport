"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const CHART_TOOLTIP_STYLE = {
    backgroundColor: "#fff",
    border: "1px solid #EAEAEA",
    borderRadius: "2px",
    fontSize: "10px",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    textTransform: "uppercase" as const,
    padding: "8px 12px",
};

interface VehiclesTrendChartProps {
    data: any[];
}

export function VehiclesTrendChart({ data }: VehiclesTrendChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <p className="chart-title">Histórico de Utilización</p>
                    <p className="chart-subtitle">Evolución de la disponibilidad media por periodo</p>
                </div>
            </div>

            <div className="h-[260px] w-full relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA]">
                        <p className="text-[10px] font-medium text-[#6B7280]/40 uppercase tracking-widest">Sin datos históricos</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUtilV" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4F04A" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#D4F04A" stopOpacity={0} />
                                </linearGradient>
                                <filter id="shadowUtil" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1C1C1C" floodOpacity="0.08" />
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
                            <Tooltip cursor={{ stroke: '#1C1C1C', strokeWidth: 1 }} contentStyle={CHART_TOOLTIP_STYLE} />
                            <ReferenceLine
                                y={85}
                                stroke="#D4F04A"
                                strokeDasharray="5 5"
                                label={{ position: 'right', value: 'OBJ', fill: '#5D6B1A', fontSize: 8, fontWeight: 600 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="utilization"
                                name="Utilización"
                                stroke="#1C1C1C"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorUtilV)"
                                animationDuration={800}
                                style={{ filter: "url(#shadowUtil)" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
