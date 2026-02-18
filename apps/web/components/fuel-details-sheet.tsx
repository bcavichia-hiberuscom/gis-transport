"use client";

import { useEffect, useState } from "react";
import { fuelService } from "@/lib/services/fuel-service";
import type { DriverFuelSummary, FuelTransaction, Driver } from "@gis/shared";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, AlertTriangle, ArrowLeft, Calendar, MapPin, CreditCard, ExternalLink, Info } from "lucide-react";
import { FuelDiscrepancyChart } from "./analytics/fuel-discrepancy-chart";
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
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="p-0 sm:max-w-[550px] border-l-0 shadow-2xl flex flex-col h-full bg-slate-50">
                <SheetHeader className="sr-only">
                    <SheetTitle>Detalles de Combustible - {driver?.name || driverId}</SheetTitle>
                </SheetHeader>

                {/* Header */}
                <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                    Detalles de Combustible
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    Análisis de Discrepancias
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-[#0047AB] text-white">Últimos 30 días</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl overflow-hidden border border-slate-200">
                            {driver?.imageUrl ? (
                                <img src={driver.imageUrl} alt={driver.name} className="h-full w-full object-cover" />
                            ) : (
                                driver?.name?.charAt(0) || "D"
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                {driver?.name || "Conductor"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">ID: {driverId}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-[#0047AB] rounded-full mx-auto" />
                                <p className="text-sm text-slate-500 mt-4 font-bold uppercase tracking-widest">
                                    Analizando transacciones...
                                </p>
                            </div>
                        ) : fuelSummary ? (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Fuel className="h-3 w-3 text-[#0047AB]" /> Consumo Total
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {fuelSummary.totals.declaredLiters.toFixed(0)}L
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                                            {fuelSummary.totals.transactionCount} TRANSACCIONES
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "border rounded-xl p-4 shadow-sm",
                                        fuelSummary.totals.discrepancyPercentage > 5
                                            ? "bg-rose-50 border-rose-100"
                                            : "bg-white border-slate-200"
                                    )}>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertTriangle className={cn("h-3 w-3", fuelSummary.totals.discrepancyPercentage > 5 ? "text-rose-500" : "text-[#0047AB]")} /> Desviación
                                        </div>
                                        <div className={cn(
                                            "text-2xl font-bold",
                                            fuelSummary.totals.discrepancyPercentage > 5 ? "text-rose-600" : "text-slate-900"
                                        )}>
                                            {fuelSummary.totals.discrepancyPercentage.toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                            {fuelSummary.totals.discrepancyLiters.toFixed(1)}L DE EXCESO
                                        </div>
                                    </div>
                                </div>

                                {/* Trend Chart Section */}
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <FuelTrendChart
                                        data={fuelSummary.trendData || []}
                                        title={`Tendencia de Consumo: ${driver?.name || 'Conductor'}`}
                                    />
                                </div>

                                {/* Transactions Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-[#0047AB]" /> Historial de Transacciones
                                    </h3>

                                    <div className="space-y-6">
                                        {fuelSummary?.recentTransactions?.map((txn: FuelTransaction) => {
                                            const isFlagged = txn.validation.status !== "compliant";
                                            return (
                                                <div key={txn.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                                                    {/* Cabecera resumida */}
                                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#0047AB]">
                                                                <MapPin className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                                                    {txn.location.stationName || txn.location.stationBrand || "Estación de Combustible"}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                                                                    {new Date(txn.timestamp).toLocaleString("es-ES", {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit"
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={isFlagged ? "destructive" : "default"} className="text-[10px] font-bold uppercase tracking-tight">
                                                            {isFlagged ? "Flagged / Alerta" : "Validada"}
                                                        </Badge>
                                                    </div>

                                                    <div className="p-5 space-y-6">
                                                        {/* Alerta de Discrepancia (si aplica) */}
                                                        {isFlagged && (
                                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5">
                                                                <div className="flex gap-4">
                                                                    <div className="shrink-0 h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                                                        <AlertTriangle className="h-5 w-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-sm font-bold text-slate-900">
                                                                            Inconsistencia de volumen detectada
                                                                        </h5>
                                                                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                                                            Se declararon <strong>{txn.declared.liters} L</strong>, pero el sensor solo registró un aumento de <strong>{((txn.calculated.tankLevelAfter ?? 0) - (txn.calculated.tankLevelBefore ?? 0)).toFixed(1)} L</strong>.
                                                                            {((txn.calculated.tankLevelBefore ?? 0) + txn.declared.liters) > 100 && (
                                                                                <span className="block mt-1 text-rose-500 font-bold">
                                                                                    ⚠ El volumen total declarado ({(txn.calculated.tankLevelBefore ?? 0) + txn.declared.liters}L) supera la capacidad del tanque.
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                        <div className="flex items-center gap-4 mt-3">
                                                                            <button className="text-[10px] font-bold text-[#0047AB] uppercase hover:underline flex items-center gap-1">
                                                                                Historial del vehículo <ExternalLink className="h-3 w-3" />
                                                                            </button>
                                                                            <button className="text-[10px] font-bold text-rose-600 uppercase hover:underline">
                                                                                Bloquear tarjeta
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Gráfico de Análisis */}
                                                                <FuelDiscrepancyChart
                                                                    tankCapacity={100}
                                                                    before={txn.calculated.tankLevelBefore || 0}
                                                                    declared={txn.declared.liters}
                                                                    expected={txn.calculated.expectedLiters}
                                                                    after={txn.calculated.tankLevelAfter || 0}
                                                                    discrepancy={txn.validation.discrepancyLiters}
                                                                    status={txn.validation.status}
                                                                    unit="L"
                                                                />

                                                                <div className="flex gap-3 pt-2">
                                                                    <Button size="sm" className="bg-[#0047AB] hover:bg-blue-800 text-white font-bold text-[10px] uppercase h-9 px-6">
                                                                        Validar Transacción
                                                                    </Button>
                                                                    <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase h-9 px-6 text-slate-500">
                                                                        Descartar Alerta
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Datos de la Operación */}
                                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Volumen Declarado</span>
                                                                <span className="text-sm font-bold text-slate-900 italic tracking-tight">{txn.declared.liters} L</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Volumen Esperado</span>
                                                                <span className="text-sm font-bold text-slate-900 italic tracking-tight">{txn.calculated.expectedLiters} L</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Coste Total</span>
                                                                <span className="text-sm font-bold text-[#0047AB] italic tracking-tight">${txn.declared.totalCost.toFixed(2)}</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Método de Pago</span>
                                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 italic tracking-tight">
                                                                    <CreditCard className="h-3 w-3 text-slate-400" />
                                                                    <span>VISA **** 4412</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Detalle adicional */}
                                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                <Info className="h-3 w-3 text-slate-300" />
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Id Vehículo: {txn.vehicleId}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recibo:</span>
                                                                <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">{txn.declared.receiptNumber || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-20 text-center">
                                <p className="text-sm text-slate-500">No se encontraron datos de combustible.</p>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
