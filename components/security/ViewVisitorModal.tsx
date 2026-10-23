"use client";

import Modal from "@/components/modal/page";
import ViewVisitorSearch from "@/components/security/view-visitor-search";
import VerifyVisitorForm from "@/components/security/verify-visitor-form";
import type { VisitorDetailsData } from "@/app/(platform)/dashboard/security/types";
import type { VisitorVerificationFlags } from "@/lib/visitor-verification-mode";

interface ViewVisitorModalProps {
  open: boolean;
  onClose: () => void;
  visitorDetails: VisitorDetailsData | null;
  lookupSource: "code" | "scan" | null;
  verificationFlags: VisitorVerificationFlags;
  verificationDescription?: string | null;
  onLookupSource: (source: "code" | "scan") => void;
  onDetailsLoaded: (visitor: VisitorDetailsData | null) => void;
  onVerified: (visitor: VisitorDetailsData | null) => void;
}

export default function ViewVisitorModal({
  open,
  onClose,
  visitorDetails,
  lookupSource,
  verificationFlags,
  verificationDescription,
  onLookupSource,
  onDetailsLoaded,
  onVerified,
}: ViewVisitorModalProps) {
  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="md:w-[720px] max-w-[720px] max-h-[90vh] overflow-y-auto p-6"
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            View visitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scan or enter a visitor code. Details appear below once loaded.
          </p>
        </div>

        <ViewVisitorSearch
          embedded
          verificationFlags={verificationFlags}
          verificationDescription={verificationDescription}
          onLookupSource={onLookupSource}
          onDetailsLoaded={onDetailsLoaded}
        />

        {visitorDetails ? (
          <div className="border-t border-border pt-6">
            <VerifyVisitorForm
              visitorDetails={visitorDetails}
              initialCode={visitorDetails.visitorCode}
              verificationFlags={verificationFlags}
              lookupSource={lookupSource}
              verificationDescription={verificationDescription}
              onVerified={onVerified}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
