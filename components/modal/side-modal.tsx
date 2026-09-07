"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
};

export default function SideModal({
  visible,
  children,
  onClose,
  widthClassName = "w-full sm:w-[420px]",
}: Readonly<Props>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => setShow(false), 200);
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
          className="fixed inset-0 bg-black/30 z-40 p-4 pb-24 flex items-end justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={[
              "bg-white rounded-2xl shadow-xl overflow-hidden relative min-w-0",
              "max-h-[80vh] flex flex-col",
              "z-60",
              widthClassName,
            ].join(" ")}
            initial={{ x: 40, y: 20, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 40, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white border border-black/10 p-1.5 rounded-full transition-colors"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            <div className="w-full min-w-0 wrap-break-word overflow-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

