"use client";

import React from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import type { ResidentVisitorData } from "./types";

export function VisitorViewModal({
  open,
  visitor,
  onClose,
}: Readonly<{
  open: boolean;
  visitor: ResidentVisitorData | null;
  onClose: () => void;
}>) {
  if (!open || !visitor) return null;

  return (
    <Modal visible={open} onClose={onClose}>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Visitor Information
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete details for this visitor entry
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Visitor Code
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {visitor.visitorCode || "—"}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  visitor.isVerified
                    ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                }`}
              >
                {visitor.isVerified ? "✓ Verified" : "⋯ Pending"}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Full Name
                </p>
                <p className="text-base text-gray-900">
                  {`${visitor.firstName || ""} ${visitor.lastName || ""}`.trim() ||
                    "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Phone Number
                </p>
                <p className="text-base text-gray-900">{visitor.phone || "—"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Visit Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Purpose of Visit
              </p>
              <p className="text-base text-gray-900">{visitor.purpose || "—"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Timestamps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-gray-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {visitor.createdAt
                      ? new Date(visitor.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              {visitor.updatedAt && (
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(visitor.updatedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button variant="outline" onClick={onClose} className="w-full cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

