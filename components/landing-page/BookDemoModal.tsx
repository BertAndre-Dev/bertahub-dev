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
  const [featureInterest, setFeatureInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error("Failed to submit");
      }

      setStatus("success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setHeardAboutUs("");
      setFeatureInterest("");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 sm:px-6">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white/90 text-[#101828] border border-gray-200 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 sm:px-7">
          <h2 className="text-lg sm:text-xl font-semibold text-[#101828]">
            Book a demo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 text-xl leading-none cursor-pointer"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <p className="px-6 sm:px-7 text-xs sm:text-sm text-gray-500 pb-4">
          Tell us a bit about yourself and what you&apos;d like to see in the
          demo. A member of the team will get back to you shortly.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-6 pb-6 sm:px-7 sm:pb-7"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="firstName"
              className="text-xs sm:text-sm font-medium text-gray-700"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="lastName"
              className="text-xs sm:text-sm font-medium text-gray-700"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="heardAboutUs"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                Where did you hear about us?
              </label>
              <select
                id="heardAboutUs"
                name="heardAboutUs"
                value={heardAboutUs}
                onChange={(event) => setHeardAboutUs(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Google">Google</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="featureInterest"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                What feature are you interested in?
              </label>
              <select
                id="featureInterest"
                name="featureInterest"
                value={featureInterest}
                onChange={(event) => setFeatureInterest(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828]"
              >
                <option value="" disabled>
                  Select a feature
                </option>
                <option value="Smart meters">Smart meters</option>
                <option value="Full package">Full package</option>
                <option value="Revenue collection">Revenue collection</option>
                <option value="User management">User management</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="message"
              className="text-xs sm:text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:border-[#1560BD] text-[#101828] resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full cursor-pointer bg-[#1560BD] hover:bg-[#124ea0] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium px-8 py-2.5 transition-colors"
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
  );
}
