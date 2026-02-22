"use client";

import { useState } from "react";
import { Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, ShieldPlus } from "lucide-react";

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (driver: Partial<Driver>) => Promise<void>;
  isLoading?: boolean;
}

export function AddDriverDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddDriverDialogProps) {
  const [name, setName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await onSubmit({
        name: name.trim(),
        licenseType: licenseType.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        imageUrl: imagePreview || undefined,
      });
      setName("");
      setLicenseType("");
      setLicenseNumber("");
      setPhoneNumber("");
      setImageFile(null);
      setImagePreview("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <UserPlus strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">Alta de Personal</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">Integración en Pool Operativo</DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="driver-name" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Nombre Completo</Label>
              <Input
                id="driver-name"
                placeholder="Ej. Juan Pérez..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="license-type" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Tipo Licencia</Label>
                <Input
                  id="license-type"
                  placeholder="Cat. B, C..."
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="license-number" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">DNI / ID</Label>
                <Input
                  id="license-number"
                  placeholder="00000000-X"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-number" className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">Teléfono de Contacto</Label>
              <Input
                id="phone-number"
                placeholder="+34"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
              />
            </div>

            <div className="p-4 rounded bg-[#F7F8FA] border border-[#EAEAEA] flex items-center gap-4">
              <ShieldPlus strokeWidth={1.5} className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[9px] font-medium uppercase tracking-wider text-[#6B7280]/60">Validación de Perfil</p>
                <p className="text-[10px] font-medium text-[#1C1C1C] uppercase mt-0.5">Pendiente de Aprobación SLA</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 text-[11px] font-medium uppercase tracking-wider border-[#EAEAEA]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Finalizar Alta"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
