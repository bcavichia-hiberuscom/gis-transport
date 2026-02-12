"use client";

import { useState, useMemo } from "react";
import { Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Search, UserCheck, Users, ChevronRight, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AssignDriverDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    drivers: Driver[];
    onAssign: (driver: Driver) => void;
    vehicleLabel?: string;
}

export function AssignDriverDialog({
    open,
    onOpenChange,
    drivers,
    onAssign,
    vehicleLabel,
}: AssignDriverDialogProps) {
    const [search, setSearch] = useState("");
    const [selectedLicense, setSelectedLicense] = useState<string | null>(null);

    const availableDrivers = useMemo(() => {
        return drivers.filter((d) => d.isAvailable);
    }, [drivers]);

    // Extract unique license types for the filter
    const licenseTypes = useMemo(() => {
        const types = new Set<string>();
        availableDrivers.forEach(d => {
            if (d.licenseType) types.add(d.licenseType.toUpperCase());
        });
        return Array.from(types).sort();
    }, [availableDrivers]);

    const filteredDrivers = useMemo(() => {
        return availableDrivers.filter((d) => {
            const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
            const matchesLicense = !selectedLicense || d.licenseType?.toUpperCase() === selectedLicense;
            return matchesSearch && matchesLicense;
        });
    }, [availableDrivers, search, selectedLicense]);

    const handleSelect = (driver: Driver) => {
        onAssign(driver);
        onOpenChange(false);
        setSearch("");
        setSelectedLicense(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background">
                    <DialogHeader className="p-6 pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <UserCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    Asignar Operador
                                </DialogTitle>
                                <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">
                                    {vehicleLabel ? `Para: ${vehicleLabel}` : "Selección de Personal"}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            {/* Premium Search Bar */}
                            <div className="relative group/search">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none transition-colors group-focus-within/search:text-primary">
                                    <Search className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                                <Input
                                    placeholder="Buscar conductor por nombre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl text-sm font-medium"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* License Type Filters */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Filtrar por Licencia</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        onClick={() => setSelectedLicense(null)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                                            !selectedLicense
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                                        )}
                                    >
                                        Todos
                                    </button>
                                    {licenseTypes.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedLicense(type)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                                                selectedLicense === type
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                    : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                                            )}
                                        >
                                            Cat. {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="h-[380px] px-6 pb-6">
                        <div className="space-y-2">
                            {filteredDrivers.length > 0 ? (
                                filteredDrivers.map((driver) => (
                                    <button
                                        key={driver.id}
                                        onClick={() => handleSelect(driver)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-background border border-border/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-muted/20 border-2 border-background shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                                                {driver.imageUrl ? (
                                                    <img
                                                        src={driver.imageUrl}
                                                        alt={driver.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Users className="h-5 w-5 text-primary/30" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-foreground truncate">
                                                    {driver.name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary bg-primary/5 px-1.5 h-4">
                                                        {driver.licenseType || "Cat. B"}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground/30">•</span>
                                                    <span className="text-[10px] font-bold text-emerald-600">
                                                        {driver.onTimeDeliveryRate}% Score
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                    </button>
                                ))
                            ) : (
                                <div className="py-12 text-center bg-muted/5 rounded-[2rem] border border-dashed border-border/15">
                                    <div className="h-16 w-16 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-border/20">
                                        <Users className="h-6 w-6 text-muted-foreground/20" />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">
                                        {search || selectedLicense ? "No se encontraron coincidencias" : "No hay conductores disponibles"}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                                        {search || selectedLicense ? "Ajusta los filtros de búsqueda" : "Todos los conductores están asignados"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
