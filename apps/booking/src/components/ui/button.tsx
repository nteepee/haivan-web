import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/* Nút v4: cao 48 (52 lớn, 44 nhỏ), không viền, r-1 (nút vuông chỉ-có-icon: tròn), chữ 16/24 800, :active lún 1px, disabled 55%. Vòng focus lấy từ :focus-visible toàn cục.
   `cn` không gộp class xung đột nên bán kính nằm trong từng size, không ở base. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 text-16 font-extrabold whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-(--dur-micro) ease-(--ease-out) select-none touch-manipulation active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 aria-busy:cursor-progress aria-invalid:ring-2 aria-invalid:ring-inset aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-ink hover:bg-accent-hover",
        outline: "bg-paper-2 text-ink ring-1 ring-rule ring-inset hover:bg-paper-3 active:bg-paper-3 aria-expanded:bg-paper-3",
        secondary: "bg-paper-2 text-ink ring-1 ring-rule ring-inset hover:bg-paper-3 active:bg-paper-3",
        ghost: "text-ink hover:bg-accent-soft aria-expanded:bg-accent-soft",
        destructive: "bg-error-soft text-error ring-1 ring-error ring-inset hover:bg-error hover:text-surface",
        link: "min-h-tap text-ink underline decoration-1 underline-offset-4 hover:bg-accent-soft",
      },
      size: {
        default: "h-control rounded-1 px-6",
        xs: "h-tap rounded-1 px-3 text-14",
        sm: "h-tap rounded-1 px-4",
        lg: "h-control-lg rounded-1 px-8 text-18",
        icon: "size-control rounded-round",
        "icon-xs": "size-tap rounded-round",
        "icon-sm": "size-tap rounded-round",
        "icon-lg": "size-control-lg rounded-round",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
