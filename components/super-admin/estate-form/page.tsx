"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryDropdown, RegionDropdown } from "react-country-region-selector"
import { cn } from "@/lib/utils"
import type { AppDispatch } from "@/redux/store"
import { fetchAvailableModules } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt"
import type { EstateData } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt"
import {
  selectAvailableModules,
  selectModulesError,
  selectModulesLoading,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt-slice"

const MODULE_LABELS: Record<string, string> = {
  bills: "Bills",
  rent: "Rent Management",
  meter: "Meter Management",
  marketplace: "Marketplace",
  visitor: "Visitor Management",
  complaints: "Complaints",
  announcements: "Announcements",
  wallet: "Wallet",
  transactions: "Transactions",
  comments: "Comments",
}

interface EstateFormProps {
  initialData?: EstateData | null
  onSubmit: (data: EstateData) => void
}

export default function EstateForm({ initialData = null, onSubmit }: EstateFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const availableModules = useSelector(selectAvailableModules)
  const modulesLoading = useSelector(selectModulesLoading)
  const modulesError = useSelector(selectModulesError)

  const [formData, setFormData] = useState<EstateData>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    modules: [],
  })

  useEffect(() => {
    dispatch(fetchAvailableModules())
  }, [dispatch])

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        address: initialData.address,
        city: initialData.city,
        state: initialData.state,
        country: initialData.country,
        modules: Array.isArray(initialData.modules) ? [...initialData.modules] : [],
      })
    } else {
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "",
        modules: [],
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleModule = (key: string) => {
    setFormData((prev) => {
      const next = new Set(prev.modules)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...prev, modules: Array.from(next) }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.modules.length === 0) {
      toast.error("Select at least one module")
      return
    }
    onSubmit(formData)
  }

  const textFields = [
    { label: "Estate Name", name: "name" as const, placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address" as const, placeholder: "Enter address" },
    { label: "City", name: "city" as const, placeholder: "Enter city" },
  ]

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <CardHeader>
          <CardTitle className="text-lg font-semibold pb-4">
            {initialData ? "Update Estate" : "Create New Estate"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {textFields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
              />
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <CountryDropdown
                value={formData.country}
                onChange={(val) => setFormData({ ...formData, country: val, state: "" })}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <Label>State / Region</Label>
              <RegionDropdown
                country={formData.country}
                value={formData.state}
                onChange={(val) => setFormData({ ...formData, state: val })}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Modules</Label>
            <p className="text-sm text-muted-foreground">
              Select one or more features enabled for this estate.
            </p>
            {modulesLoading ? (
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading modules…
              </div>
            ) : modulesError ? (
              <p className="text-sm text-destructive">{modulesError}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableModules.map((key) => {
                  const selected = formData.modules.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleModule(key)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                        selected
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-background hover:bg-muted/50 text-foreground",
                      )}
                    >
                      {MODULE_LABELS[key] ?? key}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="w-full pt-4">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={modulesLoading || Boolean(modulesError) || availableModules.length === 0}
            >
              {initialData ? "Update" : "Create Estate"}
            </Button>
          </div>
        </CardContent>
    </form>
  )
}
