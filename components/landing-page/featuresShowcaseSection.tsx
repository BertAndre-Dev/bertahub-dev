"use client";

import React, { useState } from "react";
import Image from "next/image";

export type FeatureCardProps = {
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
  imageSrc: string;
  imageAlt: string;
  tiltAngle?: number;
  initialTransform?: string;
  hoverTransform?: string;
};

function FeatureCard({
  title = "",
  description = "",
  iconSrc,
  iconAlt = "",
  imageSrc,
  imageAlt = "",
  tiltAngle = 0,
  initialTransform,
  hoverTransform,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const titleLines = (title ?? "").split("\n");

  const baseTransform =
    initialTransform ?? `rotate(${tiltAngle}deg) translateY(0px)`;
  const hoveredTransform = hoverTransform ?? "rotate(0deg) translateY(-20px)";

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className="
    relative flex flex-col overflow-hidden rounded-2xl
    bg-[#1A1D23] border border-white/[0.06]
    transition-all duration-300 ease-out
    hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
    cursor-default group
  "
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Top content ─────────────────────────────── */}
      <div className="flex flex-col gap-8 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          {/* Title */}
          <h3 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
            {titleLines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h3>
          {/* Icon badge */}
          <div className="w-11 h-11 rounded-full bg-[#1E3A5F] flex items-center justify-center shrink-0">
            <Image
              src={iconSrc}
              alt={iconAlt}
              width={22}
              height={22}
              className="object-contain"
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-white/60 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </div>

      {/* ── Image area ──────────────────────────────── */}
      <div className="relative mt-auto flex items-end justify-center overflow-hidden px-6 pb-4 min-h-[240px] sm:min-h-[280px]">
        <div
          style={{
            transform: isHovered ? hoveredTransform : baseTransform,
            transition: "transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1)",
            transformOrigin: "center bottom",
            width: "100%",
            maxWidth: "340px",
          }}
          className="will-change-transform"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={400}
            height={280}
            className="w-full h-auto object-contain drop-shadow-2xl transition-transform duration-700 ease-out"
          />
        </div>
      </div>
    </div>
  );
}

const FEATURES: readonly FeatureCardProps[] = [
  {
    title: "Energy\nIntelligence",
    description:
      "Monitor electricity consumption in real time, analyze usage trends, detect anomalies, and make smarter energy decisions across homes, estates, and facilities.",
    iconSrc: "/assets/feature/energyIcon.svg",
    iconAlt: "Energy intelligence icon",
    imageSrc: "/assets/feature/energy2.svg",
    imageAlt: "Energy intelligence dashboard preview",
    tiltAngle: -17,
    initialTransform: "rotate(16deg) translate(-48px, 86px)",
    hoverTransform: "rotate(-17deg) translateY(0px)",
  },
  {
    title: "Property\nManagement",
    description:
      "Manage estates efficiently with digital tools for billing, maintenance requests, announcements, resident communication, and transparent financial tracking in one platform.",
    iconSrc: "/assets/feature/propertyIcon.svg",
    iconAlt: "Property management icon",
    imageSrc: "/assets/feature/property.svg",
    imageAlt: "Property management dashboard preview",
    tiltAngle: 0,
  },
  {
    title: "Energy\nVending",
    description:
      "Buy electricity tokens instantly, recharge meters seamlessly, track transactions, and manage energy payments conveniently through a secure digital platform.",
    iconSrc: "/assets/feature/energyVendingIcon.svg",
    iconAlt: "Energy vending icon",
    imageSrc: "/assets/feature/energyVending2.svg",
    imageAlt: "Energy vending dashboard preview",
    tiltAngle: 12,
    initialTransform: "rotate(-18deg) translate(35px, 92px)",
    hoverTransform: "rotate(18deg) translate(11px, 19px)",
  },
];

// ─── Section ─────────────────────────────────────────────────────────────────

export default function FeaturesShowcaseSection() {
  return (
    <section
      id="features"
      className="scroll-mt-28 bg-[#0B0D10] py-8 lg:py-16 my-16 lg:my-24"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">
            Features
          </h2>
          <div className="mt-2 h-[3px] w-20 rounded-full bg-[#FA8128]" />
          <p className="mt-4 text-white/75 text-sm sm:text-base max-w-2xl">
            We help communities work better, making management simpler and
            giving residents and owners easy access to everyday services.
          </p>
        </div>

        <div className="mt-10 lg:mt-14 grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
