
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, value, ...props }, ref) => {
    const hasValue = value !== undefined;
    const safeValue = typeof value === "number" && isNaN(value) ? "" : value;
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...(hasValue ? { value: safeValue ?? "" } : {})}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

    