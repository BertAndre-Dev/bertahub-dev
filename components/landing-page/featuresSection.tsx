"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<"owners" | "residents">("owners");

  return (
    <section className="bg-[#F5F7FB] py-8 lg:py-16 my-16 lg:my-24">
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-stretch">
          {/* Image (mobile first) */}
          <div className="relative order-1 lg:order-2 rounded-3xl overflow-hidden border border-[#D0DFF2] h-[280px] sm:h-[360px] lg:h-auto lg:min-h-[500px]">
            <Image
              src={
                activeTab === "owners"
                  ? "/assets/Frame%202147227113.svg"
                  : "/assets/home.svg"
              }
              alt={
                activeTab === "owners"
                  ? "Estate manager working at a computer"
                  : "Two residents having a conversation at home"
              }
              fill
              className="object-cover"
              priority={false}
            />
          </div>

          {/* Tabs + card */}
          <div className="order-2 lg:order-1 flex flex-col gap-4">
            {/* Tab group sitting above the card */}
            <div className="inline-flex rounded-full bg-[#111827] p-1 gap-1 max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab("owners")}
                className={`flex-1 min-w-[140px] rounded-full px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                  activeTab === "owners"
                    ? "bg-[#1560BD] text-white"
                    : "bg-transparent text-white/80"
                }`}
              >
                Property Owners &amp; Operators
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("residents")}
                className={`flex-1 min-w-[140px] rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === "residents"
                    ? "bg-[#1560BD] text-white cursor-pointer"
                    : "bg-transparent text-white/80 cursor-pointer"
                }`}
              >
                Home owners &amp; Residents
              </button>
            </div>

            <article className="bg-white rounded-3xl shadow-sm border border-[#D0DFF2] px-6 md:px-8 py-7 sm:py-8 flex flex-col gap-6 h-[420px] sm:h-[430px] lg:h-[440px]">
              {/* Text content */}
              <div
                className={`space-y-4 sm:space-y-5 flex-1 ${
                  activeTab === "owners" ? "overflow-y-auto pr-1" : ""
                }`}
              >
                <div>
                  <h2 className="text-[#171717] text-[20px] font-bold mb-2 cursor-pointer">
                    {activeTab === "owners"
                      ? "Property Management"
                      : "Resident Management"}
                  </h2>
                  <div className="mt-2 h-[3px] w-20 rounded-full bg-[#FA8128] mb-4" />
                  {activeTab === "owners" ? (
                    <p className="text-[#4C4C4C] text-sm sm:text-base leading-relaxed">
                      A powerful web-based management suite designed for
                      clarity, efficiency, and scale.
                    </p>
                  ) : (
                    <p className="text-[#4C4C4C] text-sm sm:text-base leading-relaxed">
                      Berta Hub gives homeowners and residents a simple,
                      reliable way to manage everyday living within their
                      community. Residents can submit maintenance requests,
                      track payments, receive updates from property management,
                      and stay connected with their community.
                    </p>
                  )}
                </div>

                <div>
                  {activeTab === "owners" ? (
                    <>
                      <p className="text-[#171717] text-sm sm:text-base font-normal mb-2">
                        You can:
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-[#4C4C4C] text-sm sm:text-base leading-relaxed">
                        <li>Get insights on energy consumption</li>
                        <li>
                          Create and manage properties, units, and occupants
                        </li>
                        <li>Automate recurring charges and utility billing</li>
                        <li>Track collections in real time</li>
                        <li>
                          Instantly reconcile payments and generate reports
                        </li>
                        <li>
                          Monitor service delivery and maintenance performance
                        </li>
                        <li>
                          Gain actionable insights into operations and revenue
                        </li>
                      </ul>
                    </>
                  ) : (
                    <p className="text-[#4C4C4C] text-sm sm:text-base leading-relaxed">
                      Homeowners can invite tenants, monitor property-related
                      transactions, and maintain better oversight of their
                      properties. With Berta Hub, managing your home and staying
                      informed becomes faster, more transparent, and
                      stress-free.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button className="inline-flex items-center justify-center rounded-full bg-[#1560BD] hover:bg-[#124ea0] text-white text-sm sm:text-base font-medium px-6 sm:px-8 py-2.5 transition-colors">
                  Learn More
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
