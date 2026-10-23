"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Home, TrendingUp } from "lucide-react"

export default function EstatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Estate Information</h1>
        <p className="text-muted-foreground mt-1">Overview of your estate properties and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Buildings", value: "5", icon: Building2, color: "bg-blue-500/10" },
          { label: "Total Units", value: "18", icon: Home, color: "bg-green-500/10" },
          { label: "Total Residents", value: "1,248", icon: Users, color: "bg-purple-500/10" },
          { label: "Occupancy Rate", value: "93%", icon: TrendingUp, color: "bg-orange-500/10" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-heading text-xl font-bold mb-6">Estate Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Estate Name</p>
              <p className="font-medium text-lg mt-1">Sunset Heights Estate</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium text-lg mt-1">123 Estate Lane, Downtown</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Established</p>
              <p className="font-medium text-lg mt-1">January 2020</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estate Manager</p>
              <p className="font-medium text-lg mt-1">John Smith</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-heading text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="bg-primary hover:bg-primary/90 h-12">Generate Monthly Report</Button>
          <Button variant="outline" className="bg-transparent h-12">
            Export Estate Data
          </Button>
          <Button variant="outline" className="bg-transparent h-12">
            Schedule Maintenance
          </Button>
          <Button variant="outline" className="bg-transparent h-12">
            Send Announcement
          </Button>
        </div>
      </Card>
    </div>
  )
}
