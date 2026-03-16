"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ visible, children, onClose }) => {
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
            className="
              bg-white
              w-full md:w-[45%]
              rounded-xl
              shadow-xl
              p-5
              overflow-y-auto
              overflow-x-hidden
              max-h-[70vh]
              flex
              flex-col
              relative
              min-w-0
            "
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
                top-2
                right-4
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
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-full min-w-0 break-words">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
