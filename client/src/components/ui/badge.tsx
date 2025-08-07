import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge-modern inline-flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "badge-blue",
        secondary: "badge-blue-light",
        destructive: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white",
        success: "badge-mint",
        warning: "badge-gold",
        info: "badge-sky",
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
