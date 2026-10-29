import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "hv-field min-w-0 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-14 file:font-semibold",
        className
      )}
      {...props}
    />
  )
}

export { Input }
