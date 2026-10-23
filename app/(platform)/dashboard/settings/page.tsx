"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { SettingsTab } from "./types";
import { SettingsHeader } from "./components/settings-header";
import { SettingsTabs } from "./components/settings-tabs";
import { GeneralSettingsCard } from "./components/general-settings-card";
import { ChangePasswordCard } from "./components/change-password-card";
import { ResidentProfileCard } from "@/components/resident/ResidentProfileCard";

const VALID_TABS = new Set<SettingsTab["id"]>([
  "my-profile",
  "general",
  "change-password",
]);

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const role = useSelector(selectUserRole);
  const authRole = useSelector((state: RootState) => state.auth.user?.role);
  const isResident =
    (role || authRole || "").toString().toLowerCase() === "resident";

  const tabs: SettingsTab[] = useMemo(() => {
    const base: SettingsTab[] = [
      { id: "general", label: "Update Profile", icon: "⚙️" },
      { id: "change-password", label: "Change Password", icon: "🔒" },
    ];
    if (isResident) {
      return [
        { id: "my-profile", label: "Profile", icon: "👤" },
        ...base,
      ];
    }
    return base;
  }, [isResident]);

  const tabFromQuery = searchParams.get("tab") as SettingsTab["id"] | null;
  const defaultTab: SettingsTab["id"] = isResident ? "my-profile" : "general";

  const [activeTab, setActiveTab] = useState<SettingsTab["id"]>(() => {
    if (tabFromQuery && VALID_TABS.has(tabFromQuery)) {
      if (tabFromQuery === "my-profile" && !isResident) return "general";
      return tabFromQuery;
    }
    return defaultTab;
  });

  useEffect(() => {
    if (tabFromQuery && VALID_TABS.has(tabFromQuery)) {
      if (tabFromQuery === "my-profile" && !isResident) {
        setActiveTab("general");
        return;
      }
      setActiveTab(tabFromQuery);
      return;
    }
    if (!isResident) {
      setActiveTab((prev) => (prev === "my-profile" ? "general" : prev));
    }
  }, [tabFromQuery, isResident]);

  return (
    <div className="space-y-6">
      <SettingsHeader
        title={isResident ? "Profile" : "Settings"}
        description={
          isResident
            ? "Manage your account details"
            : "Profile settings"
        }
      />
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "my-profile" && isResident && <ResidentProfileCard />}
      {activeTab === "general" && <GeneralSettingsCard />}
      {activeTab === "change-password" && <ChangePasswordCard />}
    </div>
  );
}
