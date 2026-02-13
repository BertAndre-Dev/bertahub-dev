"use client";

import { useState } from "react";
import type { SettingsTab } from "./types";
import { SettingsHeader } from "./components/settings-header";
import { SettingsTabs } from "./components/settings-tabs";
import { GeneralSettingsCard } from "./components/general-settings-card";
// import { BillingRatesCard } from "./components/billing-rates-card";
import { NotificationsCard } from "./components/notifications-card";
import { ChangePasswordCard } from "./components/change-password-card";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab["id"]>("general");

  const tabs: SettingsTab[] = [
    { id: "general", label: "General Settings", icon: "⚙️" },
    // { id: "billing", label: "Billing Rates", icon: "💰" },
    // { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "change-password", label: "Change Password", icon: "🔒" },
  ];

  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "general" && <GeneralSettingsCard />}

      {/* {activeTab === "billing" && <BillingRatesCard />} */}

      {/* {activeTab === "notifications" && <NotificationsCard />} */}

      {activeTab === "change-password" && <ChangePasswordCard />}
    </div>
  );
}