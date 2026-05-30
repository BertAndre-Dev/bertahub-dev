"use client";

import { useState } from "react";
import type { StaffSettingsTab } from "./types";
import { SettingsTabs } from "@/app/dashboard/settings/components/settings-tabs";
import { ChangePasswordCard } from "@/app/dashboard/settings/components/change-password-card";
import { StaffGeneralSettingsCard } from "./components/staff-general-settings-card";

function StaffSettingsHeader() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1">Manage your staff account</p>
    </div>
  );
}

export default function StaffSettingsPage() {
  const [activeTab, setActiveTab] =
    useState<StaffSettingsTab["id"]>("general");

  const tabs: StaffSettingsTab[] = [
    { id: "general", label: "General Settings", icon: "⚙️" },
    { id: "change-password", label: "Change Password", icon: "🔒" },
  ];

  return (
    <div className="space-y-6">
      <StaffSettingsHeader />
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) =>
          setActiveTab(tabId as StaffSettingsTab["id"])
        }
      />
      {activeTab === "general" && <StaffGeneralSettingsCard />}
      {activeTab === "change-password" && <ChangePasswordCard />}
    </div>
  );
}
