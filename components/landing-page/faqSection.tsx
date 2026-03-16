"use client";

import React, { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "What is Berta Hub and how does it help property administrators?",
    answer:
      "Berta Hub is a digital platform that helps estate admins manage operations efficiently. It enables energy intelligence, billing, payment tracking, resident communication, maintenance management, and energy vending from one centralized dashboard.",
  },
  {
    question: "What are Smart Metering and Energy Intelligence in Berta Hub?",
    answer:
      "BertaHub integrates smart metering and energy intelligence to provide real-time visibility into electricity consumption. Facility managers can monitor energy usage, track meter activity, detect irregularities, and access data insights that help improve energy efficiency and operational planning.",
  },
  {
    question:
      "Is BertaHub suitable for different types of estates or properties?",
    answer:
      "Yes. BertaHub is designed for residential estates, serviced apartments, and property managers who need a centralized system to manage residents, payments, and operations efficiently.",
  },
  {
    question: "How can I create and manage residents on the platform?",
    answer:
      "Admins can add homeowners or residents directly from the admin dashboard. You can also invite tenants or homeowners via email or phone number to join and manage their accounts.",
  },
  {
    question: "Can Berta Hub automate service charge or rent billing?",
    answer:
      "Yes. Admins can create rent or service charge bills, assign them to residents, and track payment status in real time. The platform also records payment history automatically.",
  },
  {
    question: "How do residents submit maintenance requests?",
    answer:
      "Residents can submit maintenance requests through the mobile or web app. Admins receive the request on the dashboard, assign it to maintenance personnel, and track its progress until completion.",
  },
  {
    question: "How can administrators communicate with residents?",
    answer:
      "BertaHub allows admins to post announcements and important updates that are instantly visible to residents within the platform.",
  },
  {
    question: "Does BertaHub support electricity token vending?",
    answer:
      "Yes. The platform supports energy vending, allowing residents to purchase electricity tokens directly while administrators can monitor transactions and usage data.",
  },
] as const;

function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  readonly item: { readonly question: string; readonly answer: string };
  readonly index: number;
  readonly isOpen: boolean;
  readonly onToggle: (index: number) => void;
}) {
  return (
    <div className="rounded-[15px] bg-[white] shadow-[0_12px_30px_rgba(16,24,40,0.08)] overflow-hidden">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-4 text-left px-5 sm:px-6 cursor-pointer ${
          isOpen ? "pt-5 sm:pt-6 pb-3" : "py-4 sm:py-5"
        }`}
        onClick={() => onToggle(index)}
      >
        <span
          className={`text-base md:text-[18px] font-bold text-black ${
            isOpen ? "max-w-136" : ""
          }`}
        >
          {item.question}
        </span>
        <span className="text-xl sm:text-2xl font-medium text-black">
          {isOpen ? "–" : "+"}
        </span>
      </button>

      <div
        className={`px-5 sm:px-6 cursor-pointer ${
          isOpen ? "pb-5 sm:pb-6" : "pb-0"
        } overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-base md:text-[18px] font-normal text-[#4C4C4C] leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const columns = [
    { id: "left", offset: 0, items: FAQ_ITEMS.slice(0, 4) },
    { id: "right", offset: 4, items: FAQ_ITEMS.slice(4) },
  ] as const;

  const handleToggle = (idx: number) => {
    setOpenIndex((current) => (current === idx ? -1 : idx));
  };

  return (
    <section
      id="faq"
      className="scroll-mt-28 bg-[#A1A1A11A] py-8 lg:py-16 my-16 lg:my-24"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
        <h2 className="text-center text-[32px] md:text-3xl lg:text-[34px] font-bold text-[#101828]">
          Got Questions. We&apos;ve Got Answers.
        </h2>

        <div className="mt-8 sm:mt-10">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 pr-1">
            {columns.map((col) => (
              <div key={col.id} className="space-y-4">
                {col.items.map((item, localIdx) => {
                  const index = localIdx + col.offset;
                  const isOpen = openIndex === index;

                  return (
                    <FaqItem
                      key={item.question}
                      item={item}
                      index={index}
                      isOpen={isOpen}
                      onToggle={handleToggle}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
