import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-white/20 bg-white/10 text-white hover:bg-white/20",
        secondary:
          "border-white/15 bg-white/5 text-gray-300 hover:bg-white/10",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30",
        outline: "text-gray-300 border-white/20 hover:bg-white/10",
        success: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30",
        warning: "border-yellow-500/30 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30",
        attention: "border-amber-500/30 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
