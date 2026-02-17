import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SettingsState } from "../types";

type BillingRatesCardProps = {
  settings: SettingsState;
  onChange: (key: keyof SettingsState, value: string | number) => void;
};

export function BillingRatesCard({
  settings,
  onChange,
}: BillingRatesCardProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-heading text-xl font-bold mb-6">Billing Rates</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Electricity Rate (per unit)
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={settings.electricityRate}
                  onChange={(e) =>
                    onChange(
                      "electricityRate",
                      Number.parseFloat(e.target.value),
                    )
                  }
                  className="pl-7 h-10"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Water Rate (per unit)
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={settings.waterRate}
                  onChange={(e) =>
                    onChange("waterRate", Number.parseFloat(e.target.value))
                  }
                  className="pl-7 h-10"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Maintenance Rate (monthly)
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={settings.maintenanceRate}
                  onChange={(e) =>
                    onChange(
                      "maintenanceRate",
                      Number.parseFloat(e.target.value),
                    )
                  }
                  className="pl-7 h-10"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Security Rate (monthly)
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={settings.securityRate}
                  onChange={(e) =>
                    onChange("securityRate", Number.parseFloat(e.target.value))
                  }
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
  );
}
