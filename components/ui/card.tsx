import { cn } from '@/lib/utils'

function Card({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ref, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      ref={ref}
      className={cn('text-2xl leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ref, ...props }: React.ComponentProps<'p'>) {
  return <p ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
}

function CardContent({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
