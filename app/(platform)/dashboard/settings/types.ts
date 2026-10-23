export type SettingsState = {
  estateName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  electricityRate: number;
  waterRate: number;
  maintenanceRate: number;
  securityRate: number;
};

export type SettingsTab = {
  id: "my-profile" | "general" | "billing" | "notifications" | "change-password";
  label: string;
  icon?: string;
};
