"use client";

import Image from "next/image";
import Link from "next/link";

type HeroSectionProps = {
  readonly onOpenBookDemo?: () => void;
};

export default function HeroSection({ onOpenBookDemo }: HeroSectionProps) {
  return (
    <section className="bg-[#050816] text-white pt-2">
      {/* HERO */}
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] pt-6 sm:pt-8 lg:pt-10 pb-20">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
          {/* Left: Copy */}
          <div className="space-y-6 md:space-y-5 pt-4 lg:pt-8">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-tight font-semibold">
              DIGITAL COMPANION FOR
              <br className="hidden sm:block" /> SMART LIVING.
            </h1>
            <p className="text-sm sm:text-base text-white/85 max-w-lg leading-relaxed">
              Manage your property and energy operations, payments, and
              residents all in one powerful platform. Deliver a modern,
              connected living experience for your communities.
            </p>

            <div className="">
              {onOpenBookDemo ? (
                <button
                  type="button"
                  onClick={onOpenBookDemo}
                  className="inline-flex items-center justify-center rounded-full bg-[#0150AC] hover:bg-[#124ea0] text-base font-medium sm:px-9 px-10 py-2 transition-colors cursor-pointer"
                >
                  Book a demo
                </button>
              ) : (
                <Link
                  href="/book-demo"
                  className="inline-flex items-center justify-center rounded-full bg-[#0150AC] hover:bg-[#124ea0] text-base font-medium sm:px-9 px-10 py-2 transition-colors"
                >
                  Book a demo
                </Link>
              )}
            </div>
          </div>

          {/* Right: Hero image — overflows into the section below */}
          <div className="relative z-10 translate-y-24 md:translate-y-20 lg:translate-y-18 xl:translate-y-16">
            <div className="relative mx-auto max-w-[980px]">
              <Image
                src="/assets/hero.png"
                alt="Berta Hub dashboard and mobile app"
                width={1100}
                height={1000}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
 
      <div
        id="about"
        className="scroll-mt-28 -mt-4 sm:-mt-8 lg:-mt-12 bg-white pb-10"
      >
        <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-[1320px] xl:max-w-[1440px]">
       
          <div className="pt-6">
            <div className="relative overflow-hidden rounded-3xl bg-[#111827]">
              <Image
                src="/assets/all-in-one.svg"
                alt="Modern apartment building background"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1320px"
                priority={false}
              />

              <div className="relative flex flex-col lg:flex-row items-stretch gap-8 lg:gap-0 p-6 md:p-8">
          
                <div className="w-full lg:w-1/2 flex items-center justify-center">
                  <Image
                    src="/assets/phone.svg"
                    alt="Berta Hub mobile app"
                    width={260}
                    height={920}
                    className="max-h-full w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2 text-white flex flex-col justify-center">
                  <h2 className="text-2xl md:text-[42px] font-semibold leading-tight">
                    All-in-one Property and Energy
                    <br className="hidden sm:block" /> Management Solution
                  </h2>

                  <div className="mt-2 h-[3px] w-24 rounded-full bg-[#FA8128]" />

                  <p className="mt-5 text-base md:text-[20px] xl:text-[24px] text-white/90 max-w-2xl leading-relaxed">
                    Berta Hub is built for forward-thinking property operators,
                    community managers, landlords, and developers who want to
                    deliver exceptional experiences at scale.
                  </p>

                  <div className="mt-4 sm:mt-5">
                    <p className="text-base md:text-[20px] xl:text-[24px] font-semibold mb-2">
                      With BertaHub, you can:
                    </p>

                    <ul className="space-y-1.5 sm:space-y-2 text-base md:text-[20px] xl:text-[24px] text-white/90 leading-relaxed list-disc pl-5">
                      <li>Get insights on energy consumption</li>
                      <li>Automate billing, collections, and utilities</li>
                      <li>Simplify payments and financial tracking</li>
                      <li>
                        Centralize operations across properties and communities
                      </li>
                      <li>
                        Manage service requests and maintenance effortlessly
                      </li>
                      <li>Enhance transparency, accountability, and trust</li>
                      <li>Deliver a modern, connected living experience</li>
                    </ul>
                  </div> 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
