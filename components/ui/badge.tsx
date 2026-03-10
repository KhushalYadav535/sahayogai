import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm [a&]:hover:from-blue-700 [a&]:hover:to-indigo-700',
        secondary:
          'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 [a&]:hover:bg-slate-200 dark:[a&]:hover:bg-slate-700',
        destructive:
          'border-transparent bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm [a&]:hover:from-red-600 [a&]:hover:to-rose-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        success:
          'border-transparent bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm [a&]:hover:from-emerald-600 [a&]:hover:to-green-600',
        warning:
          'border-transparent bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-sm [a&]:hover:from-amber-500 [a&]:hover:to-orange-500',
        info:
          'border-transparent bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-sm [a&]:hover:from-blue-500 [a&]:hover:to-cyan-500',
        outline:
          'text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
