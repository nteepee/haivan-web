import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "hv-field flex field-sizing-content min-h-24 py-3",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
