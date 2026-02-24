"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryDropdown, RegionDropdown } from "react-country-region-selector"

// ⬇ Rename to avoid conflict
interface EstateFormData {
  name: string
  address: string
  city: string
  state: string
  country: string
}

interface EstateFormProps {
  initialData?: EstateFormData | null
  onSubmit: (data: EstateFormData) => void
}

export default function EstateForm({ initialData = null, onSubmit }: EstateFormProps) {
  const [formData, setFormData] = useState<EstateFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
  })

  useEffect(() => {
    if (initialData) setFormData(initialData)
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const textFields = [
    { label: "Estate Name", name: "name", placeholder: "Enter estate name" },
    { label: "Estate Address", name: "address", placeholder: "Enter address" },
    { label: "City", name: "city", placeholder: "Enter city" },
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
                value={formData[field.name as keyof EstateFormData]}
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
                // placeholder="Select country"
                onChange={(val) => setFormData({ ...formData, country: val, state: "" })}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <Label>State / Region</Label>
              <RegionDropdown
                country={formData.country}
                value={formData.state}
                // placeholder="Select state"
                onChange={(val) => setFormData({ ...formData, state: val })}
                className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="w-full pt-4">
            <Button type="submit" className="w-full cursor-pointer">
              {initialData ? "Update" : "Create Estate"}
            </Button>
          </div>
        </CardContent>
    </form>
  )
}
