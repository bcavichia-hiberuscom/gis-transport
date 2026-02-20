"use client";

import { useState, useMemo } from "react";
import { Gauge, Zap, AlertTriangle, Activity, Fuel, TrendingUp, Medal, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

interface VehicleLeaderboardItem {
  id: string | number;
  label: string;
  value: number;
  mileage?: number;
  metric: "consumption" | "health" | "utilization" | "maintenance";
  status?: "good" | "warning" | "critical";
}

interface VehiclesLeaderboardProps {
  vehicles?: VehicleLeaderboardItem[];
  trendData?: any[];
  title?: string;
  subtitle?: string;
}

const defaultVehicles: VehicleLeaderboardItem[] = [
  { id: "vh-001", label: "MAD-1001", value: 7.2, mileage: 12500, metric: "consumption", status: "good" },
  { id: "vh-002", label: "MAD-1002", value: 8.5, mileage: 8400, metric: "consumption", status: "warning" },
  { id: "vh-003", label: "MAD-1003", value: 22.5, mileage: 15600, metric: "consumption", status: "critical" },
  { id: "vh-004", label: "MAD-1004", value: 6.8, mileage: 2100, metric: "consumption", status: "good" },
  { id: "vh-005", label: "MAD-1005", value: 10.2, mileage: 500, metric: "consumption", status: "warning" },
];

const defaultTrendData = [
  { name: "Lun", consumption: 7.8, goal: 7.5 },
  { name: "Mar", consumption: 8.2, goal: 7.5 },
  { name: "Mie", consumption: 7.4, goal: 7.5 },
  { name: "Jue", consumption: 9.1, goal: 7.5 },
  { name: "Vie", consumption: 8.5, goal: 7.5 },
  { name: "Sab", consumption: 7.9, goal: 7.5 },
  { name: "Dom", consumption: 7.2, goal: 7.5 },
];

export function VehiclesLeaderboard({
  vehicles = defaultVehicles,
  trendData = defaultTrendData,
  title = "Rendimiento de Vehículos",
  subtitle = "Top consumo de combustible",
}: VehiclesLeaderboardProps) {
  const [riskThreshold, setRiskThreshold] = useState(15);
  const [excellenceMinKm, setExcellenceMinKm] = useState(5000);

  const riskVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => v.value >= riskThreshold)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [vehicles, riskThreshold]);

  const excellenceVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => (v.mileage || 0) >= excellenceMinKm)
      .filter(v => !riskVehicles.some(r => r.id === v.id))
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);
  }, [vehicles, excellenceMinKm, riskVehicles]);

  const hasTrendData = trendData && trendData.length > 0;

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "consumption":
        return <Zap className="h-3 w-3" />;
      case "health":
        return <Gauge className="h-3 w-3" />;
      case "maintenance":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Gauge className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "bg-emerald-50 border-emerald-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "critical":
        return "bg-rose-50 border-rose-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case "good":
        return "text-emerald-700";
      case "warning":
        return "text-amber-700";
      case "critical":
        return "text-rose-700";
      default:
        return "text-slate-700";
    }
  };

  return (
    <div className="bg-white border-t border-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-100">
        {/* Lado Izquierdo: Gráfico de Tendencia */}
        <div className="p-8 sm:p-10 bg-gradient-to-b from-white via-primary/3 to-white group">
          <div className="flex flex-col gap-1.5 mb-10">
            <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              Tendencia de Consumo
            </h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Evolución del Consumo Medio L/100KM
            </p>
          </div>

          <div className="h-[280px] w-full relative">
            {!hasTrendData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-100 rounded-xl">
                <p className="text-[10px] font-bold text-slate-300 uppercase italic">Sin datos históricos suficientes</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
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
                    domain={['auto', 'auto']}
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
                    y={7.5}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ position: 'right', value: 'OPTIMAL', fill: '#10b981', fontSize: 8, fontWeight: 900 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption"
                    name="Consumo"
                    stroke="#075985"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorConsumo)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lado Derecho: Auditoría Dual con Filtros Locales */}
        <div className="p-8 sm:p-10 flex flex-col gap-12 bg-white">
          {/* SECCIÓN RIESGO */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-900 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Activos en Riesgo</span>
                </div>
                <span className="text-[9px] font-black text-rose-500 uppercase italic tracking-tighter">Anomalía Crítica</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Umbral Auditoría:</span>
                <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-lg border border-slate-100">
                  {[10, 15, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRiskThreshold(val)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all italic tracking-tighter",
                        riskThreshold === val
                          ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                          : "text-slate-400 hover:text-slate-600 hover:bg-white"
                      )}
                    >
                      {`>${val}L`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 divide-y divide-slate-50">
              {riskVehicles.length > 0 ? riskVehicles.map((v) => (
                <div
                  key={`risk-${v.id}`}
                  className="group flex items-center justify-between py-4 hover:bg-slate-50/50 transition-all cursor-pointer px-2 rounded-lg"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 border border-slate-200 bg-white shadow-sm flex items-center justify-center text-[11px] font-black text-slate-900 italic rounded-md">
                      {v.label.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-rose-600 transition-colors">
                        {v.label}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-rose-500" />
                          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Ver ficha</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase">{(v.mileage || 0).toLocaleString()} KM</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black italic text-slate-900 tracking-tighter leading-none">
                      {v.value.toFixed(1)}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">L/100KM</div>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center bg-slate-50/30 border border-dashed border-slate-100 rounded-xl">
                  <p className="text-slate-300 text-[9px] font-bold uppercase italic">Sin anomalías por encima del umbral seleccionado</p>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN EXCELENCIA */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Medal className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Excelencia en Eficiencia</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 uppercase italic tracking-tighter">High Performance</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referencia Uso:</span>
                <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-lg border border-slate-100">
                  {[0, 5000, 10000, 50000].map((km) => (
                    <button
                      key={km}
                      onClick={() => setExcellenceMinKm(km)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all italic tracking-tighter",
                        excellenceMinKm === km
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                          : "text-slate-400 hover:text-slate-600 hover:bg-white"
                      )}
                    >
                      {km === 0 ? 'ALL' : `>${(km / 1000).toFixed(0)}K`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 divide-y divide-slate-50">
              {excellenceVehicles.length > 0 ? excellenceVehicles.map((v) => (
                <div
                  key={`top-${v.id}`}
                  className="group flex items-center justify-between py-4 hover:bg-slate-50/50 transition-all cursor-pointer px-2 rounded-lg"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 border border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 italic rounded-md">
                      {v.label.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-emerald-600 transition-colors">
                        {v.label}
                      </h4>
                      <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 block">{(v.mileage || 0).toLocaleString()} KM</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black italic text-emerald-600 tracking-tighter leading-none">
                      {v.value.toFixed(1)}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">L/100KM</div>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center bg-slate-50/30 border border-dashed border-slate-100 rounded-xl">
                  <p className="text-slate-300 text-[9px] font-bold uppercase italic">No hay suficientes datos de uso para certificar excelencia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
