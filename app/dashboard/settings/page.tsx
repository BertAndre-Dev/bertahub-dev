"use client"

import { useState } from "react"
import { Save, Lock, Eye, EyeOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    estateName: "Sunset Heights Estate",
    email: "admin@estate.com",
    phone: "+1 (555) 123-4567",
    address: "123 Estate Lane, Downtown",
    currency: "USD",
    timezone: "UTC-5",
    electricityRate: 12.5,
    waterRate: 8.75,
    maintenanceRate: 150,
    securityRate: 200,
  })

  const tabs = [
    { id: "general", label: "General Settings", icon: "⚙️" },
    { id: "billing", label: "Billing Rates", icon: "💰" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🔒" },
  ]

  const handleSettingChange = (key: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your estate configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-heading text-xl font-bold mb-6">Estate Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Estate Name</label>
                <Input
                  value={settings.estateName}
                  onChange={(e) => handleSettingChange("estateName", e.target.value)}
                  className="mt-2 h-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange("email", e.target.value)}
                    className="mt-2 h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => handleSettingChange("phone", e.target.value)}
                    className="mt-2 h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={settings.address}
                  onChange={(e) => handleSettingChange("address", e.target.value)}
                  className="mt-2 h-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange("currency", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm mt-2"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>CAD</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm mt-2"
                  >
                    <option>UTC-5</option>
                    <option>UTC-6</option>
                    <option>UTC-7</option>
                    <option>UTC+0</option>
                  </select>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Billing Rates */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-heading text-xl font-bold mb-6">Billing Rates</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Electricity Rate (per unit)</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={settings.electricityRate}
                      onChange={(e) => handleSettingChange("electricityRate", Number.parseFloat(e.target.value))}
                      className="pl-7 h-10"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Water Rate (per unit)</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={settings.waterRate}
                      onChange={(e) => handleSettingChange("waterRate", Number.parseFloat(e.target.value))}
                      className="pl-7 h-10"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Maintenance Rate (monthly)</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={settings.maintenanceRate}
                      onChange={(e) => handleSettingChange("maintenanceRate", Number.parseFloat(e.target.value))}
                      className="pl-7 h-10"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Security Rate (monthly)</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={settings.securityRate}
                      onChange={(e) => handleSettingChange("securityRate", Number.parseFloat(e.target.value))}
                      className="pl-7 h-10"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Rates
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-heading text-xl font-bold mb-6">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { label: "Bill Reminders", description: "Get notified when bills are due" },
                { label: "Payment Alerts", description: "Receive alerts for payment confirmations" },
                { label: "User Activity", description: "Get notified about new user registrations" },
                { label: "System Updates", description: "Receive system maintenance notifications" },
                { label: "Weekly Reports", description: "Get weekly estate management reports" },
                { label: "Overdue Alerts", description: "Get notified about overdue payments" },
              ].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{notif.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.description}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border" />
                </div>
              ))}

              <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-heading text-xl font-bold mb-6">Security Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative mt-2">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-10 h-10" />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" placeholder="••••••••" className="mt-2 h-10" />
              </div>

              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <Input type="password" placeholder="••••••••" className="mt-2 h-10" />
              </div>

              <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </Button>

              <div className="pt-6 border-t border-border">
                <h3 className="font-heading font-bold mb-4">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account</p>
                <Button variant="outline" className="bg-transparent">
                  Enable 2FA
                </Button>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-heading font-bold mb-4">Active Sessions</h3>
                <div className="space-y-2">
                  {[
                    { device: "Chrome on Windows", location: "New York, USA", time: "Active now" },
                    { device: "Safari on iPhone", location: "New York, USA", time: "2 hours ago" },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{session.device}</p>
                        <p className="text-xs text-muted-foreground">{session.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{session.time}</p>
                        <Button variant="ghost" size="sm" className="text-destructive mt-1">
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
