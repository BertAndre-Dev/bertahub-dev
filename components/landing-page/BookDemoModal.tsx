"use client";

import React, { useState } from "react";

type BookDemoModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export default function BookDemoModal({ isOpen, onClose }: BookDemoModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [heardAboutUs, setHeardAboutUs] = useState("");
  const [featureInterest, setFeatureInterest] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleFeatureToggle = (value: string) => {
    setFeatureInterest((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          message,
          heardAboutUs,
          featureInterest,
          source: "book-demo-modal",
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const messageFromServer =
          payload && typeof payload === "object"
            ? (payload as { details?: string; message?: string })?.details ||
              (payload as { details?: string; message?: string })?.message
            : null;
        throw new Error(messageFromServer || "Failed to submit");
      }

      setStatus("success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setHeardAboutUs("");
      setFeatureInterest([]);
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      {/* Backdrop */}
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />

      {/* Modal — slides up from bottom on mobile, centered on desktop */}
      <div className="relative z-10 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl bg-white text-[#101828] border border-gray-200 shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-7 sm:pt-5">
          <h2 className="text-base sm:text-xl font-semibold text-[#101828]">
            Book a demo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-xl leading-none cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <p className="px-5 sm:px-7 text-xs sm:text-sm text-gray-500 pb-3">
          Tell us a bit about yourself and what you&apos;d like to see in the
          demo. A member of the team will get back to you shortly.
        </p>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 sm:px-7 sm:pb-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid gap-3 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="firstName"
                  className="text-xs font-medium text-gray-700"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="lastName"
                  className="text-xs font-medium text-gray-700"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828]"
                />
              </div>
            </div>

            {/* Email + Phone row */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone"
                  className="text-xs font-medium text-gray-700"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828]"
                />
              </div>
            </div>

            {/* Features — 2 col grid on mobile for compactness */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-gray-700">
                What feature are you interested in?
              </p>
              <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 grid grid-cols-2 sm:grid-cols-1 gap-2">
                {[
                  "Smart meters",
                  "Revenue collection",
                  "User management",
                  "Bills Management",
                  "Full package",
                ].map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center gap-2 text-xs sm:text-sm text-[#101828] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={feature}
                      checked={featureInterest.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="accent-[#1560BD] w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            {/* Heard about us */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="heardAboutUs"
                className="text-xs font-medium text-gray-700"
              >
                Where did you hear about us?
              </label>
              <select
                id="heardAboutUs"
                name="heardAboutUs"
                value={heardAboutUs}
                onChange={(e) => setHeardAboutUs(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828]"
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Google">Google</option>
                <option value="Sales Agent">Sales Agent</option>
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="message"
                className="text-xs font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1560BD] text-[#101828] resize-y"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full cursor-pointer bg-[#1560BD] hover:bg-[#124ea0] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-8 py-3 transition-colors"
            >
              {isSubmitting ? "Sending..." : "Book a demo"}
            </button>

            {status === "success" && (
              <p className="text-xs sm:text-sm text-green-600">
                Thank you! Your request has been sent.
              </p>
            )}
            {status === "error" && (
              <p className="text-xs sm:text-sm text-red-500">
                Something went wrong. Please try again in a moment.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
