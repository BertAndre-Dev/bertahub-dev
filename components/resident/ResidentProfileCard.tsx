"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  MapPin,
  Phone,
  RotateCcw,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { CopyButton } from "@/components/ui/copy-button";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getUserProfile } from "@/redux/slice/resident/user-profile/user-profile";
import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import {
  formatAddressLabel,
  normalizeAddresses,
  type AddressOption,
} from "@/lib/address";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { extractEstateNameFromUser, extractUserId } from "@/lib/user-id";
import { normalizeMeterFromApiResponse } from "@/lib/user-address-meters";
import { selectResidentCode } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { ResidentMeterData } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";

type ProfileRecord = Record<string, unknown>;

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function DetailField({
  label,
  value,
  copyValue,
}: Readonly<{
  label: string;
  value: ReactNode;
  copyValue?: string;
}>) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium flex flex-wrap items-center gap-2">
        {value}
        {copyValue ? (
          <CopyButton
            value={copyValue}
            copiedLabel="Copied"
            title={`Copy ${label.toLowerCase()}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function MeterNumberValue({
  meterNumber,
}: Readonly<{ meterNumber: string | null }>) {
  if (!meterNumber) {
    return (
      <span className="text-sm text-muted-foreground italic">Not assigned</span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-semibold">{meterNumber}</span>
      <CopyButton
        value={meterNumber}
        copiedLabel="Copied"
        title="Copy meter number"
      />
    </div>
  );
}

function extractMeterNumber(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const payload = res as { data?: unknown };
  const fromData = normalizeMeterFromApiResponse(res);
  if (fromData) return fromData;
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const meter = nested as ResidentMeterData;
    return meter.meterNumber ?? null;
  }
  if (Array.isArray(nested) && nested[0]) {
    return (nested[0] as ResidentMeterData).meterNumber ?? null;
  }
  return null;
}

export function ResidentProfileCard() {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(
    (state: RootState) => state.auth.user,
  ) as ProfileRecord | null;
  const profileUser = useSelector(
    (state: RootState) => state.userProfile.user,
  ) as ProfileRecord | null;
  const getStatus = useSelector(
    (state: RootState) => state.userProfile.getStatus,
  );
  const profileError = useSelector(
    (state: RootState) => state.userProfile.error,
  );
  const residentCode = useSelector(selectResidentCode);

  const [meterByAddressId, setMeterByAddressId] = useState<
    Record<string, string | null>
  >({});
  const [metersLoading, setMetersLoading] = useState(false);

  const userId = useMemo(
    () => extractUserId(authUser) ?? extractUserId(profileUser),
    [authUser, profileUser],
  );

  const display = useMemo(() => {
    return { ...authUser, ...profileUser } as ProfileRecord;
  }, [authUser, profileUser]);

  const addresses: AddressOption[] = useMemo(() => {
    const fromAuth = normalizeAddresses(authUser);
    if (fromAuth.length > 0) return fromAuth;
    return normalizeAddresses(display);
  }, [authUser, display]);

  const addressIdsKey = useMemo(
    () => addresses.map((a) => a.id).join(","),
    [addresses],
  );

  const phoneDisplay = useMemo(() => {
    const code = asString(display.countryCode).trim();
    const phone = asString(display.phoneNumber).trim();
    if (code && phone) return `${code} ${phone}`;
    return phone || code || "—";
  }, [display]);

  const estateName =
    extractEstateNameFromUser(display) ||
    extractEstateNameFromUser(authUser) ||
    "—";

  const fullName =
    `${asString(display.firstName)} ${asString(display.lastName)}`.trim() ||
    "Resident";
  const image = asString(display.image) || "/profile.svg";
  const role = asString(display.role) || "resident";
  const residentType = asString(display.residentType);
  const email = asString(display.email);

  const fetchProfile = () => {
    if (userId) dispatch(getUserProfile(userId));
  };

  useEffect(() => {
    dispatch(getSignedInUser()).catch(() => {
      // Auth layout already handles session expiry
    });
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;
    dispatch(getUserProfile(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!addressIdsKey) {
      setMeterByAddressId({});
      setMetersLoading(false);
      return;
    }

    const ids = addressIdsKey.split(",").filter(Boolean);
    let cancelled = false;
    setMetersLoading(true);

    (async () => {
      const entries = await Promise.all(
        ids.map(async (addressId) => {
          try {
            const res = await dispatch(
              getMeterByAddress({ addressId }),
            ).unwrap();
            return [addressId, extractMeterNumber(res)] as const;
          } catch {
            return [addressId, null] as const;
          }
        }),
      );
      if (!cancelled) {
        setMeterByAddressId(Object.fromEntries(entries));
        setMetersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addressIdsKey, dispatch]);

  const loading = getStatus === "isLoading" || !userId;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your resident account details for this estate
        </p>
      </div>

      {loading ? (
        <div className="py-12">
          <Loader label="Loading profile..." />
        </div>
      ) : null}

      {!loading && profileError && !profileUser ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-destructive">{profileError}</p>
          <Button variant="outline" size="sm" onClick={fetchProfile}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !(profileError && !profileUser) ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="bg-primary rounded-full overflow-hidden w-16 h-16 shrink-0">
              <Image
                src={image}
                alt={fullName}
                width={64}
                height={64}
                className="rounded-full object-cover w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-lg font-semibold truncate">{fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatLabel(residentType || role)}
                  {estateName !== "—" ? ` · ${estateName}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                Personal details
              </h3>
              <DetailField
                label="First name"
                value={asString(display.firstName) || "—"}
              />
              <DetailField
                label="Last name"
                value={asString(display.lastName) || "—"}
              />
              <DetailField
                label="Gender"
                value={formatLabel(asString(display.gender))}
              />
              <DetailField
                label="Date of birth"
                value={formatDate(asString(display.dateOfBirth) || null)}
              />
              <DetailField
                label="Resident type"
                value={formatLabel(residentType || "Resident")}
              />
              {residentCode ? (
                <DetailField
                  label="Resident code"
                  value={residentCode}
                  copyValue={residentCode}
                />
              ) : null}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4 text-primary" />
                Contact & account
              </h3>
              <DetailField
                label="Email"
                value={email || "—"}
                copyValue={email || undefined}
              />
              <DetailField
                label="Phone"
                value={phoneDisplay}
                copyValue={phoneDisplay !== "—" ? phoneDisplay : undefined}
              />
              <DetailField label="Role" value={formatLabel(role)} />
              {asString(display.address) ? (
                <DetailField
                  label="Address"
                  value={asString(display.address)}
                />
              ) : null}
              <DetailField
                label="Member since"
                value={formatDateTime(asString(display.createdAt) || null)}
              />
              <DetailField
                label="Last updated"
                value={formatDateTime(asString(display.updatedAt) || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-6">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                Addresses
              </h3>
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No addresses linked to this account.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {addresses.map((addr, index) => (
                    <div
                      key={addr.id || index}
                      className="rounded-lg border border-border p-4"
                    >
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Address {index + 1}
                      </p>
                      {addr.data && Object.keys(addr.data).length > 0 ? (
                        <dl className="space-y-1">
                          {Object.entries(addr.data).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between gap-4 text-sm"
                            >
                              <dt className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, " $1")}
                              </dt>
                              <dd className="font-medium text-right">
                                {val || "—"}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-sm font-medium">
                          {formatAddressLabel(addr)}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="h-3.5 w-3.5" />
                          Meter
                        </span>
                        {metersLoading ? (
                          <span className="text-muted-foreground text-xs">
                            Loading…
                          </span>
                        ) : (
                          <MeterNumberValue
                            meterNumber={meterByAddressId[addr.id] ?? null}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" />
                Estate
              </h3>
              <div className="rounded-lg border border-border p-4">
                <DetailField label="Current estate" value={estateName} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
