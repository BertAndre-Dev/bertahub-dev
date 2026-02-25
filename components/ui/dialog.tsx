"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    // sync external `open` prop with internal state when provided
    if (typeof open === "boolean") {
      setIsOpen(open);
    }
  }, [open]);

  const handleToggle = (value: boolean) => {
    setIsOpen(value)
    onOpenChange?.(value)
  }

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen: handleToggle }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const { setIsOpen } = React.useContext(DialogContext)
  return (
    <div onClick={() => setIsOpen(true)} className="inline-block">
      {children}
    </div>
  )
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isOpen, setIsOpen } = React.useContext(DialogContext)
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}
