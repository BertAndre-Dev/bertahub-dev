"use client";

import React from "react";
import Image from "next/image";

interface Partner {
  id: number;
  name: string;
  logo: string;
}

const partners: Partner[] = [
  { id: 1, name: "Kabana", logo: "/assets/kabana.svg" },
  { id: 2, name: "Ezra Court Two", logo: "/assets/ezra-court.svg" },
  { id: 3, name: "Primquisite", logo: "/assets/primquisite.svg" },
];

const TrustedBy = () => {
  return (
    <section className="w-full py-12 bg-[#A1A1A11A]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <p className="text-center text-[32px] md:text-[48px] font-bold uppercase tracking-widest">
            Trusted by
          </p>
          <div className="mt-2 h-[3px] w-24 rounded-full bg-[#FA8128]" />
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#f5f5f5] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#f5f5f5] to-transparent z-10 pointer-events-none" />

          {/* Marquee track — two identical rows for seamless loop */}
          <div
            className="flex w-max"
            style={{
              animation: "trustedByMarquee 18s linear infinite",
            }}
          >
            {/* Row 1 */}
            {partners.map((partner) => (
              <div
                key={`a-${partner.id}`}
                className="flex items-center justify-center h-32 px-12 flex-shrink-0"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={500}
                  height={300}
                  className="object-contain max-h-24 w-auto"
                />
              </div>
            ))}
            {/* Row 2 — exact clone for seamless loop */}
            {partners.map((partner) => (
              <div
                key={`b-${partner.id}`}
                className="flex items-center justify-center h-32 px-12 flex-shrink-0"
                aria-hidden="true"
              >
                <Image
                  src={partner.logo}
                  alt=""
                  width={500}
                  height={300}
                  className="object-contain max-h-24 w-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe injected inline — no extra CSS file needed */}
      <style>{`
        @keyframes trustedByMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .flex[style*="trustedByMarquee"] {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustedBy;
