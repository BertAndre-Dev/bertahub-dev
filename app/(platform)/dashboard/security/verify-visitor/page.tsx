"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import GateConsole from "@/components/security/GateConsole";
import Loader from "@/components/ui/Loader";
import {
  getVerificationFlags,
  resolveVisitorVerificationDescription,
  resolveVisitorVerificationMode,
} from "@/lib/visitor-verification-mode";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { setSecurityVerificationContext } from "@/redux/slice/security/visitor/visitor-slice";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import type { AppDispatch, RootState } from "@/redux/store";
import { readStoredAuth } from "@/utils/auth-storage";

/** Legacy route — same unified gate as Visitor Management. */
export default function VerifyVisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { visitorVerificationMode, verificationDescription, contextReady } =
    useSelector((state: RootState) => ({
      visitorVerificationMode:
        state.securityVisitor?.visitorVerificationMode ?? null,
      verificationDescription:
        state.securityVisitor?.verificationDescription ?? null,
      contextReady: Boolean(state.securityVisitor?.contextReady),
    }));

  const flags = useMemo(
    () =>
      getVerificationFlags(
        visitorVerificationMode ?? VisitorVerificationMode.VIEW_AND_VERIFY,
      ),
    [visitorVerificationMode],
  );

  useEffect(() => {
    if (contextReady && visitorVerificationMode) return;
    (async () => {
      try {
        const prior = readStoredAuth()?.user as Record<string, unknown> | null;
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        dispatch(
          setSecurityVerificationContext({
            mode:
              resolveVisitorVerificationMode(data) ??
              resolveVisitorVerificationMode(prior) ??
              VisitorVerificationMode.VIEW_AND_VERIFY,
            description:
              resolveVisitorVerificationDescription(data) ??
              resolveVisitorVerificationDescription(prior),
            ready: true,
          }),
        );
      } catch {
        dispatch(
          setSecurityVerificationContext({
            mode: VisitorVerificationMode.VIEW_AND_VERIFY,
            ready: true,
          }),
        );
      }
    })();
  }, [contextReady, dispatch, visitorVerificationMode]);

  if (!contextReady) {
    return <Loader fullScreen label="Loading gate..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
          Gate
        </h1>
        <p className="mt-1 text-muted-foreground">
          Scan or enter a code to view, verify, or check out.
        </p>
      </div>
      <GateConsole
        verificationFlags={flags}
        verificationDescription={verificationDescription}
      />
    </div>
  );
}
