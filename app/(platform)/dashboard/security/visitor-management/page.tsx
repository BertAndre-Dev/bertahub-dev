"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import RecentVisitorInvites from "@/components/security/recent-visitor-invites";
import GateConsole from "@/components/security/GateConsole";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import {
  setSecurityEstateId,
  setSecurityVerificationContext,
} from "@/redux/slice/security/visitor/visitor-slice";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getVerificationFlags,
  resolveVisitorVerificationDescription,
  resolveVisitorVerificationMode,
} from "@/lib/visitor-verification-mode";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { readStoredAuth } from "@/utils/auth-storage";

function readInitialVerificationMode(): VisitorVerificationMode | null {
  if (typeof window === "undefined") return null;
  return resolveVisitorVerificationMode(
    readStoredAuth()?.user as Record<string, unknown> | null,
  );
}

function modeSubtitle(mode: VisitorVerificationMode | null): string {
  if (mode === VisitorVerificationMode.VIEW_ONLY) {
    return "View only — check in on first scan, check out on the next.";
  }
  if (mode === VisitorVerificationMode.VERIFY_ONLY) {
    return "Verify only — verify and check in on first scan, check out on the next.";
  }
  return "View and verify — view, then a different officer verifies and checks in.";
}

export default function VisitorManagementPage() {
  const dispatch = useDispatch<AppDispatch>();

  const authUser = useSelector((state: RootState) => state.auth.user);
  const {
    allVisitors,
    getAllVisitorsStatus,
    estateId,
    visitorVerificationMode,
    verificationDescription,
    contextReady,
  } = useSelector((state: RootState) => {
    const v = state.securityVisitor;
    return {
      allVisitors: v?.allVisitors ?? null,
      getAllVisitorsStatus: v?.getAllVisitorsStatus ?? "idle",
      estateId: v?.estateId ?? null,
      visitorVerificationMode: v?.visitorVerificationMode ?? null,
      verificationDescription: v?.verificationDescription ?? null,
      contextReady: Boolean(v?.contextReady),
    };
  });

  const verificationFlags = useMemo(
    () =>
      getVerificationFlags(
        visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      ),
    [visitorVerificationMode],
  );

  const refreshVisitors = () => {
    if (!estateId) return;
    void dispatch(getAllVisitors({ estateId, page: 1, limit: 20 }));
  };

  useEffect(() => {
    const priorMode = readInitialVerificationMode();
    if (priorMode) {
      const priorUser = readStoredAuth()?.user as Record<string, unknown> | null;
      dispatch(
        setSecurityVerificationContext({
          mode: priorMode,
          description: resolveVisitorVerificationDescription(priorUser),
          ready: true,
        }),
      );
    }

    (async () => {
      try {
        const priorUser = (authUser ??
          readStoredAuth()?.user) as Record<string, unknown> | null;
        const priorModeResolved = resolveVisitorVerificationMode(priorUser);

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const rawEstateId = data?.estateId ?? data?.estate ?? null;
        const id =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              "";

        const mode =
          resolveVisitorVerificationMode(data) ??
          priorModeResolved ??
          VisitorVerificationMode.VIEW_AND_VERIFY;

        dispatch(
          setSecurityVerificationContext({
            mode,
            description:
              resolveVisitorVerificationDescription(data) ??
              resolveVisitorVerificationDescription(priorUser),
            ready: true,
          }),
        );

        if (!id) return;
        dispatch(setSecurityEstateId(id));
        await dispatch(
          getAllVisitors({ estateId: id, page: 1, limit: 20 }),
        ).unwrap();
      } catch (err: unknown) {
        dispatch(
          setSecurityVerificationContext({
            mode:
              resolveVisitorVerificationMode(
                (authUser ?? readStoredAuth()?.user) as Record<
                  string,
                  unknown
                > | null,
              ) ?? VisitorVerificationMode.VIEW_AND_VERIFY,
            ready: true,
          }),
        );
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const pageLoading =
    !contextReady ||
    (Boolean(estateId) && isPending(getAllVisitorsStatus));

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading gate..." />}

      <div
        className={`space-y-8${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
            Visitor Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            {modeSubtitle(visitorVerificationMode)}
          </p>
        </div>

        {contextReady ? (
          <GateConsole
            verificationFlags={verificationFlags}
            verificationDescription={verificationDescription}
            onGateSuccess={refreshVisitors}
          />
        ) : null}

        <RecentVisitorInvites
          visitors={allVisitors?.data ?? []}
          loading={false}
        />
      </div>
    </div>
  );
}
