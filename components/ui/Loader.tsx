"use client";

import Image from "next/image";

type LoaderProps = {
  fullScreen?: boolean;
  label?: string;
};

export default function Loader({
  fullScreen = false,
  label = "Loading...",
}: Readonly<LoaderProps>) {
  const wrapperClassName = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    : "h-full w-full flex items-center justify-center";

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className={`${wrapperClassName} bg-primary/50 rounded-full p-2 flex items-center justify-center animate-breathe`}
    >
        <Image
          src="/chatLogo2.svg"
          alt=""
          width={40}
          height={40}
          priority={fullScreen}
          className="animate-breathe select-none"
        />
    </div>
  );
}