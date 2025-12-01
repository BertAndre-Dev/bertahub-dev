import * as React from "react"
import { cn } from "@/lib/utils" // Optional: if you don’t have this, see below

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * A simple reusable label component
 * Adds consistent spacing, font style, and accessibility.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1",
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
)

Label.displayName = "Label"

export { Label }
