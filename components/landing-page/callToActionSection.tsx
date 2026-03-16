"use client";

import React, { useState } from "react";
import Image from "next/image";
import Button from "@/components/landing-page/atom/button";

export default function CallToActionSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
          email,
          message: `New demo request from ${email}`,
          source: "home-cta",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="demo" className="scroll-mt-28 bg-white py-16 lg:py-26">
      <div className="">
        <div className="relative overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/assets/FAQs.svg"
              alt="Seamless estate management dashboard"
              fill
              className="object-cover"
              priority={false}
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>

          {/* Content */}
          <div className="relative px-4 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-16 flex flex-col items-center text-center gap-6">
            <span className="inline-flex items-center justify-center rounded-full bg-black text-white text-[24px] sm:text-sm font-bold md:font-medium px-20 md:px-10  py-4 shadow-md">
              Join the Best!
            </span>

            <h2 className="max-w-[320px] md:max-w-full text-center text-white text-[27px] sm:text-3xl lg:text-4xl font-semibold leading-12 pb-4">
              Seamless Features To Make Living Easier
            </h2>

            {/* Email capture form UI */}
            <form className="w-full max-w-3xl mt-2" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row items-stretch gap-2 sm:gap-3 bg-white/95 border border-[#0150AC] rounded-2xl md:rounded-full px-3 py-2 sm:py-2.5 shadow-md w-full">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 bg-transparent outline-none border-none px-3 text-sm sm:text-base text-[#171717] placeholder:text-[#9CA3AF]"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-[#0150AC] hover:bg-[#124ea0] text-white rounded-full px-6 sm:px-8 py-2.5 text-sm sm:text-base font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  bg="bg-[#1560BD]"
                  text="text-white"
                  hover="hover:bg-[#124ea0]"
                  rounded="rounded-full"
                >
                  {isSubmitting ? "Sending..." : "Request a demo"}
                </Button>
              </div>
            </form>
            {status === "success" && (
              <p className="mt-2 text-xs sm:text-sm text-green-100">
                Thank you! Your request has been sent.
              </p>
            )}
            {status === "error" && (
              <p className="mt-2 text-xs sm:text-sm text-red-100">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
