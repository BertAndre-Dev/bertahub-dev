type SettingsHeaderProps = Readonly<{
  title?: string;
  description?: string;
}>;

export function SettingsHeader({
  title = "Settings",
  description = "Profile settings",
}: SettingsHeaderProps) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
