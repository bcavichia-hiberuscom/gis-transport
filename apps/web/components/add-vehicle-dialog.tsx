"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FleetVehicle } from "@gis/shared";
import { Loader2, Truck, X } from "lucide-react";

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (vehicle: Partial<FleetVehicle>) => Promise<void>;
  isLoading: boolean;
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddVehicleDialogProps) {
  const [label, setLabel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "label") {
      setLabel(value);
    } else if (name === "licensePlate") {
      setLicensePlate(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!label.trim() || !licensePlate.trim()) {
      return;
    }

    try {
      await onSubmit({
        label: label.trim(),
        licensePlate: licensePlate.trim(),
        position: [40.4233, -3.7121], // Default position (Madrid)
        type: { id: "noLabel", label: "General", tags: [], vroomType: "car" }
      });
      setLabel("");
      setLicensePlate("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] rounded-md border border-[#EAEAEA] flex items-center justify-center">
              <Truck strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">Registrar Unidad</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">Gestión de Activos Críticos</DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="label" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Identificador del Vehículo</Label>
              <Input
                id="label"
                name="label"
                placeholder="Ej. MAD-204, VOLVO FH..."
                value={label}
                onChange={handleInputChange}
                required
                className="h-10 text-[12px] uppercase font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licensePlate" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Placa / Matrícula</Label>
              <Input
                id="licensePlate"
                name="licensePlate"
                placeholder="0000-XXX"
                value={licensePlate}
                onChange={handleInputChange}
                required
                className="h-10 text-[12px] uppercase font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 text-[11px] font-medium uppercase tracking-wider border-[#EAEAEA] hover:bg-[#F7F8FA] hover:text-[#1C1C1C]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-10 bg-[#D4F04A] hover:bg-[#D4F04A]/90 text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider shadow-none border-none transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Registrar Unidad"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
