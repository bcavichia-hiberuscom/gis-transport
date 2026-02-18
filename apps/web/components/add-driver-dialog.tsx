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
  DialogFooter,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-1">
                  Registro de Personal
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Integración de Nuevo Operativo en Flota
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="driver-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nombre y Apellidos
              </Label>
              <Input
                id="driver-name"
                placeholder="Introducir nombre completo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license-type" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tipo Permiso
                </Label>
                <Input
                  id="license-type"
                  placeholder="B, C1, etc..."
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="license-number"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  Identificación
                </Label>
                <Input
                  id="license-number"
                  placeholder="DNI / NIE / ID..."
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Contacto Directo
              </Label>
              <Input
                id="phone-number"
                placeholder="+34"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm font-medium"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">
                  Estado de Auditoría
                </p>
                <p className="text-[11px] font-bold text-slate-900 uppercase italic">
                  Alta Disponible para Operaciones
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex-1 bg-slate-950 text-white font-black uppercase italic tracking-widest text-[10px] h-11 border border-slate-800 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />{" "}
                    Procesando...
                  </>
                ) : (
                  "Finalizar Alta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
