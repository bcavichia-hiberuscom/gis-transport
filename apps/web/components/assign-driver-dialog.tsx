'use client'

import { useState, useMemo } from 'react'
import { Driver } from '@gis/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Search,
  UserCheck,
  Users,
  ChevronRight,
  X,
  Filter,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface AssignDriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drivers: Driver[]
  onAssign: (driver: Driver) => void
  vehicleLabel?: string
}

export function AssignDriverDialog({
  open,
  onOpenChange,
  drivers,
  onAssign,
  vehicleLabel
}: AssignDriverDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null)

  const availableDrivers = useMemo(() => {
    return drivers.filter(d => d.isAvailable)
  }, [drivers])

  const licenseTypes = useMemo(() => {
    const types = new Set<string>()
    availableDrivers.forEach(d => {
      if (d.licenseType) types.add(d.licenseType.toUpperCase())
    })
    return Array.from(types).sort()
  }, [availableDrivers])

  const filteredDrivers = useMemo(() => {
    return availableDrivers.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase())
      const matchesLicense =
        !selectedLicense || d.licenseType?.toUpperCase() === selectedLicense
      return matchesSearch && matchesLicense
    })
  }, [availableDrivers, search, selectedLicense])

  const handleSelect = (driver: Driver) => {
    onAssign(driver)
    onOpenChange(false)
    setSearch('')
    setSelectedLicense(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <UserCheck strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">
                Asignar Operador
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">
                {vehicleLabel
                  ? `Destino: ${vehicleLabel}`
                  : 'Selección de Personal Activo'}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40 group-focus-within:text-[#1C1C1C] transition-colors"
              />
              <Input
                placeholder="BUSCAR POR NOMBRE..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-10 bg-[#F7F8FA] border-[#EAEAEA] rounded text-[11px] font-medium uppercase tracking-wider placeholder:text-[#6B7280]/30 focus-visible:ring-0 focus-visible:border-[#1C1C1C] transition-all shadow-none"
              />
            </div>

            {/* License Filters */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedLicense(null)}
                className={cn(
                  'px-3 py-1.5 rounded text-[9px] font-medium uppercase tracking-wider transition-all border',
                  !selectedLicense
                    ? 'bg-[#1C1C1C] text-[#D4F04A] border-[#1C1C1C]'
                    : 'bg-white text-[#6B7280] border-[#EAEAEA] hover:border-[#1C1C1C]/40'
                )}
              >
                Todos
              </button>
              {licenseTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedLicense(type)}
                  className={cn(
                    'px-3 py-1.5 rounded text-[9px] font-medium uppercase tracking-wider transition-all border',
                    selectedLicense === type
                      ? 'bg-[#1C1C1C] text-[#D4F04A] border-[#1C1C1C]'
                      : 'bg-white text-[#6B7280] border-[#EAEAEA] hover:border-[#1C1C1C]/40'
                  )}
                >
                  Cat. {type}
                </button>
              ))}
            </div>

            <ScrollArea className="h-[400px] -mx-8 px-8">
              <div className="space-y-2">
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map(driver => {
                    return (
                      <div
                        key={driver.id}
                        onClick={() => handleSelect(driver)}
                        className="w-full flex flex-col gap-3 p-4 rounded border border-[#EAEAEA] hover:border-[#1C1C1C]/40 bg-white transition-all cursor-pointer group"
                      >
                        {/* Driver Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded bg-[#F7F8FA] border border-[#EAEAEA] flex items-center justify-center shrink-0">
                              {driver.imageUrl ? (
                                <img
                                  src={driver.imageUrl}
                                  alt={driver.name}
                                  className="h-full w-full object-cover rounded shadow-sm"
                                />
                              ) : (
                                <Users
                                  strokeWidth={1.5}
                                  className="h-5 w-5 text-[#6B7280]/30"
                                />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-medium text-[#1C1C1C] truncate group-hover:text-[#1C1C1C]">
                                {driver.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-medium text-[#6B7280]/60 uppercase tracking-tight">
                                  {driver.licenseType || 'Cat. B'}
                                </span>
                                <div className="h-0.5 w-0.5 rounded-full bg-[#EAEAEA]" />
                                <span className="text-[9px] font-medium text-emerald-700 uppercase">
                                  {driver.onTimeDeliveryRate}% Score
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            strokeWidth={1.5}
                            className="h-4 w-4 text-[#6B7280]/20 group-hover:text-[#1C1C1C] group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-16 text-center bg-[#F7F8FA] rounded border border-dashed border-[#EAEAEA]">
                    <Users
                      strokeWidth={1}
                      className="h-10 w-10 text-[#6B7280]/20 mx-auto mb-3"
                    />
                    <p className="text-[11px] font-medium text-[#6B7280]/40 uppercase tracking-wider">
                      Sin resultados
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t border-[#F7F8FA]">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-10 text-[11px] font-medium uppercase tracking-wider border-[#EAEAEA]"
              >
                Cancelar Selección
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
