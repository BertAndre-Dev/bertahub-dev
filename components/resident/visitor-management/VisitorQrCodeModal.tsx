"use client";

import React from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "react-toastify";

export interface QrCodeVisitor {
  id?: string;
  visitorCode?: string;
  firstName?: string;
  lastName?: string;
  qrCodeDataUrl?: string;
  inviteLink?: string;
  verificationCode?: string;
  visitingType?: string;
  visitStartDate?: string | null;
  visitEndDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export function VisitorQrCodeModal({
  open,
  visitor,
  onClose,
}: Readonly<{
  open: boolean;
  visitor: QrCodeVisitor | null;
  onClose: () => void;
}>) {
  if (!open || !visitor) return null;

  const fullName =
    `${visitor.firstName ?? ""} ${visitor.lastName ?? ""}`.trim() ||
    visitor.visitorCode ||
    "Visitor";

  const handleDownload = () => {
    if (!visitor.qrCodeDataUrl) return;
    try {
      const link = document.createElement("a");
      link.href = visitor.qrCodeDataUrl;
      link.download = `${visitor.visitorCode || "visitor"}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download QR code");
    }
  };

  const handleCopyInvite = async () => {
    if (!visitor.inviteLink) return;
    try {
      await navigator.clipboard.writeText(visitor.inviteLink);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Unable to copy invite link");
    }
  };

  const formatDate = (val?: string | null) =>
    val
      ? new Date(val).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <Modal visible={open} onClose={onClose}>
      <div className="space-y-5">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Visitor QR Code
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Share this QR code with <strong>{fullName}</strong> to grant entry.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          {visitor.qrCodeDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visitor.qrCodeDataUrl}
              alt={`QR code for ${fullName}`}
              className="w-56 h-56 md:w-64 md:h-64 rounded-lg border border-gray-200 bg-white p-2"
            />
          ) : (
            <div className="w-56 h-56 md:w-64 md:h-64 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 text-center px-4">
              No QR code is available for this visitor yet.
            </div>
          )}

          {visitor.visitorCode && (
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Visitor Code
              </p>
              <p className="font-mono text-base font-semibold text-gray-900">
                {visitor.visitorCode}
              </p>
            </div>
          )}

          {visitor.verificationCode && (
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Verification Code
              </p>
              <p className="font-mono text-sm text-gray-900">
                {visitor.verificationCode}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Visiting Type
            </p>
            <p className="text-gray-900">
              {visitor.visitingType === "LONG_VISIT"
                ? "Long Visit"
                : visitor.visitingType === "SHORT_VISIT"
                  ? "Short Visit"
                  : "—"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Valid From</p>
            <p className="text-gray-900">
              {formatDate(visitor.validFrom ?? visitor.visitStartDate)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Valid Until
            </p>
            <p className="text-gray-900">
              {formatDate(visitor.validUntil ?? visitor.visitEndDate)}
            </p>
          </div>
        </div>

        {visitor.inviteLink && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">
              Invite Link
            </p>
            <p className="text-xs text-blue-900 break-all">
              {visitor.inviteLink}
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2 pt-2">
          {visitor.inviteLink && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyInvite}
              className="flex-1 cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Invite Link
            </Button>
          )}
          {visitor.qrCodeDataUrl && (
            <Button
              type="button"
              onClick={handleDownload}
              className="flex-1 cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
