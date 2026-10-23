import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const notifications = [
  {
    label: "Bill Reminders",
    description: "Get notified when bills are due",
  },
  {
    label: "Payment Alerts",
    description: "Receive alerts for payment confirmations",
  },
  {
    label: "User Activity",
    description: "Get notified about new user registrations",
  },
  {
    label: "System Updates",
    description: "Receive system maintenance notifications",
  },
  {
    label: "Weekly Reports",
    description: "Get weekly estate management reports",
  },
  {
    label: "Overdue Alerts",
    description: "Get notified about overdue payments",
  },
];

export function NotificationsCard() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-heading text-xl font-bold mb-6">
          Notification Preferences
        </h2>
        <div className="space-y-4">
          {notifications.map((notif, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
            >
              <div>
                <p className="font-medium text-sm">{notif.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notif.description}
                </p>
              </div>
              <input
                title="Bill Reminders"
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-border"
              />
            </div>
          ))}

          <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
}
