"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  /** Optional: override modal panel classes (width, padding, etc). */
  contentClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  children,
  onClose,
  contentClassName,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => setShow(false), 300);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={cn(
              "bg-white rounded-xl shadow-xl p-5 overflow-y-auto overflow-x-hidden max-h-[70vh] flex flex-col relative min-w-0 w-full",
              contentClassName ?? "md:w-[45%] lg:w-[40%] xl:w-[40%]",
            )}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <button
              onClick={onClose}
              className="
                absolute
                cursor-pointer
                hover:cursor-pointer
                top-2
                right-4
                z-20
                bg-[#d0dff2]
                border
                border-black
                p-1
                rounded-full
                hover:bg-gray-100
                transition-colors
                focus:outline-none
                focus:ring-2
                focus:ring-gray-300
              "
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="relative w-full min-w-0">
              {/* subtle center watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Image
                  src="/chat-Logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={320}
                  height={120}
                  className="hidden sm:block w-[160px] md:w-[200px] lg:w-[240px] h-auto object-contain opacity-[0.035] blur-[0.2px]"
                />
              </div>

              <div className="relative z-10 wrap-break-word">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;