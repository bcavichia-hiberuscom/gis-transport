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
import { Loader2 } from "lucide-react";

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

  const handleSelectChange = (name: string, value: string) => {
    if (name === "label") {
      setLabel(value);
    } else if (name === "licensePlate") {
      setLicensePlate(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!label.trim() || !licensePlate.trim()) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      await onSubmit({
        label: label.trim(),
        licensePlate: licensePlate.trim(),
        position: [40.4233, -3.7121], // Default position (Madrid)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Completa los datos del vehículo para agregarlo a la flota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Nombre del Vehículo</Label>
            <Input
              id="label"
              name="label"
              placeholder="ej. Vehículo 1, Mercedes Sprinter"
              value={label}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">Placa</Label>
            <Input
              id="licensePlate"
              name="licensePlate"
              placeholder="ABC-123"
              value={licensePlate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-slate-900 hover:bg-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Vehículo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
