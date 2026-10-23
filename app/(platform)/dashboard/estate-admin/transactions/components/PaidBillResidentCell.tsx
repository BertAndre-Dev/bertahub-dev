type PaidBillUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null;

function residentName(user?: PaidBillUser) {
  if (!user) return "";
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

export function paidBillResidentExportValue(user?: PaidBillUser) {
  const name = residentName(user);
  const email = user?.email?.trim() ?? "";
  if (name && email) return `${name} (${email})`;
  return name || email;
}

export function PaidBillResidentCell({ user }: Readonly<{ user?: PaidBillUser }>) {
  const name = residentName(user);
  const email = user?.email?.trim() ?? "";

  if (!name && !email) return <span>—</span>;

  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{name || "—"}</p>
      {email ? (
        <p className="truncate text-sm text-muted-foreground" title={email}>
          {email}
        </p>
      ) : null}
    </div>
  );
}
