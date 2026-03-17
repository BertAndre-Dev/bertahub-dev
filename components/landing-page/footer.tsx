"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#about" },
  // { label: "Business", href: "/" },
  { label: "Contact Us", href: "/contact" },
];

const SERVICES = [{ label: "Businesses", href: "/" }];

const INFORMATION = [
  { label: "Privacy Policy", href: "/privacy-notice" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "FAQ", href: "/#faq" },
];

function FooterColumn({
  heading,
  links,
}: {
  readonly heading: string;
  readonly links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-white font-bold text-[14px] md:text-base mb-4">
        {heading}
      </h3>
      <ul className="flex flex-col gap-4">
        {links.map(({ label, href }) => (
          <li key={`${href}-${label}`}>
            <Link
              href={href}
              className="text-[#FFFFFF80] text-[14px] md:text-[18px] font-light md:font-normal hover:text-white transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcons() {
  return (
    <div className="flex items-center gap-3 mt-2">
      <a
        href="https://www.instagram.com/bertandregroup?igsh=MWIwZzlnZHRzb2gweQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FA8128] hover:bg-white/20 transition-colors text-white"
        aria-label="Instagram"
      >
        <Image
          src="/assets/instagram.svg"
          className="w-5 h-5"
          alt="Instagram"
          width={20}
          height={20}
          loading="lazy"
        />
      </a>
      <a
        href="https://youtube.com/bertandregroup"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FA8128] hover:bg-white/20 transition-colors text-white"
        aria-label="YouTube"
      >
        <Image
          src="/assets/youtube.svg"
          className="w-5 h-5"
          alt="YouTube"
          width={20}
          height={20}
          loading="lazy"
        />
      </a>
      <a
        href="https://www.facebook.com/share/18D87Hinyn/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FA8128] hover:bg-white/20 transition-colors text-white"
        aria-label="Facebook"
      >
        <Image
          src="/assets/facebook.svg"
          className="w-5 h-5"
          alt="Facebook"
          width={20}
          height={20}
          loading="lazy"
        />
      </a>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A]">
      <div
        className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 pt-12 pb-8 " 
        // className="container mx-auto px-4 pt-12 pb-8 lg:pt-16 lg:pb-10"
      >
        <div>
          {/* Brand */}
          <div className="lg:col-span-2 pb-6">
            <Link href="/" className="inline-flex flex-col gap-1">
              <div className="flex flex-col items-start md:gap-3">
                <Image
                  src="/assets/Logo2.svg"
                  alt="Logo"
                  width={500}
                  height={350}
                  loading="lazy"
                />
                  <p className="text-white text-[14px] md:text-[16px] lg:text-[18px] font-normal pt-4">
                    Purpose-driven ventures. Built to scale.
                  </p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 xl:gap-16 pt-6">
            <FooterColumn heading="Quick Links" links={QUICK_LINKS} />
            <FooterColumn heading="Services" links={SERVICES} />
            <FooterColumn heading="Information" links={INFORMATION} />

            {/* Social + contact */}
            <div>
              <h3 className="text-white font-semibold text-sm sm:text-base mb-4">
                Social
              </h3>
              <a
                href="mailto:info@bertandregroup.com"
                className="text-[#FFFFFF80] text-sm hover:text-white transition-colors block mb-1"
              >
                info@bertandregroup.com
              </a>
              <a
                href="tel:09138667927"
                className="text-[#FFFFFF80] text-sm hover:text-white transition-colors block mb-3"
              >
                09138667927
              </a>
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="flex justify-center px-4 pt-6">
        <p className="bg-[#E5E5E5] text-[#4C4C4C] text-[14px] md:text-[18px] font-normal py-3 px-6 rounded-tl-3xl rounded-tr-3xl">
          © BertAndre. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
