"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

/*
 * Tab v4 (thanh phân đoạn): track xám paper-2 r-2, đoạn r-1 cao 44, chọn = nền trắng nổi bóng 1 + chữ 800. Dải tab cuộn ngang khi hẹp,
 * mép phải mờ dần (hv-scroll-fade) để thấy còn tab phía sau. Radix đặt `data-state=active` trên tab đang chọn.
 */
const tabsListVariants = cva(
  "hv-scroll-fade group/tabs-list flex w-full min-w-0 items-stretch gap-1 rounded-2 bg-paper-2 p-1 pe-8 text-muted group-data-horizontal/tabs:h-control-lg group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-2 rounded-1 px-4 text-16 font-semibold whitespace-nowrap text-ink transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:bg-accent-soft active:bg-accent disabled:pointer-events-none disabled:opacity-55 data-[state=active]:bg-surface data-[state=active]:shadow-1 data-[state=active]:font-extrabold [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-base", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
