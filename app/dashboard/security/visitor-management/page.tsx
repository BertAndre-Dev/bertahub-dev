"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import VerifyVisitorForm from "@/components/security/verify-visitor-form";
import ViewVisitorSearch from "@/components/security/view-visitor-search";
import { Card } from "@/components/ui/card";
import { IdCard } from "lucide-react";
import ResidentDetails from "@/components/security/resident-detail";
import ClockedCard from "@/components/security/clockinouttime";
import RecentVisitorInvites from "@/components/security/recent-visitor-invites";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";

export default function VisitorManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [visitorDetails, setVisitorDetails] =
    useState<VisitorDetailsData | null>(null);

  const { allVisitors } = useSelector(
    (state: RootState) => {
      const v = state.securityVisitor;
      return {
        allVisitors: v?.allVisitors ?? null,
        loading: v?.getAllVisitorsStatus === "isLoading",
      };
    },
  );

  // const visitors = allVisitors?.data ?? [];

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.estateId ?? userRes?.data?.estate?.id ?? "";
        if (!id) return;
        setEstateId(id);
        await dispatch(
          getAllVisitors({ estateId: id, page: 1, limit: 20 }),
        ).unwrap();
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message ?? "Failed to load");
      }
    })();
  }, [dispatch]);

  const clockedIn =
    visitorDetails?.checkedInAt ??
    visitorDetails?.updatedAt ??
    null;
  const clockedOut = visitorDetails?.checkedOutAt ?? null;

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            label: "Total Verifications",
            value: 0,
            icon: IdCard,
            color: "bg-[#D0DFF280]",
          },
          {
            label: "Denied Access",
            value: 0,
            icon: IdCard,
            color: "bg-[#D0DFF280]",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ViewVisitorSearch onDetailsLoaded={setVisitorDetails} />

      {visitorDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VerifyVisitorForm
            visitorDetails={visitorDetails}
            initialCode={visitorDetails?.visitorCode}
          />
          <ResidentDetails visitorDetails={visitorDetails} />
        </div>
      )}

      <ClockedCard
        clockedIn={clockedIn}
        clockedOut={clockedOut}
        initialClockOutCode={visitorDetails?.visitorCode}
      />
      {/* Recent Visitor Invites */}
      <RecentVisitorInvites visitors={allVisitors?.data ?? []} />
    </div>
  );
}
