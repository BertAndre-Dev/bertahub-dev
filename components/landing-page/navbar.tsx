"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/landing-page/atom/button";

type NavbarProps = {
  readonly onOpenBookDemo?: () => void;
};

export default function Navbar({ onOpenBookDemo }: NavbarProps) {
  const [activeLink, setActiveLink] = useState("/");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    { href: "#faq", label: "FAQ" },
  ];

  const handleMobileNavClick = (href: string) => {
    setActiveLink(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-[#050816] z-50">
      <div className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer">
          <Image
            src="/assets/Logo.svg"
            alt="Berta logo"
            width={96}
            height={32}
            priority
            className="cursor-pointer"
          />
        </Link>

        {/* Center pill nav (desktop) */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <div className="inline-flex items-center gap-10 rounded-full bg-[#FA812880] px-10 py-3">
            {navLinks.map((link) => {
              const isActive = activeLink === link.href;

              return (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    onClick={() => setActiveLink(link.href)}
                    className="text-sm sm:text-base font-medium text-white hover:text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>

                  {/* Shows on active OR hover */}
                  <span
                    className={`absolute -bottom-2 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-white transition-opacity duration-200
                      ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="https://www.bertahub.com/"
            className="cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              bg="bg-transparent"
              text="text-white"
              rounded="rounded-full"
              padding="px-6 py-2.5"
              className="border border-white/60 hover:bg-white hover:text-[#1560BD] hover:border-white transition-all duration-300 cursor-pointer"
            >
              Sign in
            </Button>
          </Link>

          {onOpenBookDemo ? (
            <Button
              type="button"
              onClick={onOpenBookDemo}
              bg="bg-white"
              text="text-[#1560BD]"
              rounded="rounded-full"
              padding="px-6 py-2.5"
              className="hover:bg-[#e8f0fb] hover:-translate-y-px transition-all duration-300 cursor-pointer"
            >
              Book a Demo
            </Button>
          ) : (
            <Link href="/book-demo" className="cursor-pointer">
              <Button
                bg="bg-white"
                text="text-[#1560BD]"
                rounded="rounded-full"
                padding="px-6 py-2.5"
                className="hover:bg-[#e8f0fb] hover:-translate-y-px transition-all duration-300 cursor-pointer"
              >
                Book a Demo
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile: logo + hamburger only */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white cursor-pointer"
            aria-label="Open menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#050816] inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 cursor-pointer"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />

            <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-[#050816] border-l border-white/10 p-6">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => handleMobileNavClick("/")}
                className="cursor-pointer"
              >
                <Image
                  src="/assets/Logo.svg"
                  alt="Berta logo"
                  width={96}
                  height={32}
                  priority={false}
                  className="cursor-pointer"
                />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center text-white cursor-pointer"
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-10 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleMobileNavClick(link.href)}
                  className="text-white text-lg font-medium cursor-pointer"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-10 grid gap-3">
              {onOpenBookDemo ? (
                <Button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenBookDemo();
                  }}
                  bg="bg-white"
                  text="text-[#1560BD]"
                  rounded="rounded-full"
                  padding="px-6 py-3"
                  className="w-full cursor-pointer"
                >
                  Book a Demo
                </Button>
              ) : (
                <Link
                  href="/book-demo"
                  onClick={() => handleMobileNavClick("/book-demo")}
                  className="cursor-pointer"
                >
                  <Button
                    bg="bg-white"
                    text="text-[#1560BD]"
                    rounded="rounded-full"
                    padding="px-6 py-3"
                    className="w-full cursor-pointer"
                  >
                    Book a Demo
                  </Button>
                </Link>
              )}
              <Link
                href="https://www.bertahub.com/"
                className="cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  bg="bg-transparent"
                  text="text-white"
                  rounded="rounded-full"
                  padding="px-6 py-3"
                  className="w-full border border-white/50 cursor-pointer"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
