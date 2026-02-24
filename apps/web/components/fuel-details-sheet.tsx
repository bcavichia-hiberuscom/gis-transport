"use client";

import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { DriverFuelSummary, FuelTransaction, Driver } from "@gis/shared";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
    Fuel, 
    AlertTriangle, 
    X, 
    MapPin, 
    History,
    Activity,
    ChevronRight,
    TrendingUp,
    CreditCard
} from "lucide-react";
import { FuelTrendChart } from "./analytics/fuel-trend-chart";
import { cn } from "@/lib/utils";
import { useDrivers } from "@/hooks/use-drivers";

interface FuelDetailsSheetProps {
    driverId: string | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
}

export function FuelDetailsSheet({
    driverId,
    isOpen,
    onOpenChange,
    onClose,
}: FuelDetailsSheetProps) {
    const [fuelSummary, setFuelSummary] = useState<DriverFuelSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const { drivers } = useDrivers();

    const driver = drivers?.find((d: Driver) => d.id === driverId);

    useEffect(() => {
        if (!driverId || !isOpen) return;

        const fetchFuelData = async () => {
            setLoading(true);
            try {
                const endDate = Date.now();
                const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
                const data = await fuelService.getDriverFuelSummary(driverId, startDate, endDate);
                setFuelSummary(data);
            } catch (error) {
                console.error("Failed to fetch driver fuel summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFuelData();
    }, [driverId, isOpen]);

    if (!driverId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="fixed inset-0 p-0 w-[1200px] max-w-[98vw] h-[850px] max-h-[92vh] m-auto border-none shadow-2xl bg-slate-50 overflow-hidden flex flex-col !translate-x-0 !translate-y-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Módulo de Auditoría: {driver?.name || driverId}</DialogTitle>
                </DialogHeader>

                {/* Top Control Bar */}
                <div className="shrink-0 bg-white border-b border-slate-100 h-20 px-8 flex items-center justify-between z-10">
                    <div className="flex items-center gap-5">
                        <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm relative overflow-hidden">
                            {driver?.imageUrl ? (
                                <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-slate-400 font-bold text-lg">{driver?.name?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight leading-none mb-1.5 tabular-nums">
                                {driver?.name || "Driver Reference"}
                            </h2>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                ID: {driverId}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <div className="shrink-0 bg-white border-b border-slate-100 h-10 px-8 flex items-center">
                            <TabsList className="bg-transparent h-full p-0 gap-8 rounded-none border-none">
                                <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent text-[11px] font-semibold uppercase tracking-wider px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                    Vista General
                                </TabsTrigger>
                                <TabsTrigger value="history" className="h-full rounded-none border-b-2 border-transparent text-[11px] font-semibold uppercase tracking-wider px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                    Historial Completo
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="h-full rounded-none border-b-2 border-transparent text-[11px] font-semibold uppercase tracking-wider px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none">
                                    Análisis Técnico
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden bg-slate-50">
                            <TabsContent value="overview" className="h-full m-0">
                               <ScrollArea className="h-full w-full">
                                   <div className="p-8 space-y-8">
                                       
                                       {/* Key Metrics */}
                                       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                           {[
                                               { label: "Consumo Total", value: `${fuelSummary?.totals.declaredLiters.toFixed(0)} L`, icon: Fuel },
                                               { label: "Varianza (%)", value: `${fuelSummary?.totals.discrepancyPercentage.toFixed(1)} %`, icon: AlertTriangle, status: fuelSummary?.totals.discrepancyPercentage! > 5 ? "error" : "success" },
                                               { label: "Costo Total", value: `$${fuelSummary?.totals.totalCost.toLocaleString()}`, icon: CreditCard },
                                               { label: "Eventos", value: `${fuelSummary?.totals.transactionCount}`, icon: History }
                                           ].map((kpi, i) => (
                                               <div key={i} className="kpi-card rounded-lg bg-white border border-slate-200">
                                                   <div className="flex items-center justify-between mb-4">
                                                        <div className={cn(
                                                            "h-8 w-8 flex items-center justify-center rounded bg-[#F7F8FA] border border-[#EAEAEA] text-[#6B7280]",
                                                            kpi.status === "error" && "text-red-500 bg-red-50 border-red-100"
                                                        )}>
                                                            <kpi.icon className="h-4 w-4" />
                                                        </div>
                                                   </div>
                                                   <div className="flex flex-col gap-0.5">
                                                       <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                                                       <span className={cn("text-[22px] font-semibold tabular-nums tracking-tight", kpi.status === "error" ? "text-red-600" : "text-slate-900")}>
                                                           {loading ? "..." : kpi.value}
                                                       </span>
                                                   </div>
                                               </div>
                                           ))}
                                       </div>

                                       <div className="grid grid-cols-12 gap-8 items-start">
                                           <div className="col-span-12 lg:col-span-8 space-y-6">
                                               <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
                                                   <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                                                       <div className="flex items-center gap-2.5">
                                                           <TrendingUp className="h-4 w-4 text-primary" />
                                                           <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-900">Histórico de Telemetría</h3>
                                                       </div>
                                                   </div>
                                                   <div className="p-6 h-[400px]">
                                                        <FuelTrendChart 
                                                            data={fuelSummary?.trendData || []} 
                                                        />
                                                   </div>
                                               </div>

                                               <div className="grid grid-cols-2 gap-6">
                                                   <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 p-6">
                                                       <h4 className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-4">Métricas de Rendimiento</h4>
                                                       <div className="space-y-4">
                                                           <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                               Desvío acumulado dentro del rango operativo establecido por la flota.
                                                           </p>
                                                           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                               <div className="h-full bg-primary w-[92%] transition-all" />
                                                           </div>
                                                       </div>
                                                   </div>
                                            
                                               </div>
                                           </div>

                                           <div className="col-span-12 lg:col-span-4 space-y-6">
                                               <div className="flex items-center justify-between px-1">
                                                   <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-900">Eventos Recientes</h3>
                                               </div>

                                               <div className="space-y-3">
                                                   {fuelSummary?.recentTransactions?.map((txn: FuelTransaction) => {
                                                       const isFlagged = txn.validation.status !== "compliant";
                                                       return (
                                                           <div key={txn.id} className={cn(
                                                               "p-4 rounded-xl transition-all ring-1 ring-slate-200/60 bg-white hover:ring-primary/40 group cursor-pointer",
                                                               isFlagged && "ring-2 ring-red-100 bg-red-50/10"
                                                           )}>
                                                               <div className="flex items-start justify-between mb-3">
                                                                   <div className="flex gap-3">
                                                                       <div className={cn(
                                                                           "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                                           isFlagged ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                                                       )}>
                                                                           <MapPin className="h-4 w-4" />
                                                                       </div>
                                                                       <div className="min-w-0">
                                                                           <h5 className="text-[12px] font-semibold text-slate-900 truncate tracking-tight">{txn.location.stationName || "Estación Local"}</h5>
                                                                           <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                                                               {new Date(txn.timestamp).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                                                                           </p>
                                                                       </div>
                                                                   </div>
                                                                   <Badge className={cn(
                                                                       "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border-none shadow-none",
                                                                       isFlagged ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                                                                   )}>
                                                                       {isFlagged ? "Alerta" : "Verificado"}
                                                                   </Badge>
                                                               </div>
                                                               <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                                                                   <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{txn.declared.liters}L</span>
                                                                   <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-primary transition-colors" />
                                                               </div>
                                                           </div>
                                                       );
                                                   })}
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               </ScrollArea>
                            </TabsContent>

                            <TabsContent value="history" className="h-full m-0">
                                <ScrollArea className="h-full w-full">
                                    <div className="p-8">
                                        <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Registro de Transacciones</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ubicación</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Volumen</th>
                                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {fuelSummary?.recentTransactions?.map((txn: FuelTransaction) => (
                                                            <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-[11px] font-semibold text-slate-900">
                                                                    {new Date(txn.timestamp).toLocaleString("es-ES", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td className="px-6 py-4 text-[11px] font-medium text-slate-600">
                                                                    {txn.location.stationName || "Estación Local"}
                                                                </td>
                                                                <td className="px-6 py-4 text-[11px] font-bold text-slate-900 tabular-nums">{txn.declared.liters} L</td>
                                                                <td className="px-6 py-4">
                                                                    <Badge className={cn(
                                                                        "text-[8px] font-bold uppercase tracking-widest border-none",
                                                                        txn.validation.status === "compliant" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                                    )}>
                                                                        {txn.validation.status}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="analytics" className="h-full m-0 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <Activity className="h-8 w-8 text-slate-200 mx-auto" />
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Módulo Predictivo</p>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Footer Operational Bar */}
                <div className="shrink-0 bg-white border-t border-slate-100 h-16 px-8 flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-6">
                        <div>Periodo: Últimos 30 Días</div>
                        <div className="h-4 w-px bg-slate-100" />
                        <div>Driver ID: {driverId}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-8 text-[10px] uppercase font-bold tracking-wider rounded-lg border-slate-200">Exportar</Button>
                        <Button onClick={onClose} className="h-8 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-slate-900 text-white">Cerrar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
