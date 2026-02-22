"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

import { RouteNotice, RouteData } from "@/lib/types";

export interface RouteError {
    vehicleId: string;
    errorMessage: string;
}

interface RouteErrorAlertProps {
    errors: RouteError[];
    notices?: RouteNotice[];
    onClear: () => void;
}

export function RouteErrorAlert({ errors = [], notices = [], onClear }: RouteErrorAlertProps) {
    const hasData = (errors && errors.length > 0) || (notices && notices.length > 0);

    if (!hasData) return null;

    const isGlobalFailure = errors.length > 0;

    return (
        <Dialog open={hasData} onOpenChange={(open) => !open && onClear()}>
            <DialogContent className="max-w-sm p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-muted/30 via-background to-background p-5">
                    <DialogHeader className="mb-4">
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className={`p-1.5 rounded-lg ${isGlobalFailure ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                                {isGlobalFailure ? (
                                    <ShieldAlert className="h-4 w-4 text-red-600" />
                                ) : (
                                    <Info className="h-4 w-4 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold tracking-tight">
                                    {isGlobalFailure ? "Resultados" : "Información"}
                                </DialogTitle>
                                <DialogDescription className="text-[8px] uppercase tracking-wider font-medium text-muted-foreground/50">
                                    Reporte de optimización
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {/* Errors Section */}
                        {errors.map((error, idx) => (
                            <div key={`err-${idx}`} className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600/80">
                                        {error.vehicleId === "Unassigned" ? "No asignado" : `Vehículo ${error.vehicleId}`}
                                    </span>
                                </div>
                                <p className="text-xs text-foreground/75 leading-relaxed pl-5">
                                    {error.errorMessage}
                                </p>
                            </div>
                        ))}

                        {/* Notices Section */}
                        {notices.map((notice, idx) => (
                            <div key={`note-${idx}`} className={`p-3 rounded-lg border space-y-0.5 ${notice.type === 'warning' ? 'border-amber-500/15 bg-amber-500/5' :
                                notice.type === 'success' ? 'border-emerald-500/15 bg-emerald-500/5' :
                                    'border-primary/10 bg-primary/5'
                                }`}>
                                <div className="flex items-center gap-1.5">
                                    {notice.type === 'warning' ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> :
                                        notice.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> :
                                            <Info className="h-3.5 w-3.5 text-primary/60" />}
                                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${notice.type === 'warning' ? 'text-amber-600/80' :
                                        notice.type === 'success' ? 'text-emerald-600/80' :
                                            'text-primary/60'
                                        }`}>
                                        {notice.title}
                                    </span>
                                </div>
                                <p className="text-xs text-foreground/75 leading-relaxed pl-5">
                                    {notice.message}
                                </p>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="mt-5">
                        <Button
                            onClick={onClear}
                            className="w-full h-9 font-semibold shadow-md transition-all text-sm"
                        >
                            Entendido
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
