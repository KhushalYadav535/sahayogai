import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 dark:from-blue-500 dark:to-indigo-500',
        destructive:
          'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border bg-background/80 backdrop-blur-sm shadow-xs hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:hover:border-primary/40',
        secondary:
          'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 shadow-xs hover:from-slate-200 hover:to-slate-300 hover:-translate-y-0.5 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-700',
        ghost:
          'hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-accent/30',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] hover:-translate-y-0.5',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-11 rounded-lg px-6 has-[>svg]:px-4 text-base',
        xl: 'h-12 rounded-xl px-8 has-[>svg]:px-5 text-base font-bold',
        icon: 'size-9 rounded-lg',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant || 'default'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
