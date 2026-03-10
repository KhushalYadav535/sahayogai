import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary/15 selection:text-primary dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-lg border bg-background/80 backdrop-blur-sm px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-primary/50 focus-visible:ring-primary/15 focus-visible:ring-[3px] focus-visible:shadow-[0_0_12px_hsl(227_90%_45%_/_0.08)]',
        'dark:focus-visible:border-primary/40 dark:focus-visible:ring-primary/20 dark:focus-visible:shadow-[0_0_12px_hsl(220_95%_65%_/_0.1)]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'hover:border-border/80 dark:hover:border-border/60',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
