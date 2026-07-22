"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Onglets — style "barre soulignée" du design system Standard (voir la
// maquette, docs/sprint5-conception.md), pas le style "pilule" par défaut de
// shadcn/ui.

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn(className)} {...props} />
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "mb-[18px] flex gap-0.5 overflow-x-auto border-b border-border",
        className
      )}
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
        "-mb-px shrink-0 border-b-2 border-transparent px-3.5 py-[9px] text-[12.5px] font-bold whitespace-nowrap text-text-muted transition-colors outline-none data-[state=active]:border-signal data-[state=active]:text-text data-[state=inactive]:hover:text-text-secondary",
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
    <TabsPrimitive.Content data-slot="tabs-content" className={cn(className)} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
