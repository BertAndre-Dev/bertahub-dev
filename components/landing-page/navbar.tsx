"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/landing-page/atom/button";
import { useBookDemo } from "@/components/landing-page/book-demo-provider";

type NavbarProps = Readonly<{
  /** When true, nav is not sticky/fixed and has no bottom border (landing hero frame). */
  embedded?: boolean;
}>;

export default function Navbar({ embedded = false }: NavbarProps) {
  const { openBookDemo } = useBookDemo();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState("/");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#about", label: "About" },
    { href: "/#features", label: "Features" },
    { href: "/#faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/blog") {
      return pathname === "/blog" || pathname.startsWith("/blog/");
    }
    if (href === "/") {
      return pathname === "/";
    }
    return activeLink === href;
  };

  const handleMobileNavClick = (href: string) => {
    setActiveLink(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`z-50 w-full bg-white ${
        embedded ? "relative" : "sticky top-0 border-b border-[#E8EEF6] bg-white/90 backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center cursor-pointer">
          <Image
            src="/assets/hero/logo.svg"
            alt="Berta"
            width={96}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="inline-flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setActiveLink(link.href)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                    isActive
                      ? "bg-[#E8F1FB] text-[#0150AC]"
                      : "text-[#0150AC]/80 hover:bg-[#F3F7FC] hover:text-[#0150AC]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="https://www.bertahub.com/auth/login"
            className="cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              bg="bg-white"
              text="text-[#0150AC]"
              rounded="rounded-full"
              padding="px-5 py-2.5"
              className="border border-[#C5D4E8] transition-colors duration-150 ease-out hover:bg-[#E8F1FB] cursor-pointer active:scale-[0.97]"
            >
              Login
            </Button>
          </Link>

          <Button
            type="button"
            onClick={openBookDemo}
            bg="bg-[#0150AC]"
            text="text-white"
            rounded="rounded-full"
            padding="px-5 py-2.5"
            className="transition-colors duration-150 ease-out hover:bg-[#124ea0] cursor-pointer active:scale-[0.97]"
          >
            Book a Demo
          </Button>
        </div>

        <div className="flex items-center lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0150AC] cursor-pointer active:scale-[0.97]"
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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 cursor-pointer"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-[#E8EEF6] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => handleMobileNavClick("/")}
                className="cursor-pointer"
              >
                <Image
                  src="/assets/hero/logo.svg"
                  alt="Berta"
                  width={96}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center text-[#0150AC] cursor-pointer"
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

            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => handleMobileNavClick(link.href)}
                    className={`rounded-xl px-4 py-3 text-base font-medium cursor-pointer ${
                      isActive
                        ? "bg-[#E8F1FB] text-[#0150AC]"
                        : "text-[#0150AC]/90 hover:bg-[#F3F7FC]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-4 grid gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openBookDemo();
                  }}
                  bg="bg-[#0150AC]"
                  text="text-white"
                  rounded="rounded-full"
                  padding="px-6 py-3"
                  className="w-full cursor-pointer"
                >
                  Book a Demo
                </Button>
                <Link
                  href="https://www.bertahub.com/auth/login"
                  className="cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    bg="bg-white"
                    text="text-[#0150AC]"
                    rounded="rounded-full"
                    padding="px-6 py-3"
                    className="w-full border border-[#C5D4E8] cursor-pointer"
                  >
                    Login / Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
